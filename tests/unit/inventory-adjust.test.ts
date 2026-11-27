// Fitur Inventory: inventoryService.adjustQuantity
import { afterEach, describe, expect, test, vi } from 'vitest';
import { inventoryService } from '@/services/inventory.service';

// Dummy: modul supabase wajib ada saat import, tetapi tidak pernah dipakai pada test ini.
vi.mock('@/lib/supabase', () => ({ supabase: {} }));

function useItem(item: { quantity: number } | null) {
  vi.spyOn(inventoryService, 'getItemById').mockResolvedValue(item as any);
  return vi.spyOn(inventoryService, 'updateItem').mockResolvedValue(undefined);
}

describe('inventoryService.adjustQuantity', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('INV-01 menambah stok', async () => {
    // Arrange
    const updateItem = useItem({ quantity: 10 });

    // Act
    await inventoryService.adjustQuantity('item-1', 5, 'add');

    // Assert
    expect(updateItem).toHaveBeenCalledWith('item-1', { quantity: 15 });
  });

  test('INV-02 mengurangi stok', async () => {
    // Arrange
    const updateItem = useItem({ quantity: 10 });

    // Act
    await inventoryService.adjustQuantity('item-1', 4, 'subtract');

    // Assert
    expect(updateItem).toHaveBeenCalledWith('item-1', { quantity: 6 });
  });

  test('INV-03 menolak barang yang tidak ditemukan', async () => {
    // Arrange
    const updateItem = useItem(null);

    // Act
    const action = inventoryService.adjustQuantity('item-x', 1, 'add');

    // Assert
    await expect(action).rejects.toThrow('Item not found');
    expect(updateItem).not.toHaveBeenCalled();
  });
});
