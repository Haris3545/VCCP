import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER } from '@/lib/constants';
import TabNav from './TabNav';
import LogoutButton from './LogoutButton';

export default function Header() {
  return (
    <header className="header">
      <div className="container header__row">
        <div className="header__identity">
          <span className="kicker">{AGENCY_KICKER}</span>
          <span className="wordmark">{artistConfig.wordmark}</span>
        </div>
        <div className="header__actions">
          <TabNav />
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
