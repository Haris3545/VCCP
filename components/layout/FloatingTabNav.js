import Link from 'next/link';
import { useRouter } from 'next/router';
import { STUDIO_NAME } from '@/lib/constants';
import LogoutButton from './LogoutButton';

const NAV_TABS = [
  { tab: 'dashboard', label: 'Dashboard' },
  { tab: 'media', label: 'Media' },
  { tab: 'music', label: 'Music' },
  { tab: 'audience', label: 'Audience' },
  { tab: 'ideas', label: 'Ideas' },
];

// Replaces TabBar (desktop rail) and MobileNav (touch hamburger + full-screen
// panel) with one fixed pill that floats over every page at every breakpoint,
// instead of two separate in-flow/overlay nav patterns per device.
export default function FloatingTabNav() {
  const router = useRouter();

  return (
    <nav className="floatnav" aria-label="Primary">
      <Link href="/dashboard" className="floatnav__mark">
        <span className="floatnav__eq" aria-hidden="true">
          <i /><i /><i />
        </span>
        <span className="floatnav__mark-text">{STUDIO_NAME}</span>
      </Link>

      <div className="floatnav__items">
        {NAV_TABS.map(({ tab, label }) => {
          const href = `/${tab}`;
          const active = router.pathname === href;
          return (
            <Link
              key={tab}
              href={href}
              className={`floatnav__link${active ? ' floatnav__link--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <LogoutButton className="floatnav__logout" />
    </nav>
  );
}
