// Fake Supabase client: data disimpan di memori, tetapi filter dan urutan benar-benar dijalankan.
export type Row = Record<string, string>;
type QueryResult = { data: Row[] | null; error: { message: string } | null };

class FakeQuery {
  private filters: Array<(row: Row) => boolean> = [];

  constructor(
    private rows: Row[],
    private failure: { message: string } | null,
  ) {}

  select(_columns: string) {
    return this;
  }

  eq(column: string, value: string) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  gte(column: string, value: string) {
    this.filters.push((row) => row[column] >= value);
    return this;
  }

  lte(column: string, value: string) {
    this.filters.push((row) => row[column] <= value);
    return this;
  }

  async order(column: string, { ascending }: { ascending: boolean }): Promise<QueryResult> {
    if (this.failure) return { data: null, error: this.failure };
    const direction = ascending ? 1 : -1;
    const data = this.rows
      .filter((row) => this.filters.every((matches) => matches(row)))
      .sort((a, b) => direction * a[column].localeCompare(b[column]));
    return { data, error: null };
  }
}

export class FakeSupabaseClient {
  readonly query: FakeQuery;

  constructor(rows: Row[], failure: { message: string } | null = null) {
    this.query = new FakeQuery(rows, failure);
  }

  from(_table: string) {
    return this.query;
  }
}
