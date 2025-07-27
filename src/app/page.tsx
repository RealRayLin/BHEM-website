'use client';

import dynamic from 'next/dynamic';

const FullPagePDFViewer = dynamic(
  () => import('./components/FullPagePDFViewer'),
  { 
    ssr: false,
    loading: () => (
      <div className="fullpage-wrapper">
        <div className="fullpage-container">
          <div className="section-content">
            <div className="loading-logo-container">
              <img 
                src="/logo.png" 
                alt="BHEM Logo" 
                className="loading-logo"
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
