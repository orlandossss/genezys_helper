import { render, screen } from '@testing-library/react';
import Marketplace from '../Marketplace';

// Marketplace.jsx reads data?.data?.listings for its listing array.
// With an empty listings array it renders the empty-state paragraph.
const MOCK_DATA = {
  data: { listings: [] },
};

test('Marketplace renders without crashing given mock data', () => {
  render(<Marketplace data={MOCK_DATA} />);
  // When listings is empty, Marketplace renders this empty-state message
  expect(screen.getByText(/No listings to display/i)).toBeInTheDocument();
});

afterEach(() => {
  jest.restoreAllMocks();
});
