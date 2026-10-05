// Coverage Items for Input Validation: NFR-006 sampai NFR-008
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, apiRoutes, allSourceFiles, walk, found, lineOf } from './helpers.mjs';

const route = (name) => apiRoutes().find((f) => f.includes(`/${name}/`));
const schemaCheck = /safeParse\(|\.parse\(|z\.object\(/;

describe('NFR-006 Input pengguna divalidasi di sisi server', () => {
  [
    ['TC-INP-01', 'login'],
    ['TC-INP-02', 'register'],
    ['TC-INP-03', 'businesses'],
    ['TC-INP-04', 'transactions'],
  ].forEach(([id, name]) => {
    test(`${id} route ${name} memvalidasi body dengan skema (Zod)`, () => {
      assert.ok(schemaCheck.test(read(route(name))), `${route(name)} memakai isi request tanpa skema validasi`);
    });
  });

  test('TC-INP-05 route ocr memeriksa field wajib sebelum diproses', () => {
    assert.ok(/if\s*\(\s*!imageBase64\s*\|\|\s*!mimeType\s*\)/.test(read(route('ocr'))));
  });

  test('TC-INP-06 route chat memeriksa messages berupa array', () => {
    assert.ok(/Array\.isArray\(\s*messages\s*\)/.test(read(route('chat'))));
  });

  test('TC-INP-07 Zod yang terpasang di package.json diimpor di source', () => {
    const terpasang = 'zod' in (JSON.parse(read('package.json')).dependencies ?? {});
    const dipakai = allSourceFiles().some((f) => /from\s+['"]zod['"]/.test(read(f)));
    assert.ok(!terpasang || dipakai, 'zod ada di package.json tetapi tidak diimpor di source mana pun');
  });
});

describe('NFR-007 Validasi memakai allowlist dan tidak ada mass assignment', () => {
  test('TC-INP-08 route ocr membatasi kategori hanya dari daftar yang diizinkan', () => {
    assert.ok(/CATEGORIES\.includes\(/.test(read(route('ocr'))));
  });

  test('TC-INP-09 route ocr memverifikasi format tanggal YYYY-MM-DD', () => {
    assert.ok(/\\d\{4\}-\\d\{2\}-\\d\{2\}/.test(read(route('ocr'))));
  });

  test('TC-INP-10 route businesses tidak menyebar ...body langsung ke insert', () => {
    assert.ok(!/\.\.\.body\b/.test(read(route('businesses'))), 'Isi request disebar utuh ke database');
  });

  test('TC-INP-11 route transactions tidak menyebar ...body langsung ke insert', () => {
    assert.ok(!/\.\.\.body\b/.test(read(route('transactions'))), 'Isi request disebar utuh ke database');
  });
});

describe('NFR-008 Query dan output tidak dibangun dari string input mentah', () => {
  test('TC-INP-12 tidak ada interpolasi string pada filter .or() atau .filter()', () => {
    const pattern = /\.(or|filter)\(\s*`[^`]*\$\{/g;
    const hits = [];
    for (const f of [...apiRoutes(), ...walk('services')]) {
      const src = read(f);
      for (const m of src.matchAll(pattern)) hits.push(`${f}:${lineOf(src, m.index)}`);
    }
    assert.ok(hits.length === 0, found(hits));
  });

  test('TC-INP-13 tidak ada dangerouslySetInnerHTML di komponen', () => {
    const hits = allSourceFiles().filter((f) => /dangerouslySetInnerHTML/.test(read(f)));
    assert.ok(hits.length === 0, `Dipakai di: ${hits.join(', ')}`);
  });
});
