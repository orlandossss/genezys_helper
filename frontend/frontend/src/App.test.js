import { render, screen } from '@testing-library/react';
import App from './App';
import * as api from './services/api';

// Mock all API calls so App renders without network access
beforeEach(() => {
  jest.spyOn(api, 'fetchMarketplace').mockResolvedValue({ data: { listings: [] } });
  jest.spyOn(api, 'fetchAthletes').mockResolvedValue({ data: [], count: 0 });
});

afterEach(() => {
  jest.restoreAllMocks();
});

test('App renders the tab bar without crashing', () => {
  render(<App />);
  expect(screen.getByText('Marketplace')).toBeInTheDocument();
  expect(screen.getByText('Athletes')).toBeInTheDocument();
});
