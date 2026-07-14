// Default Strategy content — seeds the editable Strategy tab. Edits persist
// to localStorage; "reset" re-hydrates from this file per section.
export const strategyDefaultsMock = {
  source: 'simulated',
  soap: {
    objectives: [
      'Sustain peak cultural relevance through the post-Brat album cycle without diluting the aesthetic.',
      'Convert meme-velocity attention into owned-audience growth across streaming and social.',
      'Deepen affinity with core Gen Z / LGBTQ+ / nightlife audiences ahead of the next release window.',
    ],
    kpis: [
      'Cultural Buzz Score sustained above 80/100',
      'Streaming Momentum index +10 vs. baseline',
      'Social sentiment held above 70% positive through release cycle',
      'Owned-channel audience growth 5%+ month-on-month',
    ],
    growthLevers: [
      {
        title: 'Meme-to-moment conversion',
        description:
          'Turn organic meme velocity into scheduled cultural moments — timed drops, remix bait, and reactive content that rides existing conversation instead of competing with it.',
      },
      {
        title: 'Nightlife & festival presence',
        description:
          'Own the physical spaces where the fanbase already over-indexes — club nights, festival activations, DJ-adjacent placements — to keep the brand felt, not just seen.',
      },
      {
        title: 'Community-led amplification',
        description:
          'Equip the most engaged micro-communities (LGBTQ+ creators, fashion-forward stylists, superfan edit accounts) with early access and remixable assets rather than one-size press kits.',
      },
    ],
    growthAudiences: {
      core: 'Gen Z Core',
      adjacent: 'Pop Culture Omnivores · Nightlife Regulars',
      reach: 'Fashion-Forward · LGBTQ+ & Allies · Broader Pop Audience',
    },
    pillars: [
      {
        name: 'Tease',
        window: 'Weeks 1–3',
        description: 'Fragmented drops, cryptic visual language, remix-bait audio snippets seeded through community accounts.',
      },
      {
        name: 'Release',
        window: 'Weeks 4–5',
        description: 'Full release moment — coordinated owned/earned/paid push, flagship nightlife activation, press embargo lift.',
      },
      {
        name: 'Sustain',
        window: 'Weeks 6–10',
        description: 'Remix rollout, fan-content amplification, festival season tie-ins to extend the tail past the initial spike.',
      },
    ],
  },
  poap: {
    why:
      'The distinctive space is unapologetic maximal-minimalism — DIY-coded visuals with a razor-sharp cultural point of view — ' +
      'in a landscape of over-produced pop marketing. Lean into raw, fast, slightly chaotic execution over polish.',
    how: [
      'Community-first seeding through nightlife and fashion micro-creators before any paid push.',
      'Remix-friendly asset drops that invite reinterpretation rather than locked-down brand guidelines.',
      'Reactive real-time content desk during the Release window to ride whatever the internet does with it.',
      'Physical activations in nightlife venues layered with the Locations pillar map (full tier only).',
    ],
    oesp: { owned: 30, earned: 35, shared: 25, paid: 10 },
    phasing: [
      { phase: 'Tease', dates: 'Wks 1–3', budgetPct: 15, channels: 'Owned social, community seeding' },
      { phase: 'Release', dates: 'Wks 4–5', budgetPct: 45, channels: 'Paid social, press, flagship activation' },
      { phase: 'Sustain', dates: 'Wks 6–10', budgetPct: 40, channels: 'Earned amplification, festival tie-ins' },
    ],
  },
};
