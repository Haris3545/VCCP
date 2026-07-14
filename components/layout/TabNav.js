import Link from 'next/link';
import { useRouter } from 'next/router';
import artistConfig from '@/lib/artist.config';

const TAB_LABELS = {
  dashboard: 'Dashboard',
  audience: 'Audience',
  strategy: 'Strategy',
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
