import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProductCard from '../components/layout/ProductCard';

vi.mock('../ui', () => ({
  Icon: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>,
  WhatsAppIcon: () => <span data-testid="icon-whatsapp">WhatsApp</span>,
  StarRating: ({ rating }) => <span data-testid="star-rating">{rating}</span>,
  BestForTag: ({ tag }) => <span data-testid={`tag-${tag}`}>{tag}</span>,
  ImagePlaceholder: ({ label }) => <span data-testid="placeholder">{label}</span>,
  Tooltip: ({ children, content }) => <div title={content}>{children}</div>,
}));

const mockProduct = {
  id: 'prod-123',
  name: 'HD Dome Camera',
  price: 2999,
  images: ['cam.jpg'],
  brand: 'Hikvision',
  best_for: ['Office', 'Security'],
  resolution: '4MP',
  type: 'Dome',
  indoor_outdoor: 'Indoor',
  stock: 'In Stock',
  stock_qty: 10,
  avg_rating: 4.5,
  review_count: 12
};

describe('ProductCard', () => {
  it('renders correctly with wishlist button when handler is provided', () => {
    const onView = vi.fn();
    const onCompare = vi.fn();
    const onAddToCart = vi.fn();
    const onToggleWishlist = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        compareList={[]}
        onCompare={onCompare}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        isWishlisted={false}
      />
    );

    // Assert name, brand, price and other details render
    expect(screen.getByText('HD Dome Camera')).toBeDefined();
    expect(screen.getByText('Hikvision')).toBeDefined();
    expect(screen.getByText('Rs. 2,999')).toBeDefined();
    expect(screen.getByText('In Stock')).toBeDefined();

    // Assert wishlist button is rendered
    expect(screen.queryByLabelText('Save to wishlist')).not.toBeNull();
  });

  it('renders correctly without wishlist button when handler is not provided', () => {
    render(
      <ProductCard
        product={mockProduct}
        onView={vi.fn()}
        compareList={[]}
        onCompare={vi.fn()}
        onAddToCart={vi.fn()}
      />
    );

    // Assert wishlist button is NOT rendered
    expect(screen.queryByLabelText('Save to wishlist')).toBeNull();
  });

  it('fires callbacks on click events', () => {
    const onView = vi.fn();
    const onCompare = vi.fn();
    const onAddToCart = vi.fn();
    const onToggleWishlist = vi.fn();

    render(
      <ProductCard
        product={mockProduct}
        onView={onView}
        compareList={[]}
        onCompare={onCompare}
        onAddToCart={onAddToCart}
        onToggleWishlist={onToggleWishlist}
        isWishlisted={false}
      />
    );

    // Trigger View Details / Card click
    screen.getByText('HD Dome Camera').click();
    expect(onView).toHaveBeenCalledWith(mockProduct);

    // Trigger Add to Cart (Get Quote)
    screen.getByText('Get Quote').click();
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct);

    // Trigger Compare
    screen.getByLabelText('Compare').click();
    expect(onCompare).toHaveBeenCalledWith(mockProduct);

    // Trigger Wishlist
    screen.getByLabelText('Save to wishlist').click();
    expect(onToggleWishlist).toHaveBeenCalledWith(mockProduct);
  });
});
