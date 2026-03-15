/**
 * Minimal _document for Next.js build compatibility.
 * This app uses App Router (src/app/); _document is only here so the build
 * resolver can find it when checking for custom getInitialProps.
 */
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
