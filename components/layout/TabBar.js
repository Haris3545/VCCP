import TabNav from './TabNav';
import LogoutButton from './LogoutButton';

export default function TabBar() {
  return (
    <div className="tab-bar">
      <div className="container tab-bar__row">
        <TabNav />
        <LogoutButton />
      </div>
    </div>
  );
}
