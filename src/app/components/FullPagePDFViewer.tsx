'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

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

const PDFPageComponent: React.FC<PDFPageProps> = ({ pageNumber }) => {
  const [pageWidth, setPageWidth] = useState<number>(1920);

  useEffect(() => {
    let resizeTimeout: NodeJS.Timeout;
    let orientationTimeout: NodeJS.Timeout;
    
    const updatePageWidth = () => {
      try {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const isMobile = vw < 768;
        
        if (isMobile) {
          // Mobile: calculate based on viewport with safety margins
          const safeWidth = Math.min(vw - 40, 380); // Leave 40px total margin
          const safeHeight = vh - 40; // Leave 40px total margin
          
          // Calculate width based on 16:9 aspect ratio but constrain by both dimensions
          const aspectWidth = safeHeight * (16/9);
          const finalWidth = Math.min(safeWidth, aspectWidth);
          
          setPageWidth(Math.max(finalWidth, 280)); // Minimum 280px width
        } else {
          // Desktop: standard calculation
          const aspectRatio = 16/9;
          
          if (vw / vh > aspectRatio) {
            setPageWidth(vh * aspectRatio * 0.9);
          } else {
            setPageWidth(vw * 0.9);
          }
        }
      } catch (error) {
        console.warn('Error updating page width:', error);
        // Safe fallback
        setPageWidth(window.innerWidth < 768 ? 280 : 1200);
      }
    };

    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(updatePageWidth, 100);
    };
    
    const debouncedOrientation = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(updatePageWidth, 800); // Increased delay for rotation completion
    };

    updatePageWidth();
    window.addEventListener('resize', debouncedResize, { passive: true });
    window.addEventListener('orientationchange', debouncedOrientation, { passive: true });
    
    return () => {
      clearTimeout(resizeTimeout);
      clearTimeout(orientationTimeout);
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', debouncedOrientation);
    };
  }, []);


  return (
    <div className="section-content">
      <Page
        pageNumber={pageNumber}
        width={pageWidth}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        devicePixelRatio={1}
      />
    </div>
  );
};

const FullPagePDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0);
  const [showOrientationHint, setShowOrientationHint] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [pdfLoaded, setPdfLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [navigationPosition] = useState<'left' | 'right'>('left');

  useEffect(() => {
    let orientationTimeout: NodeJS.Timeout;
    
    // Set up PDF.js worker when component mounts
    const setupPDFWorker = async () => {
      try {
        const { pdfjs } = await import('react-pdf');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';
        setIsReady(true);
      } catch (error) {
        console.error('Failed to setup PDF worker:', error);
        setHasError(true);
      }
    };
    
    setupPDFWorker();

    const checkOrientation = () => {
      try {
        const isMobile = window.innerWidth < 768;
        const isPortrait = window.innerHeight > window.innerWidth;
        setShowOrientationHint(isMobile && isPortrait);
      } catch (error) {
        console.warn('Error checking orientation:', error);
      }
    };

    const debouncedOrientationCheck = () => {
      clearTimeout(orientationTimeout);
      orientationTimeout = setTimeout(checkOrientation, 800); // Increased delay for rotation completion
    };

    checkOrientation();
    window.addEventListener('resize', debouncedOrientationCheck, { passive: true });
    window.addEventListener('orientationchange', debouncedOrientationCheck, { passive: true });
    
    return () => {
      clearTimeout(orientationTimeout);
      window.removeEventListener('resize', debouncedOrientationCheck);
      window.removeEventListener('orientationchange', debouncedOrientationCheck);
    };
  }, []);

  // Remove watermark periodically
  useEffect(() => {
    if (!pdfLoaded) return;
    
    const removeWatermark = () => {
      try {
        const watermarks = document.querySelectorAll('.fp-watermark');
        watermarks.forEach(el => el.remove());
      } catch (error) {
        console.warn('Error removing watermark:', error);
      }
    };

    // Remove watermark immediately and then every 2 seconds (less frequent)
    const intervalId = setInterval(removeWatermark, 2000);
    removeWatermark();

    return () => clearInterval(intervalId);
  }, [pdfLoaded]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    try {
      console.log('PDF loaded successfully with', numPages, 'pages');
      setNumPages(numPages);
      setHasError(false);
      // Add a small delay to ensure PDF pages are rendered before initializing FullPage
      setTimeout(() => {
        setPdfLoaded(true);
      }, 800); // Increased delay for mobile stability
    } catch (error) {
      console.error('Error in onDocumentLoadSuccess:', error);
      setHasError(true);
    }
  };
  
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF loading error:', error);
    setHasError(true);
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

  const fullpageOptions = useMemo(() => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    return {
      licenseKey: '5QN98-70J38-3YDKK-0K1JK-NROLP',
      sectionsColor: Array(numPages).fill('var(--bhem-deep-cocoa)'),
      navigation: !isMobile, // Disable navigation on mobile to prevent conflicts
      navigationPosition: 'left',
      showActiveTooltip: false,
      scrollingSpeed: isMobile ? 500 : 1000, // Slower on mobile
      controlArrows: false,
      slidesNavigation: false,
      keyboardScrolling: !isMobile, // Disable keyboard on mobile
      animateAnchor: false,
      recordHistory: false,
      touchSensitivity: isMobile ? 15 : 5, // Less sensitive on mobile
      responsiveWidth: 0,
      responsiveHeight: 0,
      autoScrolling: true,
      fitToSection: isMobile ? false : true, // Disable fitToSection on mobile
      normalScrollElements: isMobile ? '.section' : undefined, // Allow normal scroll on mobile
      paddingTop: isMobile ? '0' : '0',
      paddingBottom: isMobile ? '0' : '0',
      fixedElements: undefined,
      css3: true,
      easingcss3: 'ease',
      credits: { enabled: false }, // Disable credits/watermark
    afterRender: function() {
      try {
        console.log('FullPage rendered with', numPages, 'sections');
        // Additional watermark removal after render
        const watermarks = document.querySelectorAll('.fp-watermark');
        watermarks.forEach(el => el.remove());
        
        // Fix mobile positioning issues
        if (window.innerWidth < 768) {
          const sections = document.querySelectorAll('.section');
          sections.forEach((section, index) => {
            const sectionEl = section as HTMLElement;
            sectionEl.style.position = 'relative';
            sectionEl.style.top = '0';
            sectionEl.style.transform = 'none';
          });
        }
      } catch (error) {
        console.warn('Error in afterRender:', error);
      }
    },
    afterLoad: function(origin: { index: number }, destination: { index: number }) {
      try {
        console.log('FullPage afterLoad:', destination.index + 1, 'of', numPages);
        
        // Fix positioning after load on mobile
        if (window.innerWidth < 768) {
          const activeSection = document.querySelector('.section.active, .fp-section.active') as HTMLElement;
          if (activeSection) {
            activeSection.style.position = 'relative';
            activeSection.style.top = '0';
            activeSection.style.transform = 'none';
          }
        }
      } catch (error) {
        console.warn('Error in afterLoad:', error);
      }
    },
    onLeave: function(origin: { index: number }, destination: { index: number }, direction: string) {
      try {
        console.log('FullPage onLeave:', (origin.index + 1), '->', (destination.index + 1), direction);
        return true; // Allow the transition
      } catch (error) {
        console.warn('Error in onLeave:', error);
        return true;
      }
    }
  };
  }, [numPages]);

  if (hasError) {
    return (
      <div className="fullpage-wrapper">
        <div className="fullpage-container">
          <div className="section-content">
            <div style={{ color: 'var(--bhem-tomato)', textAlign: 'center', padding: '2rem' }}>
              <h2>Unable to Load PDF Viewer</h2>
              <p>Please try refreshing the page or check your internet connection.</p>
              <button 
                onClick={() => window.location.reload()} 
                style={{
                  background: 'var(--bhem-orange)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  marginTop: '1rem',
                  cursor: 'pointer'
                }}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!isReady) {
    return (
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
    );
  }

  return (
    <div className="fullpage-wrapper">
      <OrientationHint isVisible={showOrientationHint} />
      
      <div className="fullpage-container">
        <Document
          file="/BHEM Brand Deck-v2.1-Website.pdf"
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          options={pdfOptions}
          loading={<CustomLoading />}
          error={
            <div className="section-content">
              <div style={{ color: 'var(--bhem-tomato)', textAlign: 'center' }}>
                <h2>&nbsp;</h2>
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