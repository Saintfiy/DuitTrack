// Fungsi bantu untuk test static testing DuitTrack.
// Semua test membaca source code sebagai teks, tanpa menjalankan aplikasi.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'tests', 'dist', 'build']);
const SOURCE_DIRS = ['app', 'components', 'hooks', 'lib', 'services', 'store', 'types', 'utils'];

export const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
export const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

/** Ambil semua file dengan ekstensi tertentu di dalam folder (rekursif). */
export function walk(relDir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  const abs = path.join(ROOT, relDir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const rel = path.posix.join(relDir, entry.name);
    if (entry.isDirectory()) out.push(...walk(rel, exts));
    else if (exts.includes(path.extname(entry.name))) out.push(rel);
  }
  return out;
}

/** Semua source code aplikasi (tanpa node_modules dan folder tests). */
export const allSourceFiles = () => SOURCE_DIRS.flatMap((d) => walk(d));

/** Semua route handler Next.js di app/api. */
export const apiRoutes = () => walk('app/api').filter((f) => /route\.(ts|js)$/.test(f));

/** Hitung nomor baris dari indeks karakter. */
export const lineOf = (src, index) => src.slice(0, index).split('\n').length;

/** Cari kurung penutup yang berpasangan, mulai dari posisi kurung pembuka. */
function matchClose(src, openIdx, open, close) {
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close && --depth === 0) return i;
  }
  return -1;
}

/** Kembalikan nomor baris yang memakai await di dalam badan loop for/while. */
export function awaitInLoopLines(src) {
  const hits = [];
  const loopStart = /\b(for|while)\s*(?:await\s*)?\(/g;
  let m;
  while ((m = loopStart.exec(src))) {
    const parenOpen = src.indexOf('(', m.index);
    const parenClose = matchClose(src, parenOpen, '(', ')');
    if (parenClose < 0) continue;
    let i = parenClose + 1;
    while (/\s/.test(src[i])) i++;
    const bodyEnd = src[i] === '{' ? matchClose(src, i, '{', '}') : src.indexOf(';', i);
    const body = src.slice(i, bodyEnd + 1);
    const re = /\bawait\b/g;
    let a;
    while ((a = re.exec(body))) hits.push(lineOf(src, i + a.index));
  }
  return hits;
}

/** Jalankan perintah dan kembalikan stdout. */
export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    shell: process.platform === 'win32',
    ...opts,
  });
}

/** Susun pesan gagal yang menyebut file dan baris temuan. */
export const found = (items) => `Ditemukan ${items.length} temuan:\n  ${items.join('\n  ')}`;
