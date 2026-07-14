import artistConfig from '@/lib/artist.config';
import '@/styles/globals.css';

const themeVars = {
  '--bg': artistConfig.theme.bg,
  '--surface': artistConfig.theme.surface,
  '--paper': artistConfig.theme.paper,
  '--muted': artistConfig.theme.muted,
  '--accent': artistConfig.theme.accent,
  '--accent-deep': artistConfig.theme.accentDeep,
  '--grain-opacity': artistConfig.theme.grainOpacity,
};

export default function App({ Component, pageProps }) {
  return (
    <div style={themeVars}>
      <Component {...pageProps} />
    </div>
  );
}
