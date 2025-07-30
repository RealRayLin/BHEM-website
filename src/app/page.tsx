'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const FullPagePDFViewer = dynamic(
  () => import('./components/FullPagePDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="fullpage-wrapper">
        <div className="fullpage-container">
          <div className="section-content">
            <div className="loading-logo-container">
              <Image 
                src="/logo.png" 
                alt="BHEM Logo" 
                className="loading-logo"
                width={150}
                height={150}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    )
  }
);

export default function Home() {
  return <FullPagePDFViewer />;
}
