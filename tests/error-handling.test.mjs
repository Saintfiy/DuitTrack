// Coverage Items for Error Handling: NFR-009 sampai NFR-011
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, apiRoutes, walk, found, lineOf } from './helpers.mjs';

describe('NFR-009 Operasi yang bisa gagal punya penanganan error', () => {
  apiRoutes().forEach((file, i) => {
    test(`TC-ERR-0${i + 1} ${file} dibungkus try/catch`, () => {
      const src = read(file);
      assert.ok(/\btry\s*\{/.test(src) && /\bcatch\b/.test(src), 'handler tidak punya try/catch');
    });
  });
});

describe('NFR-010 Error tidak ditelan diam-diam', () => {
  const files = ['app', 'components', 'hooks', 'lib', 'services', 'store', 'utils'].flatMap((d) => walk(d));

  test('TC-ERR-07 tidak ada blok catch kosong', () => {
    const hits = [];
    for (const f of files) {
      const src = read(f);
      for (const m of src.matchAll(/catch\s*(\([^)]*\))?\s*\{\s*\}/g)) hits.push(`${f}:${lineOf(src, m.index)}`);
    }
    assert.ok(hits.length === 0, found(hits));
  });

  test('TC-ERR-08 catch di utils, lib, dan services mencatat atau melempar ulang error', () => {
    const hits = [];
    for (const f of ['utils', 'lib', 'services'].flatMap((d) => walk(d))) {
      const src = read(f);
      for (const m of src.matchAll(/catch\s*(?:\([^)]*\))?\s*\{([^{}]*)\}/g)) {
        if (!/console\.|throw\s|logger\./.test(m[1])) hits.push(`${f}:${lineOf(src, m.index)}`);
      }
    }
    assert.ok(hits.length === 0, found(hits));
  });
});

describe('NFR-011 Pesan error ke pengguna bersifat generik', () => {
  apiRoutes().forEach((file, i) => {
    test(`TC-ERR-${String(9 + i).padStart(2, '0')} ${file} tidak mengirim error.message mentah ke klien`, () => {
      const hits = [...read(file).matchAll(/NextResponse\.json\(\s*\{\s*error:\s*(err|error)\.message/g)];
      assert.ok(hits.length === 0, `${hits.length} respons membocorkan error.message`);
    });
  });

  test('TC-ERR-15 ada error boundary Next.js (app/error.tsx atau app/global-error.tsx)', () => {
    assert.ok(exists('app/error.tsx') || exists('app/global-error.tsx'), 'error boundary belum ada');
  });
});
