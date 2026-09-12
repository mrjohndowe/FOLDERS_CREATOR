import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Settings exposes the INI-backed near-instant message detection interval', async () => {
  const html = await readFile(new URL('../public/settings.html', import.meta.url), 'utf8');
  assert.match(html, /data-setting="LOVENSE_REMOTE_POLL_MS"/);
  assert.match(html, /min="100" max="30000" value="250"/);
  assert.match(html, /250 is near-instant/);
});
