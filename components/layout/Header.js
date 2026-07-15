import artistConfig from '@/lib/artist.config';
import { AGENCY_KICKER, STUDIO_NAME } from '@/lib/constants';

export default function Header() {
  return (
    <header className="header">
      <div className="container header__row">
        <div className="header__identity">
          <span className="kicker">{AGENCY_KICKER}</span>
          <span className="header__studio-name">{STUDIO_NAME}</span>
        </div>
        <span className="header__artist-name">{artistConfig.artistName}</span>
      </div>
    </header>
  );
}
