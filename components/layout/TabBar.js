import ConsoleTabNav from './ConsoleTabNav';
import LogoutButton from './LogoutButton';

// Desktop/mouse only now — touch devices get MobileNav's fixed trigger +
// full-screen panel instead (mounted at the AppShell level), and this
// entire bar is hidden for them in globals.css to reclaim the vertical
// space it would otherwise take up.
export default function TabBar() {
  return (
    <div className="tab-bar">
      <div className="container tab-bar__row">
        <div className="tab-bar__desktop">
          <ConsoleTabNav />
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
