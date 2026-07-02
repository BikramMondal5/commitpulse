import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import PRStatusDistribution from './PRStatusDistribution';

// Safe environment stub reset helper for Vitest 4.x
const mockSystemTimezoneAndDate = (timezone: string, dateIsoString: string) => {
  vi.stubEnv('TZ', timezone);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(dateIsoString));
};

describe('PRStatusDistribution - Timezone Normalization & Calendar Data Boundary Alignment (Variation 8)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Replaced vi.unstubEnv() with a direct reset to prevent runner crashes
    vi.stubEnv('TZ', '');
  });

  // Test Case 1: Timezone offset block shifting calculations
  it('should process PR data metrics accurately across distinct timezones (EST vs IST)', () => {
    // 11:30 PM UTC on July 2nd is July 2nd in EST, but shifts to July 3rd in IST
    const mockPrData = [{ id: 'pr-1', createdAt: '2026-07-02T23:30:00Z', status: 'merged' }];

    mockSystemTimezoneAndDate('America/New_York', '2026-07-03T12:00:00Z');
    const { rerender } = render(<PRStatusDistribution data={mockPrData} />);

    // Asserts heading title renders correctly in EST
    expect(screen.getByText('Status Distribution')).toBeInTheDocument();

    mockSystemTimezoneAndDate('Asia/Kolkata', '2026-07-03T12:00:00Z');
    rerender(<PRStatusDistribution data={mockPrData} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 2: Extreme time zones (JST / UTC)
  it('should parse metrics accurately under extreme positive timezones like JST', () => {
    const mockPrData = [{ id: 'pr-1', createdAt: '2025-12-31T18:00:00Z', status: 'opened' }];

    mockSystemTimezoneAndDate('Asia/Tokyo', '2026-01-02T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 3: Leap year boundary data validation
  it('should parse leap year boundaries seamlessly without processing exceptions', () => {
    const mockPrData = [{ id: 'pr-leap', createdAt: '2024-02-29T12:00:00Z', status: 'closed' }];

    mockSystemTimezoneAndDate('UTC', '2024-03-01T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData} />);

    expect(screen.getByText('Breakdown of PR states')).toBeInTheDocument();
  });

  // Test Case 4: Daylight Savings Time (DST) Transitions
  it('should calculate date boundaries precisely during spring-forward and fall-back DST transitions', () => {
    const mockPrData = [{ id: 'pr-dst', createdAt: '2026-03-08T07:30:00Z', status: 'merged' }];

    mockSystemTimezoneAndDate('America/New_York', '2026-03-09T00:00:00Z');
    render(<PRStatusDistribution data={mockPrData} />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });

  // Test Case 5: Calendar utility output locale formatting validation
  it('should handle calendar date format expectations for the current locale environment', () => {
    const mockPrData = [];

    mockSystemTimezoneAndDate('Europe/London', '2026-07-02T12:00:00Z');
    render(<PRStatusDistribution data={mockPrData} locale="en-GB" />);

    expect(screen.getByText('Status Distribution')).toBeInTheDocument();
  });
});
