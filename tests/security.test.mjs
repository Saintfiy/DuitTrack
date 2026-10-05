// Coverage Items for Security: NFR-001 sampai NFR-005
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { read, run, apiRoutes, allSourceFiles, found, lineOf } from './helpers.mjs';

describe('NFR-001 Tidak ada secret yang ditulis langsung di kode', () => {
  test('TC-SEC-01 utils/auth.ts tidak punya nilai cadangan untuk JWT_SECRET', () => {
    const adaFallback = /process\.env\.JWT_SECRET\s*(\|\||\?\?)\s*['"`]/.test(read('utils/auth.ts'));
    assert.ok(!adaFallback, 'JWT_SECRET punya nilai cadangan tertulis di kode');
  });

  test('TC-SEC-02 utils/encryption.ts tidak punya nilai cadangan untuk ENCRYPTION_KEY', () => {
    const adaFallback = /process\.env\.ENCRYPTION_KEY\s*(\|\||\?\?)\s*['"`]/.test(read('utils/encryption.ts'));
    assert.ok(!adaFallback, 'ENCRYPTION_KEY punya nilai cadangan tertulis di kode');
  });

  test('TC-SEC-03 tidak ada kredensial literal di seluruh source code', () => {
    const pattern = /(password|secret|api[_-]?key|token|service[_-]?role)\w*\s*[:=]\s*['"][^'"\s]{12,}['"]|eyJ[A-Za-z0-9_-]{20,}\.eyJ/gi;
    const hits = [];
    for (const f of allSourceFiles()) {
      const src = read(f);
      for (const m of src.matchAll(pattern)) hits.push(`${f}:${lineOf(src, m.index)}`);
    }
    assert.ok(hits.length === 0, found(hits));
  });

  test('TC-SEC-04 riwayat git tidak memuat JWT Supabase (perlu clone penuh, bukan shallow)', (t) => {
    let commits;
    try {
      commits = run('git', ['log', '--all', '-G', 'eyJ[A-Za-z0-9_-]{20,}\\.eyJ', '--pretty=format:%h']).trim();
    } catch {
      return t.skip('git tidak tersedia atau folder ini bukan repository git');
    }
    assert.ok(commits === '', `JWT ditemukan di commit: ${commits.split('\n').join(', ')}`);
  });
});

describe('NFR-002 File environment tidak masuk repository', () => {
  const ignore = read('.gitignore').split('\n').map((l) => l.trim());

  test('TC-SEC-05 .gitignore menutup file .env', () => {
    assert.ok(ignore.some((l) => ['.env', '.env*', '*.env'].includes(l)), '.env belum ada di .gitignore');
  });

  test('TC-SEC-06 .gitignore menutup file .env.local', () => {
    assert.ok(ignore.some((l) => ['.env.local', '.env*.local', '*.local', '.env*'].includes(l)), '.env.local belum ditutup');
  });

  test('TC-SEC-07 tidak ada file .env yang ter-commit', () => {
    const tracked = run('git', ['ls-files']).split('\n').filter((f) => /(^|\/)\.env(\.|$)/.test(f));
    assert.ok(tracked.length === 0, `File env ter-commit: ${tracked.join(', ')}`);
  });
});

describe('NFR-003 Password tidak disimpan atau dihash dengan cara lemah', () => {
  test('TC-SEC-08 password ditangani Supabase Auth (register dan login)', () => {
    assert.ok(/auth\.admin\.createUser/.test(read('app/api/auth/register/route.ts')), 'register tidak memakai Supabase Auth');
    assert.ok(/signInWithPassword/.test(read('app/api/auth/login/route.ts')), 'login tidak memakai Supabase Auth');
  });

  test('TC-SEC-09 tidak ada hash password memakai SHA-256 polos', () => {
    const hits = allSourceFiles().filter((f) => /createHash\(\s*['"]sha256['"]/.test(read(f)));
    assert.ok(hits.length === 0, `SHA-256 polos dipakai di: ${hits.join(', ')}`);
  });

  test('TC-SEC-10 pustaka bcrypt yang terpasang benar-benar dipakai di source', () => {
    const dependsOnBcrypt = 'bcrypt' in (JSON.parse(read('package.json')).dependencies ?? {});
    const used = allSourceFiles().some((f) => /from\s+['"]bcrypt(js)?['"]|require\(['"]bcrypt(js)?['"]\)/.test(read(f)));
    assert.ok(!dependsOnBcrypt || used, 'bcrypt ada di package.json tetapi tidak diimpor di source');
  });
});

describe('NFR-004 Dependency tidak punya kerentanan tingkat tinggi', () => {
  const audit = (t) => {
    let out;
    try {
      out = run('npm', ['audit', '--package-lock-only', '--json']);
    } catch (e) {
      out = e.stdout; // npm audit keluar dengan kode non-nol saat ada temuan
    }
    try {
      return JSON.parse(out).metadata.vulnerabilities;
    } catch {
      t.skip('npm audit tidak bisa dijalankan (cek koneksi internet)');
      return null;
    }
  };

  test('TC-SEC-11 tidak ada kerentanan critical', (t) => {
    const v = audit(t);
    if (v) assert.ok(v.critical === 0, `${v.critical} kerentanan critical`);
  });

  test('TC-SEC-12 tidak ada kerentanan high', (t) => {
    const v = audit(t);
    if (v) assert.ok(v.high === 0, `${v.high} kerentanan high`);
  });
});

describe('NFR-005 Endpoint API memverifikasi identitas pengguna', () => {
  const PROTECTED = ['businesses', 'transactions', 'chat', 'ocr'];
  const verifies = /verifyToken|auth\.getUser|auth\.getSession|getUser\(|getSession\(/;

  test('TC-SEC-13 tidak ada route yang mempercayai header x-user-id', () => {
    const hits = apiRoutes().filter((f) => /x-user-id/i.test(read(f)));
    assert.ok(hits.length === 0, `Header x-user-id dipakai sebagai identitas di: ${hits.join(', ')}`);
  });

  PROTECTED.forEach((name, i) => {
    test(`TC-SEC-${14 + i} route ${name} memverifikasi token atau sesi pengguna`, () => {
      const file = apiRoutes().find((f) => f.includes(`/${name}/`));
      assert.ok(file, `route ${name} tidak ditemukan`);
      assert.ok(verifies.test(read(file)), `${file} tidak memverifikasi identitas`);
    });
  });
});
