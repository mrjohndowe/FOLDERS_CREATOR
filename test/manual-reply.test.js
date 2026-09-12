import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/remote-server.js', import.meta.url), 'utf8');

function endpointSource(pathname, nextPathname) {
  const start = source.indexOf(`pathname === '${pathname}'`);
  const end = source.indexOf(`pathname === '${nextPathname}'`, start);
  assert.ok(start >= 0 && end > start, `expected ${pathname} endpoint source`);
  return source.slice(start, end);
}

test('manual Place draft reopens and verifies the queued recipient', () => {
  const endpoint = endpointSource('/api/review/draft', '/api/review/send');
  const reopen = endpoint.indexOf('await bridge.openConversation(item.conversation);');
  const fill = endpoint.indexOf('await bridge.fillDraft(item.reply, item.conversation);');
  assert.ok(reopen >= 0 && fill > reopen);
});

test('manual Send now reopens the queued recipient before verified typing and send', () => {
  const endpoint = endpointSource('/api/review/send', '/api/review/dismiss');
  const reopen = endpoint.indexOf('await bridge.openConversation(item.conversation);');
  const send = endpoint.indexOf('await bridge.typeAndSend(');
  assert.ok(reopen >= 0 && send > reopen);
  assert.match(endpoint, /item\.reply,\s*item\.conversation/);
});
