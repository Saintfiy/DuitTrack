// Fitur Pelanggan (CRM): crmService.getCustomerMetrics
import { describe, expect, test, vi } from 'vitest';
import { crmService } from '@/services/crm.service';
import { supabase } from '@/lib/supabase';
import { createQuery } from './query-stub';

vi.mock('@/lib/supabase', () => ({ supabase: { from: vi.fn() } }));
const useResult = (result: Parameters<typeof createQuery>[0]) =>
  vi.mocked(supabase.from).mockReturnValue(createQuery(result));

describe('crmService.getCustomerMetrics', () => {
  test('CRM-01 menghitung total dan rata-rata pembelian', async () => {
    // Arrange
    useResult({ data: [{ total_purchased: 100 }, { total_purchased: 300 }] });

    // Act
    const metrics = await crmService.getCustomerMetrics('biz-001');

    // Assert
    expect(metrics).toEqual({ totalCustomers: 2, avgPurchaseValue: 200, totalRevenue: 400 });
  });

  test('CRM-02 mengembalikan nol saat belum ada pelanggan', async () => {
    // Arrange
    useResult({ data: null });

    // Act
    const metrics = await crmService.getCustomerMetrics('biz-001');

    // Assert
    expect(metrics).toEqual({ totalCustomers: 0, avgPurchaseValue: 0, totalRevenue: 0 });
  });

  test('CRM-03 meneruskan error database', async () => {
    // Arrange
    useResult({ error: { message: 'DB error' } });

    // Act
    const action = crmService.getCustomerMetrics('biz-001');

    // Assert
    await expect(action).rejects.toEqual({ message: 'DB error' });
  });
});
