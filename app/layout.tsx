import type { Metadata } from 'next';
import { Barlow_Condensed } from 'next/font/google';
import './globals.css';

// Saltline's uppercase furniture - labels, eyebrows, buttons, the process
// rail, the stamps and the ledger - is set in Barlow Condensed, self-hosted
// through next/font so no request leaves the origin at runtime.
//
// Why this face: public/og.png already promises a heavy condensed grotesque
// wordmark, and Barlow Condensed is the one OFL condensed grotesque that ships
// the whole 100-900 range, so the 900 the wordmark, plate strips and stamps ask
// for is a real drawn weight rather than a synthesised smear. Its tall x-height
// and flat, low-contrast terminals hold up at the 7-10px uppercase sizes where
// nearly all of this interface lives, and the slightly softened joins survive
// the paper-grain multiply layer that sits over everything.
//
// The display serif stays Georgia. The headlines are tuned to its metrics.
const deskSans = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  style: ['normal'],
  display: 'swap',
  variable: '--font-desk-sans',
  fallback: ['Arial Narrow', 'Helvetica Neue Condensed', 'Arial', 'Helvetica', 'sans-serif'],
});

const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const metadataBase = new URL(
  productionHost
    ? `https://${productionHost}`
    : 'https://saltline-dispatch.vercel.app',
);

export const metadata: Metadata = {
  metadataBase,
  title: 'Saltline Dispatch: the 2:13 AM edition',
  description: 'An original late-night coastal editorial micro-experience built with Unlayer React Image Editor.',
  openGraph: {
    title: 'Saltline Dispatch: the 2:13 AM edition',
    description: 'Take a field image, make it speak, print the dispatch, then pin it to the issue wall.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Saltline Dispatch: the 2:13 AM edition' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Saltline Dispatch: the 2:13 AM edition',
    description: 'A late-night coastal editorial micro-experience.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={deskSans.variable}>
      <body>{children}</body>
    </html>
  );
}
