import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
