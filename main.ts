// One-Line Laugh-Off entry program.
// Validates the entry gate (UTF-8 text, 1-200 chars, not only whitespace),
// empties /output's contents only, writes entry.txt, and verifies with a
// sha256 read-back.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const ENTRY =
  "My fridge just sent me a notification: 'You opened me 14 times today and ate nothing. I'm starting to think you're only here for the light.'";

function main(): void {
  // Fail fast: the entry must be a single line with no control characters
  // or BOM, and its UTF-8 byte length must stay within a sane cap.
  if (ENTRY.includes('\n') || ENTRY.includes('\r')) {
    throw new Error('entry must be a single line');
  }
  if (/[\u0000-\u001F\u007F\uFEFF]/.test(ENTRY)) {
    throw new Error('entry contains a control character or BOM');
  }
  const byteLen = Buffer.byteLength(ENTRY, 'utf8');
  if (byteLen > 800) {
    throw new Error(`entry UTF-8 byte length ${byteLen} exceeds the 800-byte sanity cap`);
  }

  // Gate: 1-200 UTF-8 characters, not only whitespace.
  if (ENTRY.length < 1 || ENTRY.length > 200) {
    throw new Error(`entry length ${ENTRY.length} is outside the 1-200 char gate`);
  }
  if (ENTRY.trim().length === 0) {
    throw new Error('entry is only whitespace');
  }

  // /output is a shared mounted directory: empty its CONTENTS only,
  // never remove the directory itself.
  if (!existsSync('/output')) {
    mkdirSync('/output', { recursive: true });
  }
  for (const name of readdirSync('/output')) {
    rmSync(`/output/${name}`, { recursive: true, force: true });
  }

  writeFileSync('/output/entry.txt', ENTRY, 'utf8');

  const written = readFileSync('/output/entry.txt', 'utf8');
  if (written !== ENTRY) {
    throw new Error('read-back mismatch: /output/entry.txt does not hold exactly the entry');
  }
  const sha = createHash('sha256').update(written, 'utf8').digest('hex');
  console.log(`entry: ${ENTRY.length} chars, sha256 ${sha}`);
  console.log('ok: /output/entry.txt holds exactly the entry');
}

main();
