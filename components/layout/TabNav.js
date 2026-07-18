import Link from 'next/link';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';

// Mirrors each page's own <h1> text exactly (see pages/*.js) — this is the
// only place that label has to be spelled out a second time, since deriving
// it from the slug can't reproduce irregular casing like "YouTube".
const TAB_LABELS = {
  dashboard: 'Dashboard',
  media: 'Media',
  'social-listening': 'Social listening',
  music: 'Music',
  youtube: 'YouTube',
  audience: 'Audience',
  strategy: 'Strategy',
  tactics: 'Tactics',
  locations: 'Locations',
  ideas: 'Ideas',
  calendar: 'Calendar',
  research: 'Research',
};

// Sourced from artistConfig.tabs (the single per-artist list of enabled
// tabs) rather than hardcoded, so the nav can never drift out of sync with
// which pages actually exist for this tier.
const NAV_TABS = artistConfig.tabs.map((tab) => ({ tab, label: TAB_LABELS[tab] || tab }));

// A row of separate, individually-bordered pill buttons that wraps onto as
// many lines as it needs — no fixed positioning, no collapse-to-menu. At
// 12 tabs it reliably needs two rows on desktop and more on narrow phones;
// letting it wrap keeps every tab visible and tappable at every width
// instead of hiding most of them behind a "Menu" trigger.
export default function TabNav() {
  const router = useRouter();

  return (
    <nav className="tabnav container" aria-label="Primary">
      {NAV_TABS.map(({ tab, label }) => {
        const href = `/${tab}`;
        const active = router.pathname === href;
        return (
          <Link
            key={tab}
            href={href}
            className="tabnav__link"
            aria-current={active ? 'page' : undefined}
            data-active={active || undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
