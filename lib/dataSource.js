// The data-fetching seam. Every real integration (Spotify, GWI, Brand24,
// GDELT, ...) later replaces one function body here — call sites in
// getStaticProps never change.
import { dashboardMock } from './mockData/dashboard';
import { audienceMock } from './mockData/audience';
import { strategyDefaultsMock } from './mockData/strategy.defaults';

export async function getDashboardData() {
  return dashboardMock;
}

export async function getAudienceData() {
  return audienceMock;
}

export async function getStrategyDefaults() {
  return strategyDefaultsMock;
}
