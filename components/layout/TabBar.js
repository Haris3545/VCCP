import TabNav from './TabNav';
import LogoutButton from './LogoutButton';
import MobileNav from './MobileNav';

export default function TabBar() {
  return (
    <div className="tab-bar">
      <div className="container tab-bar__row">
        <div className="tab-bar__desktop">
          <TabNav />
          <LogoutButton />
        </div>
        <div className="tab-bar__mobile-trigger">
          <MobileNav />
        </div>
      </div>
    </div>
  );
}
