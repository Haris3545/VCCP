// Simulated data — every record is flagged so the UI can render an honest
// "simulated" badge instead of pretending this is real.
const spark = (base, variance, points = 20) =>
  Array.from({ length: points }, (_, i) => {
    const wobble = Math.sin(i * 1.3) * variance + Math.cos(i * 0.7) * (variance * 0.4);
    return { i, v: Math.max(0, Math.round(base + wobble)) };
  });

export const dashboardMock = {
  // The four headline tiles at the top of the Dashboard tab.
  headline: [
    { id: 'in-media', value: 328, unit: '', caption: 'articles mentioning', source: 'simulated' },
    { id: 'trend-index', label: 'Trend index', value: 6, unit: '%', caption: 'vs baseline · 18 social today', source: 'simulated' },
    { id: 'total-reach', label: 'Total reach', value: '2.4M', unit: '', caption: 'estimated social + press reach', source: 'simulated' },
    { id: 'sentiment', label: 'Sentiment', value: 81, unit: '%', caption: 'positive social sentiment', source: 'simulated' },
  ],

  // "Most relevant coverage" list — illustrative placeholder rows, not
  // real published articles, until a press/media-monitoring source is
  // connected (see pages/media.js for that tab's own honest empty state).
  coverage: [
    { id: 1, category: 'Social', title: 'Teases a new era across socials' },
    { id: 2, category: 'Fan community', title: 'This week in fan reactions and edits' },
    { id: 3, category: 'Music press', title: 'Track breakdown: production notes and influences' },
    { id: 4, category: 'Touring', title: 'Added to a major festival lineup announcement' },
    { id: 5, category: 'Streaming', title: 'New remix pack surfaces across platforms' },
    { id: 6, category: 'Fashion', title: 'Style moment breakdown from a recent appearance' },
    { id: 7, category: 'Video', title: 'Clip circulates widely across short-form platforms' },
  ],

  mentionsReach: {
    source: 'simulated',
    mentions: spark(38, 12),
    reach: spark(64, 18),
  },
};
