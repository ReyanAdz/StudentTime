// src/tests/CalendarView.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock fetch responses
beforeEach(() => {
  global.fetch = vi.fn((url) => {
    if (url === 'https://www.sfu.ca/bin/wcm/course-outlines?') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ value: '2024' }]) });
    }

    if (url === 'https://www.sfu.ca/bin/wcm/course-outlines?2024') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ value: 'fall' }]) });
    }

    if (url === 'https://www.sfu.ca/bin/wcm/course-outlines?2024/fall') {
      return Promise.resolve({ ok: true, json: () => Promise.resolve([{ value: 'cmpt' }]) });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

describe('CalendarView', () => {
  test('renders CalendarView component', () => {
    render(<CalendarView />);
    expect(screen.getByText(/Add SFU Course to Calendar/i)).toBeInTheDocument();
    expect(screen.getByTestId('calendar-mock')).toBeInTheDocument();
  });

  test('allows selecting year, term, and department (stopping early)', async () => {
    render(<CalendarView />);

    const selects = screen.getAllByRole('combobox');
    const [yearSelect, termSelect, deptSelect] = selects;

    fireEvent.change(yearSelect, { target: { value: '2024' } });

    await waitFor(() => expect(termSelect).not.toBeDisabled());
    fireEvent.change(termSelect, { target: { value: 'fall' } });

    await waitFor(() => expect(deptSelect).not.toBeDisabled());
    fireEvent.change(deptSelect, { target: { value: 'cmpt' } });

    expect(screen.getByTestId('calendar-mock')).toHaveTextContent(/0 events/);
  });
});
