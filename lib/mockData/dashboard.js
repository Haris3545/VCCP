// Simulated data — every record is flagged so the UI can render an honest
// "awaiting live data" caption instead of pretending this is real.
const spark = (base, variance, points = 12) =>
  Array.from({ length: points }, (_, i) => {
    const wobble = Math.sin(i * 1.3) * variance + Math.cos(i * 0.7) * (variance * 0.4);
    return { i, v: Math.max(0, Math.round(base + wobble)) };
  });

export const dashboardMock = {
  source: 'simulated',
  updatedAtLabel: 'awaiting live data',
  summary:
    "Brat's cultural footprint is holding at peak saturation heading into the next release " +
    'window — sustained meme velocity, strong catalogue streaming, and a search-interest curve ' +
    'that hasn’t come back down to baseline. Numbers below are illustrative until data ' +
    'sources are connected.',
  kpis: [
    {
      id: 'cultural-buzz',
      label: 'Cultural Buzz Score',
      value: 87,
      unit: '/100',
      delta: 4.2,
      series: spark(78, 9),
      source: 'simulated',
    },
    {
      id: 'streaming-momentum',
      label: 'Streaming Momentum',
      value: 112,
      unit: 'idx',
      delta: 6.8,
      series: spark(100, 14),
      source: 'simulated',
    },
    {
      id: 'social-sentiment',
      label: 'Social Sentiment',
      value: 74,
      unit: '% pos.',
      delta: -1.3,
      series: spark(76, 6),
      source: 'simulated',
    },
    {
      id: 'press-mentions',
      label: 'Press Mentions',
      value: 342,
      unit: '/wk',
      delta: 11.5,
      series: spark(300, 40),
      source: 'simulated',
    },
    {
      id: 'search-interest',
      label: 'Search Interest',
      value: 91,
      unit: 'idx',
      delta: 2.1,
      series: spark(85, 10),
      source: 'simulated',
    },
    {
      id: 'audience-growth',
      label: 'Audience Growth',
      value: 5.6,
      unit: '% mo/mo',
      delta: 0.9,
      series: spark(5, 1.2),
      source: 'simulated',
    },
  ],
  trend: {
    label: 'Streaming Momentum',
    sourceLabel: 'Simulated · full catalogue · updates when connected',
    unit: 'idx',
    value: 112,
    delta: 6.8,
    series: spark(100, 16, 30),
  },
};
