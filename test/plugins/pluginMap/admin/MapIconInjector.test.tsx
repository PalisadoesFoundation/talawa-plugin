/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapIconInjector from '../../../../plugins/Plugin Map/admin/injector/MapIconInjector';

// Mock EnvironmentOutlined and TransactionOutlined to avoid complex SVG structures in tests
vi.mock('@ant-design/icons', async () => {
  const actual =
    await vi.importActual<typeof import('@ant-design/icons')>(
      '@ant-design/icons',
    );
  return {
    ...actual,
    EnvironmentOutlined: (props: React.HTMLAttributes<HTMLSpanElement>) => (
      <span data-testid="map-icon" {...props} />
    ),
    TransactionOutlined: (props: React.HTMLAttributes<HTMLSpanElement>) => (
      <span data-testid="transaction-icon" {...props} />
    ),
    AppstoreOutlined: (props: React.HTMLAttributes<HTMLSpanElement>) => (
      <span data-testid="app-icon" {...props} />
    ),
  };
});

describe('MapIconInjector', () => {
  it('should render transaction block for G1 extension point', () => {
    render(<MapIconInjector extensionPointId="G1" />);
    expect(
      screen.getByText(/Payment Provider Transactions/i),
    ).toBeInTheDocument();
  });

  it('should render small icon for non-G1 (e.g., RA1) extension points', () => {
    render(<MapIconInjector extensionPointId="RA1" />);
    expect(screen.getByTestId('map-icon')).toBeInTheDocument();
  });

  it('should show badge by default', () => {
    render(<MapIconInjector extensionPointId="RA1" />);
    expect(screen.getByText('RA1')).toBeInTheDocument();
  });

  it('should not show badge when showBadge is false', () => {
    render(<MapIconInjector extensionPointId="RA1" showBadge={false} />);
    expect(screen.queryByText('RA1')).not.toBeInTheDocument();
  });

  it('should show tooltip on hover', async () => {
    render(<MapIconInjector extensionPointId="RA1" />);
    const badge = screen.getByText('RA1');

    fireEvent.mouseEnter(badge);

    // Explicitly assert tooltip appearance
    await screen.findByRole('tooltip', { hidden: true });
    // Or if checking specific text from title:
    expect(screen.getByRole('tooltip')).toHaveTextContent(
      /Extension Point:\s*RA1/,
    );
  });

  it('should handle small and large sizes', () => {
    const { rerender } = render(
      <MapIconInjector extensionPointId="RA1" size="small" />,
    );
    let icon = screen.getByTestId('map-icon');
    expect(icon.getAttribute('style')).toContain('font-size: 12px');

    rerender(<MapIconInjector extensionPointId="RA1" size="large" />);
    icon = screen.getByTestId('map-icon');
    expect(icon.getAttribute('style')).toContain('font-size: 20px');

    rerender(<MapIconInjector extensionPointId="RA1" size="default" />);
    icon = screen.getByTestId('map-icon');
    expect(icon.getAttribute('style')).toContain('font-size: 16px');
  });

  it('should change styles on mouse enter and leave', () => {
    render(<MapIconInjector extensionPointId="RU1" />);
    const icon = screen.getByTestId('map-icon');
    const iconContainer = icon.parentElement;

    expect(iconContainer).toBeInTheDocument();

    if (iconContainer) {
      fireEvent.mouseEnter(iconContainer);
      expect(iconContainer.style.backgroundColor).toBe('rgb(230, 247, 255)');

      fireEvent.mouseLeave(iconContainer);
      expect(iconContainer.style.backgroundColor).toBe('rgb(240, 240, 240)');
    }
  });
});
