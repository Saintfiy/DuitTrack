// Coverage Items for Performance Efficiency: NFR-017 dan NFR-018
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, walk, awaitInLoopLines, allSourceFiles, apiRoutes, found, lineOf } from './helpers.mjs';

describe('NFR-017 Tidak ada await berurutan di dalam loop tanpa alasan', () => {
  test('TC-PRF-01 tidak ada await di dalam loop (kecuali route ocr yang dikecualikan)', () => {
    const hits = [];
    for (const f of allSourceFiles().filter((x) => x !== 'app/api/ocr/route.ts')) {
      for (const line of awaitInLoopLines(read(f))) hits.push(`${f}:${line}`);
    }
    assert.ok(hits.length === 0, found(hits));
  });

  test('TC-PRF-02 await di loop route ocr hanya untuk fallback model (ada continue dan MODEL_PRIORITY)', () => {
    const src = read('app/api/ocr/route.ts');
    assert.ok(awaitInLoopLines(src).length > 0, 'pengecualian ini tidak lagi ada');
    assert.ok(/MODEL_PRIORITY/.test(src) && /\bcontinue\b/.test(src), 'loop bukan pola fallback');
  });
});

describe('NFR-018 Data besar dimuat bertahap, bukan sekaligus', () => {
  /** Statement query Supabase yang memakai select('*') tanpa limit, range, atau single. */
  const unbounded = (file) => {
    const src = read(file);
    const hits = [];
    for (const m of src.matchAll(/supabase\s*\.from\([^)]*\)[\s\S]*?;/g)) {
      const stmt = m[0];
      if (/\.select\(\s*['"`]\*['"`]\s*\)/.test(stmt) && !/\.(limit|range|single|maybeSingle)\(/.test(stmt)) {
        hits.push(`${file}:${lineOf(src, m.index)}`);
      }
    }
    return hits;
  };

  [
    ['TC-PRF-03', 'services/auth.service.ts'],
    ['TC-PRF-04', 'services/business.service.ts'],
    ['TC-PRF-05', 'services/crm.service.ts'],
    ['TC-PRF-06', 'services/inventory.service.ts'],
    ['TC-PRF-07', 'services/transaction.service.ts'],
  ].forEach(([id, file]) => {
    test(`${id} ${file} tidak punya query select('*') tanpa limit atau pagination`, () => {
      const hits = unbounded(file);
      assert.ok(hits.length === 0, found(hits));
    });
  });

  test('TC-PRF-08 route transactions tidak memuat seluruh transaksi tanpa batas', () => {
    assert.ok(/\.(limit|range)\(/.test(read(apiRoutes().find((f) => f.includes('/transactions/')))), 'GET transaksi tanpa limit');
  });
});
