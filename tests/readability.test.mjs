// Coverage Items for Maintainability (Readability): NFR-012 sampai NFR-014
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, exists, allSourceFiles, found, lineOf } from './helpers.mjs';

const MAX_LINES_PER_FILE = 400;

describe('NFR-012 Penamaan dan pengetikan konsisten', () => {
  test('TC-RDB-01 tidak ada variabel snake_case (standar: camelCase)', () => {
    const pattern = /\b(?:const|let|var)\s+([a-z][a-z0-9]*_[a-z0-9_]+)\b/g;
    const hits = [];
    for (const f of allSourceFiles()) {
      const src = read(f);
      for (const m of src.matchAll(pattern)) hits.push(`${f}:${lineOf(src, m.index)} (${m[1]})`);
    }
    assert.ok(hits.length === 0, found(hits));
  });

  test('TC-RDB-02 TypeScript strict mode aktif di tsconfig.json', () => {
    const tsconfig = JSON.parse(read('tsconfig.json'));
    assert.ok(tsconfig.compilerOptions.strict === true, 'compilerOptions.strict bernilai false');
  });
});

describe('NFR-013 Ukuran file dan fungsi terkendali', () => {
  test(`TC-RDB-03 tidak ada file source lebih dari ${MAX_LINES_PER_FILE} baris`, () => {
    const hits = allSourceFiles()
      .map((f) => [f, read(f).split('\n').length])
      .filter(([, n]) => n > MAX_LINES_PER_FILE)
      .map(([f, n]) => `${f} (${n} baris)`);
    assert.ok(hits.length === 0, found(hits));
  });
});

describe('NFR-014 Tidak ada kode mati', () => {
  test('TC-RDB-04 tidak ada sisa scaffolding Vite padahal vite bukan dependency', () => {
    const pkg = JSON.parse(read('package.json'));
    const hasVite = 'vite' in { ...pkg.dependencies, ...pkg.devDependencies };
    const sisa = ['vite.config.js', 'src/main.jsx', 'index.html'].filter(exists);
    assert.ok(hasVite || sisa.length === 0, `File sisa Vite: ${sisa.join(', ')}`);
  });

  test('TC-RDB-05 tidak ada import yang tidak terpakai', () => {
    const hits = [];
    for (const f of allSourceFiles().filter((x) => /\.(ts|tsx)$/.test(x))) {
      const src = read(f);
      for (const m of src.matchAll(/^import\s+(?:type\s+)?([^;]+?)\s+from\s+['"][^'"]+['"];?$/gm)) {
        const clause = m[1];
        const names = [];
        const braces = /\{([^}]*)\}/.exec(clause);
        if (braces) {
          braces[1].split(',').forEach((s) => {
            const n = s.trim().split(/\s+as\s+/).pop().replace(/^type\s+/, '');
            if (n) names.push(n);
          });
        }
        const rest = clause.replace(/\{[^}]*\}/, '').replace(/[,*]|\bas\b/g, ' ').trim();
        if (rest) names.push(...rest.split(/\s+/).filter(Boolean));
        for (const n of names) {
          const uses = src.match(new RegExp(`\\b${n.replace('$', '\\$')}\\b`, 'g')) ?? [];
          if (uses.length < 2) hits.push(`${f}:${lineOf(src, m.index)} (${n})`);
        }
      }
    }
    assert.ok(hits.length === 0, found(hits));
  });
});
