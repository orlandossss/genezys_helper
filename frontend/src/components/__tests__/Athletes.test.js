import { render, screen } from '@testing-library/react';
import Athletes from '../Athletes';

afterEach(() => {
  jest.restoreAllMocks();
});

test('Athletes renders athlete list when given valid athletesData', () => {
  const mockAthletes = {
    data: [
      { id: '1', firstName: 'Antoine', lastName: 'Dupont', sport: 'RUG', level: 'legend' },
    ],
    count: 1,
  };
  const mockFetchArticles = jest.fn().mockResolvedValue({ data: [] });

  render(<Athletes athletesData={mockAthletes} fetchArticles={mockFetchArticles} />);
  expect(screen.getByText(/Dupont/i)).toBeInTheDocument();
});

test('Athletes renders empty state when athletesData has no data', () => {
  render(<Athletes athletesData={null} fetchArticles={jest.fn()} />);
  // Athletes.jsx renders this text when athleteList.length === 0 (null/empty athletesData)
  expect(screen.getByText(/Athletes database is loading/i)).toBeInTheDocument();
});

/**
 * RED TEST — intentionally failing.
 * Athletes.jsx does not accept an `error` prop and has no error UI today.
 * When error is passed, the component ignores it and falls through to the
 * empty-state message ("Athletes database is loading...") instead.
 * This test will pass in Phase 3 when error boundary / error prop is added (UI-01).
 */
test('Athletes shows visible error message when error prop is provided', () => {
  render(
    <Athletes
      athletesData={null}
      fetchArticles={jest.fn()}
      error="Failed to load athletes"
    />
  );
  // WILL FAIL: Athletes.jsx currently ignores the error prop and renders empty-state instead
  expect(screen.getByText(/failed to load athletes/i)).toBeInTheDocument();
});
