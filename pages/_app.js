import artistConfig from '@/lib/artist.config';
import '@fontsource/bodoni-moda/900.css';
import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/400-italic.css';
import '@fontsource/bodoni-moda/700.css';
import '@fontsource/archivo-black';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/700-italic.css';
import '@fontsource/playfair-display/900-italic.css';
import '@fontsource/oswald/600.css';
import '@fontsource/oswald/700.css';
import '@fontsource/ibm-plex-mono/500.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/700.css';
import '@/styles/globals.css';
import PageTransitionOverlay from '@/components/layout/PageTransitionOverlay';
import CustomCursor from '@/components/layout/CustomCursor';

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
  // Pages that opt in define Page.getLayout, wrapping themselves in
  // <AppShell> once here rather than in their own render. Because _app
  // itself never unmounts between client-side navigations, and every page
  // wraps in the same AppShell element shape, React keeps that AppShell
  // instance alive across route changes instead of remounting it — which
  // is what lets the ticker keep scrolling instead of snapping back to its
  // start position on every tab switch.
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <div style={themeVars}>
      {getLayout(<Component {...pageProps} />)}
      <PageTransitionOverlay />
      <CustomCursor />
    </div>
  );
}
