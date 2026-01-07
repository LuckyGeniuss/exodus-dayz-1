import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCart } from './useCart';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const mockProduct = {
  id: 'test-1',
  name: 'Test Product',
  price: 100,
  category: 'test',
  image: '/test.jpg',
  description: 'Test product description',
};

describe('useCart hook', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should initialize with empty cart', () => {
    const { result } = renderHook(() => useCart());
    expect(result.current.items).toEqual([]);
    expect(result.current.getItemCount()).toBe(0);
    expect(result.current.getTotal()).toBe(0);
  });

  it('should add item to cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].product.id).toBe('test-1');
    expect(result.current.items[0].quantity).toBe(1);
  });

  it('should increase quantity when adding same item', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem(mockProduct);
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].quantity).toBe(2);
  });

  it('should remove item from cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.removeItem('test-1');
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should update item quantity', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.updateQuantity('test-1', 5);
    });

    expect(result.current.items[0].quantity).toBe(5);
  });

  it('should remove item when quantity is set to 0', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
    });

    act(() => {
      result.current.updateQuantity('test-1', 0);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should clear cart', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct);
      result.current.addItem({ ...mockProduct, id: 'test-2' });
    });

    act(() => {
      result.current.clearCart();
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should calculate total correctly', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct, 2);
      result.current.addItem({ ...mockProduct, id: 'test-2', price: 50 });
    });

    expect(result.current.getTotal()).toBe(250);
  });

  it('should calculate item count correctly', () => {
    const { result } = renderHook(() => useCart());
    
    act(() => {
      result.current.addItem(mockProduct, 3);
      result.current.addItem({ ...mockProduct, id: 'test-2' }, 2);
    });

    expect(result.current.getItemCount()).toBe(5);
  });
});
