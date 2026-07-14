import { Html, Head, Main, NextScript } from 'next/document';
import artistConfig from '@/lib/artist.config';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content={artistConfig.theme.bg} />
        <link rel="icon" href="data:," />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
