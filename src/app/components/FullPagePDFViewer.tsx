'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Import PDF CSS for text and annotation layers
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Dynamically import PDF components to prevent SSR issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Document })),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Page })),
  { ssr: false }
);

// Dynamically import FullPage
const ReactFullpage = dynamic(
  () => import('@fullpage/react-fullpage'),
  { ssr: false }
);

interface OrientationHintProps {
  isVisible: boolean;
}

const OrientationHint: React.FC<OrientationHintProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="orientation-hint">
      <div className="rotate-icon">📱</div>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Please rotate your device
      </h2>
      <p>This experience is optimized for landscape viewing</p>
    </div>
  );
};

interface PDFPageProps {
  pageNumber: number;
  numPages: number;
}

const PDFPageComponent: React.FC<PDFPageProps> = ({ pageNumber, numPages }) => {
  const [pageWidth, setPageWidth] = useState<number>(1920);

  useEffect(() => {
    const updatePageWidth = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const isMobile = vw < 768 || vh < 768;
      
      if (isMobile) {
        // Mobile: calculate to fill screen while maintaining 16:9
        const aspectRatio = 16/9;
        
        if (vw / vh > aspectRatio) {
          // Width is longer, constrain by height
          setPageWidth(vh * aspectRatio);
        } else {
          // Height is longer, constrain by width
          setPageWidth(vw);
        }
      } else {
        // Desktop: use viewport calculations
        const aspectRatio = 16/9;
        
        if (vw / vh > aspectRatio) {
          // Width constrained by height
          setPageWidth(vh * aspectRatio);
        } else {
          // Height constrained by width
          setPageWidth(vw);
        }
      }
    };

    updatePageWidth();
    window.addEventListener('resize', updatePageWidth);
    window.addEventListener('orientationchange', () => {
      // Add delay to ensure orientation change is complete
      setTimeout(updatePageWidth, 200);
    });
    
    return () => {
      window.removeEventListener('resize', updatePageWidth);
      window.removeEventListener('orientationchange', updatePageWidth);
    };
  }, []);

  return (
    <div className="section-content">
      <Page
        pageNumber={pageNumber}
        width={pageWidth}
        renderTextLayer={true}
        renderAnnotationLayer={true}
        devicePixelRatio={window.devicePixelRatio || 1}
      />
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        right: '20px', 
        color: 'var(--bhem-cream)',
        fontSize: '0.9rem',
        opacity: 0.7
      }}>
        {pageNumber} / {numPages}
      </div>
    </div>
  );
};

const FullPagePDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [showOrientationHint, setShowOrientationHint] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [navigationPosition] = useState<'left' | 'right'>('left');

  useEffect(() => {
    // Set up PDF.js worker when component mounts
    const setupPDFWorker = async () => {
      const { pdfjs } = await import('react-pdf');
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';
      setIsReady(true);
    };
    
    setupPDFWorker();

    const checkOrientation = () => {
      const isMobile = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setShowOrientationHint(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 200);
    });
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  // Remove watermark periodically
  useEffect(() => {
    const removeWatermark = () => {
      const watermarks = document.querySelectorAll('.fp-watermark');
      watermarks.forEach(el => el.remove());
    };

    // Remove watermark immediately and then every 1 second
    const intervalId = setInterval(removeWatermark, 1000);
    removeWatermark();

    return () => clearInterval(intervalId);
  }, [pdfLoaded]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF loaded successfully with', numPages, 'pages');
    setNumPages(numPages);
    // Add a small delay to ensure PDF pages are rendered before initializing FullPage
    setTimeout(() => {
      setPdfLoaded(true);
    }, 500);
  };

  // Memoize options to prevent unnecessary reloads
  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.3.31/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.3.31/standard_fonts/',
    // Ensure text layer rendering with precise positioning
    renderTextLayer: true,
    textLayerMode: 1,
    enableXfa: true,
    // Ensure precise text positioning
    fontExtraProperties: true,
    disableFontFace: false,
    useSystemFonts: false
  }), []);

  // Custom loading component with just space
  const CustomLoading = () => (
    <div className="section-content">
      <div>&nbsp;</div>
    </div>
  );

  const fullpageOptions = useMemo(() => ({
    licenseKey: '5QN98-70J38-3YDKK-0K1JK-NROLP',
    sectionsColor: Array(numPages).fill('var(--bhem-deep-cocoa)'),
    navigation: true,
    navigationPosition: 'left',
    showActiveTooltip: false,
    scrollingSpeed: 1000,
    controlArrows: false,
    slidesNavigation: false,
    keyboardScrolling: true,
    animateAnchor: false,
    recordHistory: false,
    touchSensitivity: 5,
    responsiveWidth: 0,
    responsiveHeight: 0,
    autoScrolling: true,
    fitToSection: true,
    credits: { enabled: false }, // Disable credits/watermark
    afterRender: function() {
      console.log('FullPage rendered with', numPages, 'sections');
      // Additional watermark removal after render
      const watermarks = document.querySelectorAll('.fp-watermark');
      watermarks.forEach(el => el.remove());
      
      // No additional navigation setup needed
    },
    afterLoad: function(origin: { index: number }, destination: { index: number }) {
      console.log('FullPage afterLoad:', destination.index + 1, 'of', numPages);
    },
    onLeave: function(origin: { index: number }, destination: { index: number }, direction: string) {
      console.log('FullPage onLeave:', (origin.index + 1), '->', (destination.index + 1), direction);
      return true; // Allow the transition
    }
  }), [numPages]);

  if (!isReady) {
    return (
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
    );
  }

  return (
    <div className="fullpage-wrapper">
      <OrientationHint isVisible={showOrientationHint} />
      
      <div className="fullpage-container">
        <Document
          file="/BHEM Brand Deck-v2.1-Website.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => {
            console.error('PDF loading error:', error);
          }}
          options={pdfOptions}
          loading={<CustomLoading />}
          error={
            <div className="section-content">
              <div style={{ color: 'var(--bhem-tomato)', textAlign: 'center' }}>
                <h2>PDF Loading Error</h2>
                <p>Unable to load the BHEM Brand Deck PDF.</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '1rem' }}>
                  Please check that the PDF file is properly placed in the public folder.
                </p>
              </div>
            </div>
          }
        >
          {pdfLoaded && numPages > 0 ? (
            <ReactFullpage
              {...fullpageOptions}
              render={() => (
                <div id="fullpage">
                  {Array.from({ length: numPages }, (_, index) => (
                    <div key={index + 1} className="section">
                      <PDFPageComponent 
                        pageNumber={index + 1} 
                        numPages={numPages}
                      />
                    </div>
                  ))}
                </div>
              )}
            />
          ) : numPages > 0 ? (
            <CustomLoading />
          ) : null}
        </Document>
      </div>
    </div>
  );
};

export default FullPagePDFViewer;