import React from 'react';
import { render, screen } from '@testing-library/react';
import CalendarView from '../components/CalendarView';
import { vi } from 'vitest';

// Mock react-big-calendar
vi.mock('react-big-calendar', async () => {
  const actual = await vi.importActual('react-big-calendar');
  return {
    ...actual,
    Calendar: ({ events }) => (
      <div data-testid="calendar-mock">Mocked Calendar with {events.length} events</div>
    ),
    dateFnsLocalizer: () => () => {},
  };
});

// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([]),
  })
);

describe('CalendarView', () => {
  test('renders CalendarView component', () => {
    render(<CalendarView />);
    expect(screen.getByText(/Add SFU Course to Calendar/i)).toBeInTheDocument();
    expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
  });
});
