import Link from 'next/link';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';

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

export default function TabNav() {
  const router = useRouter();
  return (
    <nav className="tab-nav" aria-label="Primary">
      {artistConfig.tabs.map((tab) => {
        const href = `/${tab}`;
        const active = router.pathname === href;
        return (
          <Link
            key={tab}
            href={href}
            className={`tab-nav__link${active ? ' tab-nav__link--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {TAB_LABELS[tab] || tab}
          </Link>
        );
      })}
    </nav>
  );
}
