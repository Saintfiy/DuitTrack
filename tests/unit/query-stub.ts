// Stub query Supabase: setiap tabel mengembalikan hasil yang sudah ditentukan.
import { vi } from 'vitest';

export type Result = { data?: unknown; error?: { message: string } | null };

export function createQuery(result: Result) {
  const resolved = { data: null, error: null, ...result };
  const query: any = {};
  for (const method of ['select', 'eq', 'insert', 'or']) {
    query[method] = vi.fn(() => query);
  }
  query.single = vi.fn(async () => resolved);
  query.maybeSingle = vi.fn(async () => resolved);
  // Agar query bisa langsung di-await tanpa single().
  query.then = (resolve: (value: unknown) => unknown) => resolve(resolved);
  return query;
}

export function createClientStub(tables: Record<string, Result>) {
  const queries = Object.fromEntries(
    Object.entries(tables).map(([name, result]) => [name, createQuery(result)]),
  );
  return { from: vi.fn((table: string) => queries[table]), queries };
}
