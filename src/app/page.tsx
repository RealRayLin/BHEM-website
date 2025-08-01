'use client';

import dynamic from 'next/dynamic';

const FullscreenPDFViewer = dynamic(
  () => import('./components/FullscreenPDFViewer'),
  { 
    ssr: false
  }
);

export default function Home() {
  return <FullscreenPDFViewer />;
}
