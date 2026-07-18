import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER, STUDIO_NAME } from '@/lib/constants';
import LogoutButton from './LogoutButton';

export default function Header() {
  return (
    <header className="header">
      <div className="container header__row">
        <div className="header__identity">
          <span className="kicker">{AGENCY_KICKER}</span>
          <span className="header__studio-name">{STUDIO_NAME}</span>
        </div>
        <div className="header__right">
          <span className="header__artist-name">{artistConfig.artistName}</span>
          <LogoutButton className="header__logout" />
        </div>
      </div>
    </header>
  );
}
