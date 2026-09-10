import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { CartProvider, useCart } from '../context/CartContext';
import * as api from '../services/api';

let mockUser = null;

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('../services/api', () => ({
  getCart: vi.fn(),
  addToCart: vi.fn(),
  removeFromCart: vi.fn(),
  updateCartQty: vi.fn(),
  clearCart: vi.fn(),
}));

function TestCartConsumer() {
  const { cartItems, addToCart, removeFromCart, updateQty } = useCart();
  return (
    <div>
      <div data-testid="cart-items">{JSON.stringify(cartItems)}</div>
      <button data-testid="add-btn" onClick={() => addToCart('prod-123', 2)}>Add</button>
      <button data-testid="remove-btn" onClick={() => removeFromCart('prod-123')}>Remove</button>
      <button data-testid="update-btn" onClick={() => updateQty('prod-123', 5)}>Update</button>
    </div>
  );
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    mockUser = null;
    vi.clearAllMocks();
  });

  it('behaves correctly for guest state (localStorage)', async () => {
    mockUser = null;

    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    const itemsDiv = screen.getByTestId('cart-items');
    expect(itemsDiv.textContent).toBe('[]');

    // Add to cart
    const addBtn = screen.getByTestId('add-btn');
    await act(async () => {
      addBtn.click();
    });

    expect(JSON.parse(itemsDiv.textContent)[0].productId).toBe('prod-123');
    expect(JSON.parse(itemsDiv.textContent)[0].quantity).toBe(2);

    // Update quantity
    const updateBtn = screen.getByTestId('update-btn');
    await act(async () => {
      updateBtn.click();
    });

    expect(JSON.parse(itemsDiv.textContent)[0].quantity).toBe(5);

    // Remove from cart
    const removeBtn = screen.getByTestId('remove-btn');
    await act(async () => {
      removeBtn.click();
    });

    expect(itemsDiv.textContent).toBe('[]');
  });

  it('behaves correctly for logged-in state (server APIs)', async () => {
    mockUser = { email: 'test@example.com' };
    
    // Mock API returns
    api.getCart.mockResolvedValue([{ productId: 'prod-123', quantity: 3 }]);
    api.addToCart.mockResolvedValue([{ productId: 'prod-123', quantity: 5 }]);
    api.updateCartQty.mockResolvedValue([{ productId: 'prod-123', quantity: 5 }]);
    api.removeFromCart.mockResolvedValue([]);

    render(
      <CartProvider>
        <TestCartConsumer />
      </CartProvider>
    );

    // Let the initial sync useEffect run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const itemsDiv = screen.getByTestId('cart-items');
    expect(JSON.parse(itemsDiv.textContent)[0].productId).toBe('prod-123');
    expect(JSON.parse(itemsDiv.textContent)[0].quantity).toBe(3);

    // Add to cart
    const addBtn = screen.getByTestId('add-btn');
    await act(async () => {
      addBtn.click();
    });

    expect(api.addToCart).toHaveBeenCalledWith('prod-123', 2);
    expect(JSON.parse(itemsDiv.textContent)[0].quantity).toBe(5);

    // Update quantity
    const updateBtn = screen.getByTestId('update-btn');
    await act(async () => {
      updateBtn.click();
    });

    expect(api.updateCartQty).toHaveBeenCalledWith('prod-123', 5);

    // Remove from cart
    const removeBtn = screen.getByTestId('remove-btn');
    await act(async () => {
      removeBtn.click();
    });

    expect(api.removeFromCart).toHaveBeenCalledWith('prod-123');
    expect(itemsDiv.textContent).toBe('[]');
  });
});
