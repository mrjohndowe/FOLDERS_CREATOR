import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Reply Studio prompt uses configured INI persona and relationship fields', async () => {
  const source = await readFile(new URL('../src/remote-server.js', import.meta.url), 'utf8');
  assert.match(source, /Configured persona and relationship facts from config\.ini/);
  for (const field of [
    'chatUsername', 'chatDisplayName', 'chatFirstName', 'chatLastName', 'chatDateOfBirth',
    'chatPlaceOfBirth', 'chatChildren', 'chatAge', 'chatPronouns', 'chatLocation',
    'chatOccupation', 'chatRelationshipStatus', 'chatInterests'
  ]) assert.match(source, new RegExp(`config\\.${field}`));
  assert.doesNotMatch(source, /value\.(?:persona|relationship|tone)/);
});
