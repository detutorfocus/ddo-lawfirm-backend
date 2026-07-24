// pages/_document.tsx
// ── Custom HTML document — fonts loaded HERE not in CSS @import
import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* ── Charset & Theme */}
        <meta charSet="UTF-8" />
        <meta name="theme-color" content="#C9A84C" />
        <meta name="description" content="D.D. Onietan (SAN) & Co. — Premier Law Firm in Nigeria. Constitutional law, corporate counsel, commercial litigation. Abuja." />

        {/*
          ── Google Fonts loaded here (in <Head>) NOT via CSS @import.
          CSS @import triggers Next.js PostCSS pipeline which requires
          tailwindcss/autoprefixer. Loading fonts in _document avoids
          that entirely and is also faster (no render-blocking CSS).
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* ── Open Graph */}
        <meta property="og:type"        content="website" />
        <meta property="og:site_name"   content="D.D. Onietan (SAN) & Co." />
        <meta property="og:title"       content="D.D. Onietan (SAN) & Co. — Barristers & Solicitors" />
        <meta property="og:description" content="Premier Nigerian law firm. 30+ years of excellence. Constitutional law, corporate counsel, commercial litigation." />
        <meta property="og:locale"      content="en_NG" />

        {/* ── Twitter Card */}
        <meta name="twitter:card"        content="summary_large_image" />
        <meta name="twitter:title"       content="D.D. Onietan (SAN) & Co." />
        <meta name="twitter:description" content="Premier Nigerian law chambers. Excellence · Integrity · Justice." />

        {/* ── Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* ── Canonical */}
        <link rel="canonical" href="https://ddonietanandco.com" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
