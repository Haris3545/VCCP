import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER } from '@/lib/constants';
import TabNav from './TabNav';

export default function Header() {
  return (
    <header className="header">
      <div className="container header__row">
        <div className="header__identity">
          <span className="kicker">{AGENCY_KICKER}</span>
          <span className="wordmark">{artistConfig.wordmark}</span>
        </div>
        <TabNav />
      </div>
    </header>
  );
}
