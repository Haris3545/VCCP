// Simulated GWI-style audience file. Row shape mirrors the real build-time
// CSV format described in the Recording Studio spec: a question/metric pair
// plus one value per segment. Segment column order here is the source of
// truth other components read against (kept in this one file for Lite).
export const audienceMock = {
  source: 'simulated',
  updatedAtLabel: 'awaiting GWI data connection',
  segments: [
    { key: 'genZCore', label: 'Gen Z Core' },
    { key: 'popOmnivores', label: 'Pop Culture Omnivores' },
    { key: 'nightlifeRegulars', label: 'Nightlife Regulars' },
    { key: 'fashionForward', label: 'Fashion-Forward' },
    { key: 'lgbtqAllies', label: 'LGBTQ+ & Allies' },
  ],
  metrics: ['Index', 'Column %', 'Row %', 'Responses'],
  groups: [
    {
      question: 'Media & platform behaviour',
      rows: [
        {
          name: 'Active on TikTok daily',
          totals: { 'Index': 100, 'Column %': 41, 'Row %': 100, 'Responses': 2140 },
          values: {
            Index: { genZCore: 168, popOmnivores: 121, nightlifeRegulars: 96, fashionForward: 134, lgbtqAllies: 142 },
            'Column %': { genZCore: 62, popOmnivores: 48, nightlifeRegulars: 38, fashionForward: 55, lgbtqAllies: 58 },
            'Row %': { genZCore: 34, popOmnivores: 22, nightlifeRegulars: 14, fashionForward: 18, lgbtqAllies: 12 },
            Responses: { genZCore: 812, popOmnivores: 540, nightlifeRegulars: 298, fashionForward: 356, lgbtqAllies: 210 },
          },
        },
        {
          name: 'Streams music via Spotify Premium',
          totals: { 'Index': 100, 'Column %': 58, 'Row %': 100, 'Responses': 3010 },
          values: {
            Index: { genZCore: 131, popOmnivores: 118, nightlifeRegulars: 109, fashionForward: 112, lgbtqAllies: 124 },
            'Column %': { genZCore: 71, popOmnivores: 64, nightlifeRegulars: 58, fashionForward: 60, lgbtqAllies: 66 },
            'Row %': { genZCore: 30, popOmnivores: 26, nightlifeRegulars: 17, fashionForward: 15, lgbtqAllies: 12 },
            Responses: { genZCore: 905, popOmnivores: 780, nightlifeRegulars: 512, fashionForward: 452, lgbtqAllies: 361 },
          },
        },
        {
          name: 'Follows electronic/pop music news accounts',
          totals: { 'Index': 100, 'Column %': 29, 'Row %': 100, 'Responses': 1502 },
          values: {
            Index: { genZCore: 142, popOmnivores: 156, nightlifeRegulars: 138, fashionForward: 119, lgbtqAllies: 133 },
            'Column %': { genZCore: 39, popOmnivores: 43, nightlifeRegulars: 36, fashionForward: 31, lgbtqAllies: 37 },
            'Row %': { genZCore: 28, popOmnivores: 24, nightlifeRegulars: 15, fashionForward: 14, lgbtqAllies: 11 },
            Responses: { genZCore: 420, popOmnivores: 361, nightlifeRegulars: 227, fashionForward: 211, lgbtqAllies: 166 },
          },
        },
      ],
    },
    {
      question: 'Lifestyle & attitudes',
      rows: [
        {
          name: 'Attends music festivals annually',
          totals: { 'Index': 100, 'Column %': 22, 'Row %': 100, 'Responses': 1148 },
          values: {
            Index: { genZCore: 121, popOmnivores: 108, nightlifeRegulars: 164, fashionForward: 118, lgbtqAllies: 129 },
            'Column %': { genZCore: 27, popOmnivores: 24, nightlifeRegulars: 36, fashionForward: 26, lgbtqAllies: 28 },
            'Row %': { genZCore: 26, popOmnivores: 21, nightlifeRegulars: 22, fashionForward: 16, lgbtqAllies: 12 },
            Responses: { genZCore: 298, popOmnivores: 241, nightlifeRegulars: 253, fashionForward: 184, lgbtqAllies: 138 },
          },
        },
        {
          name: 'Regularly attends nightlife venues / clubs',
          totals: { 'Index': 100, 'Column %': 19, 'Row %': 100, 'Responses': 987 },
          values: {
            Index: { genZCore: 116, popOmnivores: 94, nightlifeRegulars: 241, fashionForward: 121, lgbtqAllies: 148 },
            'Column %': { genZCore: 22, popOmnivores: 18, nightlifeRegulars: 46, fashionForward: 23, lgbtqAllies: 28 },
            'Row %': { genZCore: 24, popOmnivores: 16, nightlifeRegulars: 32, fashionForward: 15, lgbtqAllies: 13 },
            Responses: { genZCore: 237, popOmnivores: 158, nightlifeRegulars: 316, fashionForward: 148, lgbtqAllies: 128 },
          },
        },
        {
          name: 'Purchases fast-fashion / trend-led apparel monthly',
          totals: { 'Index': 100, 'Column %': 34, 'Row %': 100, 'Responses': 1764 },
          values: {
            Index: { genZCore: 128, popOmnivores: 102, nightlifeRegulars: 107, fashionForward: 189, lgbtqAllies: 118 },
            'Column %': { genZCore: 44, popOmnivores: 35, nightlifeRegulars: 37, fashionForward: 65, lgbtqAllies: 40 },
            'Row %': { genZCore: 27, popOmnivores: 19, nightlifeRegulars: 14, fashionForward: 24, lgbtqAllies: 11 },
            Responses: { genZCore: 476, popOmnivores: 335, nightlifeRegulars: 247, fashionForward: 424, lgbtqAllies: 194 },
          },
        },
        {
          name: 'Actively engages with LGBTQ+ creators/content',
          totals: { 'Index': 100, 'Column %': 26, 'Row %': 100, 'Responses': 1356 },
          values: {
            Index: { genZCore: 119, popOmnivores: 101, nightlifeRegulars: 123, fashionForward: 108, lgbtqAllies: 224 },
            'Column %': { genZCore: 31, popOmnivores: 26, nightlifeRegulars: 32, fashionForward: 28, lgbtqAllies: 58 },
            'Row %': { genZCore: 25, popOmnivores: 18, nightlifeRegulars: 15, fashionForward: 12, lgbtqAllies: 24 },
            Responses: { genZCore: 340, popOmnivores: 240, nightlifeRegulars: 201, fashionForward: 168, lgbtqAllies: 320 },
          },
        },
      ],
    },
  ],
};
