import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../components/ui/ErrorBoundary';

// Mock Icon component
vi.mock('../components/ui/Icon', () => ({
  default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

function ThrowingComponent() {
  throw new Error('Test Error');
}

describe('ErrorBoundary', () => {
  let consoleSpy;

  beforeEach(() => {
    // Spy on console.error to prevent cluttering the test logs
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Safe Child</div>
      </ErrorBoundary>
    );

    expect(screen.getByTestId('child').textContent).toBe('Safe Child');
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('renders fallback UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).not.toBeNull();
    expect(screen.getByText('Reload Page')).not.toBeNull();
    expect(screen.getByText('Go Home')).not.toBeNull();
  });
});
