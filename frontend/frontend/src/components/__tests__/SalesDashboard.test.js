import { render, screen, waitFor } from '@testing-library/react';
import SalesDashboard from '../SalesDashboard';
import * as api from '../../services/api';

const MOCK_STATS = {
  totals: { total_sales: 0, total_revenue: 0, avg_price: 0, max_price: 0, min_price: 0 },
  daily: [],
  by_rarity: [],
  by_sport: [],
  price_distribution: [],
  top_cards: [],
  days: 30,
};

beforeEach(() => {
  jest.spyOn(api, 'fetchSalesStats').mockResolvedValue(MOCK_STATS);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('SalesDashboard renders without crashing given mocked stats', async () => {
  render(<SalesDashboard />);
  // During loading the component renders .stats-dashboard immediately
  // waitFor handles the async useEffect + state transitions
  await waitFor(() => {
    // After mocked fetchSalesStats resolves, the day-selector time range controls render
    expect(screen.getByRole('group', { name: /time range/i })).toBeInTheDocument();
  });
});
