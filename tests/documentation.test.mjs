// Coverage Items for Maintainability (Documentation): NFR-015 dan NFR-016
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, walk, apiRoutes } from './helpers.mjs';

const tanpaJsdoc = (files) => files.filter((f) => !/\/\*\*[\s\S]*?\*\//.test(read(f)));

describe('NFR-015 Fungsi utama punya komentar penjelasan (JSDoc)', () => {
  [
    ['TC-DOC-01', 'utils', () => walk('utils')],
    ['TC-DOC-02', 'services', () => walk('services').filter((f) => !f.endsWith('index.ts'))],
    ['TC-DOC-03', 'hooks', () => walk('hooks').filter((f) => !f.endsWith('index.ts'))],
    ['TC-DOC-04', 'app/api', () => apiRoutes()],
  ].forEach(([id, label, files]) => {
    test(`${id} setiap file di ${label} memiliki minimal satu blok JSDoc`, () => {
      const missing = tanpaJsdoc(files());
      assert.ok(missing.length === 0, `${missing.length} file tanpa JSDoc: ${missing.join(', ')}`);
    });
  });
});

describe('NFR-016 README menjelaskan cara memakai proyek', () => {
  const readme = exists('README.md') ? read('README.md') : '';

  test('TC-DOC-05 README memuat langkah instalasi (npm install)', () => {
    assert.ok(/npm install|yarn install|pnpm install|npm i\b/i.test(readme), 'langkah instalasi tidak ditemukan');
  });

  test('TC-DOC-06 README memuat cara menjalankan aplikasi (npm run dev)', () => {
    assert.ok(/npm run dev|yarn dev|pnpm dev/i.test(readme), 'cara menjalankan tidak ditemukan');
  });

  test('TC-DOC-07 README mencantumkan environment variable yang dibutuhkan', () => {
    assert.ok(/SUPABASE_URL|\.env/i.test(readme), 'daftar environment variable tidak ditemukan');
  });

  test('TC-DOC-08 tersedia file contoh environment (.env.example)', () => {
    assert.ok(exists('.env.example'), '.env.example belum ada');
  });
});
