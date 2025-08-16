'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Import web page insertion configuration
import { WebPageInsertion, getValidInsertions, getTitleLines } from '../config/webPageInsertions';

const Document = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Document })),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Page })),
  { ssr: false }
);

interface FullscreenPDFViewerProps {
  pdfUrl?: string;
  webPageInsertions?: WebPageInsertion[];
}

const FullscreenPDFViewer: React.FC<FullscreenPDFViewerProps> = ({ 
  pdfUrl = "/BHEM Brand Deck-Website.pdf",
  webPageInsertions
}) => {
  // Use configuration file if no insertions provided via props
  const insertions = useMemo(() => {
    return webPageInsertions || getValidInsertions();
  }, [webPageInsertions]);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isShowingWebPage, setIsShowingWebPage] = useState<boolean>(false);
  const [currentWebPageData, setCurrentWebPageData] = useState<WebPageInsertion | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0); // PDF pages + web pages
  
  // Initialize totalPages when insertions are ready
  useEffect(() => {
    if (insertions && insertions.length >= 0) {
      setTotalPages(numPages + insertions.length);
    }
  }, [insertions, numPages]);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [windowSize, setWindowSize] = useState({ width: 1920, height: 1080 });
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadedPages, setLoadedPages] = useState<Set<number>>(new Set());
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);
  
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [pageTransition, setPageTransition] = useState<{
    direction: 'left' | 'right' | 'up' | 'down' | null;
    isExiting: boolean;
    isEntering: boolean;
  }>({ direction: null, isExiting: false, isEntering: false });
  
  const [animationInitialized, setAnimationInitialized] = useState<boolean>(false);
  
  const [showPageNumber, setShowPageNumber] = useState<boolean>(true);
  const [isTextTransitioning, setIsTextTransitioning] = useState<boolean>(false);
  const indicatorInterval = useRef<NodeJS.Timeout | null>(null);
  
  const [showDonateCapsule, setShowDonateCapsule] = useState<boolean>(false);
  const [donateText, setDonateText] = useState<string>('DONATE');
  const [isDonateTextTransitioning, setIsDonateTextTransitioning] = useState<boolean>(false);
  const [showFormCapsule, setShowFormCapsule] = useState<boolean>(false);
  const [capsuleTransitionState, setCapsuleTransitionState] = useState<'single' | 'transitioning' | 'dual' | 'triple'>('single');
  const donateTextTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);
  const lastNavigationTime = useRef<number>(0);
  const navigationDebounceTime = 300; // 300ms debounce

  const pdfOptions = useMemo(() => ({
    cMapUrl: 'https://unpkg.com/pdfjs-dist@5.4.54/cmaps/',
    cMapPacked: true,
    standardFontDataUrl: 'https://unpkg.com/pdfjs-dist@5.4.54/standard_fonts/',
    verbosity: 0,
  }), []);

  // Window resize effect for responsive design
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ 
        width: window.innerWidth, 
        height: window.innerHeight 
      });
    };

    // Set initial size
    if (typeof window !== 'undefined') {
      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    const setupPDFWorker = async () => {
      try {
        const { pdfjs } = await import('react-pdf');
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf/pdf.worker.min.js';
        setIsReady(true);
        
      } catch (error) {
        console.error('Failed to setup PDF worker:', error);
        setHasError(true);
        setIsLoading(false);
      }
    };
    
    setupPDFWorker();

    return () => {
      setIsReady(false);
    };
  }, []);


  useEffect(() => {
    const updatePageDimensions = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      const pdfAspectRatio = 0.77;
      
      const widthFromHeight = viewportHeight * pdfAspectRatio;
      const heightFromWidth = viewportWidth / pdfAspectRatio;
      
      if (widthFromHeight <= viewportWidth) {
        setPageWidth(widthFromHeight);
        setPageHeight(viewportHeight);
      } else {
        setPageWidth(viewportWidth);
        setPageHeight(heightFromWidth);
      }
    };

    updatePageDimensions();
    window.addEventListener('resize', updatePageDimensions);
    return () => window.removeEventListener('resize', updatePageDimensions);
  }, []);


  const synchronizeTextLayer = useCallback(() => {
    if (!pageRef.current) return;
    
    const pageElement = pageRef.current.querySelector('.react-pdf__Page');
    const canvas = pageElement?.querySelector('canvas');
    const textLayer = pageElement?.querySelector('.react-pdf__Page__textContent');
    
    if (!canvas || !textLayer) return;
    
    const canvasRect = canvas.getBoundingClientRect();
    const pageContainer = canvas.closest('.react-pdf__Page');
    
    if (!pageContainer) return;
    
    const scaleX = canvasRect.width / pageWidth;
    const scaleY = canvasRect.height / pageHeight;
    
    const textElement = textLayer as HTMLElement;
    
    textElement.style.position = 'absolute';
    textElement.style.left = '0px';
    textElement.style.top = '0px';
    textElement.style.width = `${canvasRect.width}px`;
    textElement.style.height = `${canvasRect.height}px`;
    textElement.style.transformOrigin = '0 0';
    
    const transform = `scale(${scaleX}, ${scaleY})`;
    textElement.style.transform = transform;
    
  }, [pageWidth, pageHeight]);

  useEffect(() => {
    if (!isLoading) {
      const syncTimer = setTimeout(() => {
        synchronizeTextLayer();
      }, 300);
      
      return () => clearTimeout(syncTimer);
    }
  }, [isLoading, synchronizeTextLayer]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // totalPages will be set in useEffect when insertions are ready
    setHasError(false);
    
    setCurrentPage(prev => {
      const maxPage = numPages + (insertions?.length || 0);
      if (prev < 1 || prev > maxPage) {
        return 1;
      }
      return prev;
    });
    
    setLoadedPages(prev => {
      const validPages = new Set<number>();
      prev.forEach(pageNum => {
        if (pageNum >= 1 && pageNum <= numPages) {
          validPages.add(pageNum);
        }
      });
      return validPages;
    });
    
    setPageTransition({ direction: null, isExiting: false, isEntering: false });
    setIsNavigating(false);
    
    setTimeout(() => {
      setAnimationInitialized(true);
    }, 100);
  };

  const onPageLoadSuccess = useCallback((pageNumber: number) => {
    if (pageNumber === currentPage) {
      setTimeout(() => synchronizeTextLayer(), 100);
    }
    
    setLoadedPages(prev => {
      const newSet = new Set(prev);
      
      if (newSet.has(pageNumber)) {
        return prev;
      }
      
      newSet.add(pageNumber);
      
      if (newSet.size === numPages && numPages > 0) {
        setTimeout(() => {
          setIsLoading(currentLoading => {
            if (currentLoading) {
              return false;
            }
            return currentLoading;
          });
        }, 800);
      }
      
      return newSet;
    });
  }, [numPages, currentPage, synchronizeTextLayer]);

  const onDocumentLoadError = (error: Error) => {
    console.error('❌ PDF loading error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    setHasError(true);
    setIsLoading(false);
  };

  const onPageLoadError = useCallback((pageNumber: number, error: Error) => {
    console.error(`Page ${pageNumber} load error:`, error);
    
    if (error.message.includes('Invalid page request')) {
      setLoadedPages(prev => {
        const newSet = new Set(prev);
        newSet.add(pageNumber);
        return newSet;
      });
    }
  }, []);

  const restartIndicatorCarousel = useCallback((delay: number = 1500) => {
    setTimeout(() => {
      if (indicatorInterval.current) {
        clearInterval(indicatorInterval.current);
      }
      
      indicatorInterval.current = setInterval(() => {
        setIsTextTransitioning(true);
        
        setTimeout(() => {
          setShowPageNumber(prev => !prev);
          setIsTextTransitioning(false);
        }, 300); // Half fade duration
      }, 3000);
      
    }, delay);
  }, []);

  // Helper function to get actual PDF page number from current page index
  const getPDFPageNumber = useCallback((pageIndex: number) => {
    if (!insertions || insertions.length === 0) {
      return pageIndex;
    }
    
    const pdfPageNumber = pageIndex;
    let webPagesBeforeCurrent = 0;
    
    for (const insertion of insertions) {
      const insertionPosition = insertion.location[0] + webPagesBeforeCurrent + 1; // Position after PDF page + previous web pages
      if (pageIndex > insertionPosition) {
        webPagesBeforeCurrent++;
      }
    }
    
    return pdfPageNumber - webPagesBeforeCurrent;
  }, [insertions]);
  
  // Helper function to check if current page is a web page
  const getWebPageData = useCallback((pageIndex: number) => {
    if (!insertions || insertions.length === 0) {
      return null;
    }
    
    let webPagesBeforeCurrent = 0;
    
    for (const insertion of insertions) {
      const insertionPosition = insertion.location[0] + webPagesBeforeCurrent + 1;
      if (pageIndex === insertionPosition) {
        return insertion;
      }
      if (pageIndex > insertionPosition) {
        webPagesBeforeCurrent++;
      }
    }
    
    return null;
  }, [insertions]);
  
  // Helper function to convert PDF page number to sequence number (considering web page insertions)
  const getSequenceNumberFromPDFPage = useCallback((pdfPageNumber: number) => {
    if (!insertions || insertions.length === 0) {
      return pdfPageNumber;
    }
    
    let webPagesAdded = 0;
    
    for (const insertion of insertions) {
      // If PDF page is after this insertion point, add 1 to sequence number
      if (pdfPageNumber > insertion.location[0]) {
        webPagesAdded++;
      }
    }
    
    return pdfPageNumber + webPagesAdded;
  }, [insertions]);
  
  const navigateWithAnimation = useCallback((direction: 'next' | 'prev', animationDirection: 'left' | 'right' | 'up' | 'down') => {
    const now = Date.now();
    
    if (!animationInitialized) {
      return;
    }
    
    if (isNavigating || (now - lastNavigationTime.current) < navigationDebounceTime) {
      return;
    }
    
    if (totalPages <= 0 || currentPage < 1 || currentPage > totalPages) {
      return;
    }
    
    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    
    if (targetPage < 1 || targetPage > totalPages) {
      return;
    }
    
    if (indicatorInterval.current) {
      clearInterval(indicatorInterval.current);
    }
    setShowPageNumber(true); // 显示新页码
    
    setIsNavigating(true);
    lastNavigationTime.current = now;
    
    setPageTransition({ direction: animationDirection, isExiting: true, isEntering: false });
    
    setTimeout(() => {
      setCurrentPage(targetPage);
      
      // Check if target page is a web page
      const webPageData = getWebPageData(targetPage);
      if (webPageData) {
        setIsShowingWebPage(true);
        setCurrentWebPageData(webPageData);
      } else {
        setIsShowingWebPage(false);
        setCurrentWebPageData(null);
      }
      
      setPageTransition({ direction: animationDirection, isExiting: false, isEntering: true });
      
      setTimeout(() => {
        setPageTransition({ direction: animationDirection, isExiting: false, isEntering: false });
        
        setTimeout(() => {
          setPageTransition({ direction: null, isExiting: false, isEntering: false });
          setIsNavigating(false);
          
          restartIndicatorCarousel(1500);
          
        }, 300);
      }, 100);
    }, 200);
    
  }, [currentPage, totalPages, isNavigating, animationInitialized, restartIndicatorCarousel, getWebPageData]);

  const handleIndicatorClick = useCallback(() => {
    if (indicatorInterval.current) {
      clearInterval(indicatorInterval.current);
    }
    
    setShowPageNumber(true);
    
    if (currentPage >= totalPages) {
      setCurrentPage(1);
      setIsShowingWebPage(false);
      setCurrentWebPageData(null);
      restartIndicatorCarousel(1500);
    } else {
      navigateWithAnimation('next', 'right');
    }
    
  }, [currentPage, totalPages, navigateWithAnimation, restartIndicatorCarousel]);

  const handleDonateClick = useCallback(async () => {
    const donationInfo = `BLACK HERITAGE EXPERIENCE MANITOBA

Website: www.BHEM.ca

WAYS TO GIVE:
Convenient pathways to secure your Founding 100 status with your $100 investment

A - E-TRANSFER
Send $100 to: info@ACOMI.ca
Include your name and "Black History Museum" in message

B - ONLINE PORTAL
Visit: www.canadahelps.org/en/dn/3162
Select dropdown: #7: Black History Museum

C - MAIL DONATION
African Communities of Manitoba Inc.
200-301 Nassau Street N.
Winnipeg, MB R3L 2J5
Map: maps.app.goo.gl/r477pRFGsmaxBbyMA

D - PERSONAL CONTACT
Call: (204) 795-7465
Email: info@ACOMI.ca
Cash or cheque welcomed for arrangements.`;

    if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(donationInfo);
        
        if (donateTextTimeout.current) {
          clearTimeout(donateTextTimeout.current);
        }
        
        setIsDonateTextTransitioning(true);
        
        setTimeout(() => {
          setDonateText('INFO COPIED');
          setIsDonateTextTransitioning(false);
          
          donateTextTimeout.current = setTimeout(() => {
            setIsDonateTextTransitioning(true);
            
            setTimeout(() => {
              setDonateText('DONATE');
              setIsDonateTextTransitioning(false);
            }, 300);
          }, 3000);
        }, 300);
        
      } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        alert(`Please copy this donation information:\n\n${donationInfo}`);
      }
    } else {
      alert(`Please copy this donation information:\n\n${donationInfo}`);
    }
  }, []);

  const handleFormClick = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.open('https://forms.gle/Jsy12gVAPV8GE5ai8', '_blank');
    }
  }, []);

  const getPageTransitionClass = useCallback(() => {
    if (!pageTransition.direction) return '';
    
    const baseClass = 'page-transition';
    const directionClass = `transition-${pageTransition.direction}`;
    let stateClass = '';
    
    if (pageTransition.isExiting) {
      stateClass = 'exiting';
    } else if (pageTransition.isEntering) {
      stateClass = 'entering-initial';
    }
    
    const className = `${baseClass} ${directionClass} ${stateClass}`;
    return className;
  }, [pageTransition]);

  const getPageTransitionStyle = useCallback(() => {
    const transition = 'transform 0.4s ease-out, opacity 0.4s ease-out';
    
    if (!pageTransition.direction) {
      return {
        transform: 'translate(-50%, -50%) translateX(0) translateY(0)',
        opacity: 1,
        transition
      };
    }

    const { direction, isExiting, isEntering } = pageTransition;
    
    if (isExiting) {
      let transform = '';
      
      if (direction === 'left') {
        transform = 'translate(-50%, -50%) translateX(150%)';
      } else if (direction === 'right') {
        transform = 'translate(-50%, -50%) translateX(-150%)';
      } else if (direction === 'up') {
        transform = 'translate(-50%, -50%) translateY(150%)';
      } else if (direction === 'down') {
        transform = 'translate(-50%, -50%) translateY(-150%)';
      }
      
      return {
        transform,
        opacity: 0,
        transition
      };
    }
    
    if (isEntering) {
      let transform = '';
      
      if (direction === 'left') {
        transform = 'translate(-50%, -50%) translateX(-150%)';
      } else if (direction === 'right') {
        transform = 'translate(-50%, -50%) translateX(150%)';
      } else if (direction === 'up') {
        transform = 'translate(-50%, -50%) translateY(-150%)';
      } else if (direction === 'down') {
        transform = 'translate(-50%, -50%) translateY(150%)';
      }
      
      return {
        transform,
        opacity: 0,
        transition
      };
    }
    
    return {
      transform: 'translate(-50%, -50%) translateX(0) translateY(0)',
      opacity: 1,
      transition
    };
  }, [pageTransition]);

  useEffect(() => {
    return () => {
      if (indicatorInterval.current) {
        clearInterval(indicatorInterval.current);
      }
      if (donateTextTimeout.current) {
        clearTimeout(donateTextTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    const handleOrientationChange = () => {
      if (document.body.style.zoom) {
        document.body.style.zoom = '1';
      }
      if (document.body.style.transform) {
        document.body.style.transform = 'none';
      }
      
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
      }

    };

    setVH();

    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => {
    const startCarousel = () => {
      indicatorInterval.current = setInterval(() => {
        setIsTextTransitioning(true);
        
        setTimeout(() => {
          setShowPageNumber(prev => !prev);
          setIsTextTransitioning(false);
        }, 300); // Half fade duration
      }, 3000);
    };

    startCarousel();

    return () => {
      if (indicatorInterval.current) {
        clearInterval(indicatorInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    // Only show capsules if we have enough PDF pages
    if (numPages < 10) {
      return; // Don't show capsules for PDFs with less than 10 pages
    }
    
    // Calculate when capsules should appear based on PDF page numbers
    // but check against current sequence position
    
    // Define PDF page numbers when capsules should appear (with minimum thresholds)
    const donatePDFPageThreshold = Math.max(15, Math.max(numPages - 5, Math.floor(numPages * 0.8)));
    const formPDFPageThreshold = Math.max(16, Math.max(numPages - 4, Math.floor(numPages * 0.85)));
    
    // Convert PDF page numbers to sequence numbers (considering web insertions)
    const donateSequenceThreshold = getSequenceNumberFromPDFPage(donatePDFPageThreshold);
    const formSequenceThreshold = getSequenceNumberFromPDFPage(formPDFPageThreshold);
    
    // Check current sequence position against thresholds
    if (currentPage >= donateSequenceThreshold && capsuleTransitionState === 'single') {
      setCapsuleTransitionState('transitioning');
      
      setTimeout(() => {
        setShowDonateCapsule(true);
        
        setTimeout(() => {
          setCapsuleTransitionState('dual');
        }, 400);
      }, 400);
    } else if (currentPage >= formSequenceThreshold && capsuleTransitionState === 'dual') {
      setCapsuleTransitionState('transitioning');
      
      setTimeout(() => {
        setShowFormCapsule(true);
        
        setTimeout(() => {
          setCapsuleTransitionState('triple');
        }, 400);
      }, 400);
    }
  }, [currentPage, capsuleTransitionState, numPages, getSequenceNumberFromPDFPage]);

  // Initialize page state on load
  useEffect(() => {
    const webPageData = getWebPageData(currentPage);
    if (webPageData) {
      setIsShowingWebPage(true);
      setCurrentWebPageData(webPageData);
    } else {
      setIsShowingWebPage(false);
      setCurrentWebPageData(null);
    }
  }, [getWebPageData, currentPage]);


  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only handle single finger
    
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return; // Only handle single finger
    
    const touch = e.touches[0];
    touchEndX.current = touch.clientX;
    touchEndY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length !== 1) return;
    
    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const moveDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (moveDistance >= 250) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      if (absX > absY) {
        if (deltaX > 0) {
          navigateWithAnimation('prev', 'left');
        } else {
          navigateWithAnimation('next', 'right');
        }
      }
    }
    
    touchStartX.current = 0;
    touchStartY.current = 0;
    touchEndX.current = 0;
    touchEndY.current = 0;
  };


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          navigateWithAnimation('next', 'right'); // 下一页：从右侧滑入
          break;
        case 'ArrowDown':
        case ' ':
          e.preventDefault();
          navigateWithAnimation('next', 'down'); // 下一页：从下方滑入
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateWithAnimation('prev', 'left'); // 上一页：从左侧滑入
          break;
        case 'ArrowUp':
          e.preventDefault();
          navigateWithAnimation('prev', 'up'); // 上一页：从上方滑入
          break;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault(); // Prevent default scroll behavior
      if (e.deltaY > 0) {
        navigateWithAnimation('prev', 'up');
      } else if (e.deltaY < 0) {
        navigateWithAnimation('next', 'down');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [navigateWithAnimation]);

  if (hasError) {
    return (
      <div className="fullscreen-error">
        <div className="error-content">
          <div className="loading-logo">
            <Image 
              src="/logo.png" 
              alt="BHEM Logo" 
              width={40}
              height={40}
              priority
              style={{ objectFit: 'contain' }}
            />
          </div>
          <h2>Unable to Load PDF</h2>
          <p>Please refresh the page or check your connection.</p>
        </div>
      </div>
    );
  }


  return (
    <>
      {/* Loading overlay using LoadingSpinner */}
      <LoadingSpinner
        isVisible={isLoading}
        isFullscreen={true}
        progress={numPages > 0 ? loadedPages.size / numPages : 0}
        logoSrc="/logo.png"
        size={128}
        logoSize={36}
      />
      
      {/* PDF Viewer - Only show when not loading */}
      <div 
        className="fullscreen-pdf-viewer"
        ref={containerRef}
        onTouchStartCapture={handleTouchStart}
        onTouchMoveCapture={handleTouchMove}
        onTouchEndCapture={handleTouchEnd}
        style={{
          visibility: isLoading ? 'hidden' : 'visible',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.3s ease',
          touchAction: 'auto', // Allow all touch gestures including pinch zoom
          WebkitTouchCallout: 'none'
        }}
      >
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        onLoadStart={() => console.log('🚀 PDF loading started...')}
        loading=""
        options={pdfOptions}
      >
        {/* Visible current page with navigation animations */}
        {pageWidth > 0 && totalPages > 0 && currentPage >= 1 && currentPage <= totalPages && (
          <div 
            className={`current-page-container ${getPageTransitionClass()}`}
            ref={pageRef}
            style={{
              ...getPageTransitionStyle()
            }}
            data-current-page={currentPage}
            data-animation-state={pageTransition.isExiting ? 'exiting' : pageTransition.isEntering ? 'entering' : 'normal'}
          >
            {isShowingWebPage && currentWebPageData ? (
              // Web Page Display - Full Viewport
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                  overflow: 'hidden',
                  zIndex: 1,
                  padding: windowSize.width <= 768 ? '10px' : windowSize.width <= 1024 ? '15px' : '20px',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    maxWidth: '1920px',
                    maxHeight: '1080px',
                    aspectRatio: windowSize.width <= 768 ? '4 / 3' : 
                               windowSize.width <= 1024 ? '16 / 10' : '16 / 9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <iframe
                    src={currentWebPageData.url}
                    style={{
                      width: '100%',
                      height: '100%',
                      minWidth: windowSize.width <= 768 ? '320px' : 
                               windowSize.width <= 1024 ? '600px' : '800px',
                      minHeight: windowSize.width <= 768 ? '240px' : 
                                windowSize.width <= 1024 ? '375px' : '450px',
                      border: 'none',
                      borderRadius: windowSize.width <= 768 ? '4px' : '8px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                    }}
                    title={`Web page: ${currentWebPageData.titleLine1}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : (
              // PDF Page Display
              numPages > 0 && getPDFPageNumber(currentPage) >= 1 && getPDFPageNumber(currentPage) <= numPages && (
                <Page
                  pageNumber={getPDFPageNumber(currentPage)}
                  width={pageWidth}
                  height={pageHeight}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  devicePixelRatio={8}
                  onLoadSuccess={() => onPageLoadSuccess(getPDFPageNumber(currentPage))}
                  onLoadError={(error) => onPageLoadError(getPDFPageNumber(currentPage), error)}
                  onRenderSuccess={() => {
                    setTimeout(() => synchronizeTextLayer(), 50);
                  }}
                />
              )
            )}
          </div>
        )}

        {/* Background preloading for remaining pages - Start after document loads */}
        {numPages > 1 && isReady && (
          <div 
            className="preload-container"
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              opacity: 0,
              visibility: 'hidden',
              pointerEvents: 'none',
              overflow: 'hidden',
              width: '1px',
              height: '1px',
              zIndex: -1
            }}
          >
            {(() => {
              const priorityPages = [];
              
              if (numPages >= 1 && !loadedPages.has(1) && currentPage !== 1) {
                priorityPages.push(1);
              }
              if (numPages >= 2 && !loadedPages.has(2) && currentPage !== 2) {
                priorityPages.push(2);
              }
              
              const prevPage = currentPage - 1;
              const nextPage = currentPage + 1;
              
              if (prevPage >= 1 && !loadedPages.has(prevPage) && !priorityPages.includes(prevPage)) {
                priorityPages.push(prevPage);
              }
              if (nextPage <= numPages && !loadedPages.has(nextPage) && !priorityPages.includes(nextPage)) {
                priorityPages.push(nextPage);
              }
              
              for (let i = 1; i <= numPages && priorityPages.length < 10; i++) {
                if (!priorityPages.includes(i) && !loadedPages.has(i) && i !== currentPage) {
                  priorityPages.push(i);
                }
              }
              
              return priorityPages.map(pageNumber => {
                if (!numPages || numPages <= 0) {
                  return null;
                }
                
                if (pageNumber < 1 || pageNumber > numPages) {
                  return null;
                }
                
                return (
                  <div
                    key={`preload-wrapper-${pageNumber}`}
                    style={{
                      display: 'none',
                      visibility: 'hidden',
                      position: 'absolute',
                      pointerEvents: 'none'
                    }}
                  >
                    <Page
                      key={`preload-${pageNumber}-${numPages}`}
                      pageNumber={pageNumber}
                      width={Math.max(pageWidth * 0.1, 10)}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      onLoadSuccess={() => onPageLoadSuccess(pageNumber)}
                      onLoadError={(error) => onPageLoadError(pageNumber, error)}
                    />
                  </div>
                );
              }).filter(Boolean);
            })()}
          </div>
        )}
      </Document>
      
      {/* Bottom floating indicator using Portal to avoid transform interference */}
      {!isLoading && totalPages > 0 && typeof window !== 'undefined' && createPortal(
        <>
          {/* CSS Keyframes for breathing glow effect */}
          <style jsx>{`
            @keyframes breathingButton {
              0% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.4);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2), 0 0 30px rgba(255, 255, 255, 0.8);
                transform: scale(1.05);
              }
              100% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 255, 255, 0.4);
                transform: scale(1);
              }
            }
            
            @keyframes blinkingNext {
              0% {
                opacity: 1;
              }
              50% {
                opacity: 0.3;
              }
              100% {
                opacity: 1;
              }
            }
            
            @keyframes breathingDonate {
              0% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(230, 172, 64, 0.4);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2), 0 0 30px rgba(230, 172, 64, 0.8);
                transform: scale(1.05);
              }
              100% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(230, 172, 64, 0.4);
                transform: scale(1);
              }
            }
            
            @keyframes breathingForm {
              0% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(64, 172, 230, 0.4);
                transform: scale(1);
              }
              50% {
                box-shadow: 0 6px 30px rgba(0, 0, 0, 0.2), 0 0 30px rgba(64, 172, 230, 0.8);
                transform: scale(1.05);
              }
              100% {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(64, 172, 230, 0.4);
                transform: scale(1);
              }
            }
          `}</style>
          
          {/* White capsule - fixed bottom center position - wider for custom text */}
          <button
            className="bottom-indicator"
            onClick={handleIndicatorClick}
            style={(() => {
              // Calculate dimensions based on title content (not current display)
              const currentTitleLines = isShowingWebPage && currentWebPageData 
                ? getTitleLines(currentWebPageData) 
                : [];
              const lineCount = currentTitleLines.length > 0 ? currentTitleLines.length : 1;
              const isMultiLine = lineCount > 1;
              
              // Dynamic sizing based on title content (fixed regardless of showing NEXT)
              const dynamicWidth = isMultiLine ? Math.max(280, Math.min(400, Math.max(...currentTitleLines.map(line => line.length * 8 + 80)))) : 200;
              const dynamicHeight = isMultiLine ? 'auto' : '50px';
              const dynamicMinHeight = isMultiLine ? Math.max(60, lineCount * 20 + 20) : 50;
              const dynamicPadding = isMultiLine ? '10px 20px' : '12px 24px';
              const dynamicFontSize = isMultiLine ? (lineCount > 2 ? '12px' : '14px') : '16px';
              const dynamicBorderRadius = isMultiLine ? '30px' : '25px';
              
              return {
                position: 'fixed',
                bottom: '30px',
                left: '0',
                right: '0',
                margin: '0 auto',
                opacity: 1,
                pointerEvents: 'auto',
                zIndex: 9999,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: dynamicBorderRadius,
                padding: dynamicPadding,
                fontSize: dynamicFontSize,
                fontWeight: '800',
                color: '#333',
                cursor: 'pointer',
                width: dynamicWidth + 'px',
                height: dynamicHeight,
                minHeight: dynamicMinHeight + 'px',
                maxHeight: isMultiLine ? '120px' : '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'breathingButton 3s ease-in-out infinite',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                transition: 'all 0.3s ease'
              };
            })()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.animationPlayState = 'paused';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.animationPlayState = 'running';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.animationPlayState = 'paused';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.animationPlayState = 'running';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
          >
            <span
              style={(() => {
                const currentTitleLines = isShowingWebPage && currentWebPageData 
                  ? getTitleLines(currentWebPageData) 
                  : [];
                const lineCount = currentTitleLines.length > 0 ? currentTitleLines.length : 1;
                const isMultiLine = lineCount > 1;
                
                return {
                  opacity: isTextTransitioning ? 0 : 1,
                  transition: 'opacity 0.3s ease',
                  textAlign: 'center',
                  lineHeight: isMultiLine ? '1.2' : 'normal',
                  whiteSpace: isMultiLine ? 'pre-line' : 'nowrap',
                  wordBreak: isMultiLine ? 'break-word' : 'normal',
                  maxWidth: '100%'
                };
              })()}
            >
              {isShowingWebPage && currentWebPageData ? (
                showPageNumber ? 
                  getTitleLines(currentWebPageData).join('\n') : 
                  'NEXT'
              ) : (
                showPageNumber ? getPDFPageNumber(currentPage) : 'NEXT'
              )}
            </span>
          </button>
          
          {/* Yellow Donate Capsule - appears above white capsule */}
          <button
            className="donate-capsule"
            onClick={handleDonateClick}
            style={{
              position: 'fixed',
              bottom: showDonateCapsule ? (() => {
                const currentTitleLines = isShowingWebPage && currentWebPageData 
                  ? getTitleLines(currentWebPageData) 
                  : [];
                const lineCount = currentTitleLines.length > 0 ? currentTitleLines.length : 1;
                const dynamicHeight = lineCount > 1 ? Math.max(60, lineCount * 20 + 20) : 50;
                return (30 + dynamicHeight + 10) + 'px';
              })() : '30px',
              left: '0',
              right: '0',
              margin: '0 auto',
              opacity: showDonateCapsule ? 1 : 0,
              pointerEvents: showDonateCapsule ? 'auto' : 'none',
              zIndex: 9998,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease-in-out',
              background: 'rgba(230, 172, 64, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '800',
              color: '#333',
              cursor: 'pointer',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'breathingDonate 3s ease-in-out infinite',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              width: '200px',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              if (showDonateCapsule) {
                e.currentTarget.style.background = 'rgba(230, 172, 64, 1)';
                e.currentTarget.style.animationPlayState = 'paused';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (showDonateCapsule) {
                e.currentTarget.style.background = 'rgba(230, 172, 64, 0.95)';
                e.currentTarget.style.animationPlayState = 'running';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }
            }}
            onTouchStart={(e) => {
              if (showDonateCapsule) {
                e.currentTarget.style.background = 'rgba(230, 172, 64, 1)';
                e.currentTarget.style.animationPlayState = 'paused';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }
            }}
            onTouchEnd={(e) => {
              if (showDonateCapsule) {
                e.currentTarget.style.background = 'rgba(230, 172, 64, 0.95)';
                e.currentTarget.style.animationPlayState = 'running';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }
            }}
          >
            <span
              style={{
                opacity: isDonateTextTransitioning ? 0 : 1,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {donateText}
            </span>
          </button>
          
          {/* Blue Form Capsule - appears above yellow capsule */}
          <button
            className="form-capsule"
            onClick={handleFormClick}
            style={{
              position: 'fixed',
              bottom: showFormCapsule ? (() => {
                const currentTitleLines = isShowingWebPage && currentWebPageData 
                  ? getTitleLines(currentWebPageData) 
                  : [];
                const lineCount = currentTitleLines.length > 0 ? currentTitleLines.length : 1;
                const dynamicHeight = lineCount > 1 ? Math.max(60, lineCount * 20 + 20) : 50;
                return (30 + dynamicHeight + 10 + 50 + 10) + 'px';
              })() : (() => {
                const currentTitleLines = isShowingWebPage && currentWebPageData 
                  ? getTitleLines(currentWebPageData) 
                  : [];
                const lineCount = currentTitleLines.length > 0 ? currentTitleLines.length : 1;
                const dynamicHeight = lineCount > 1 ? Math.max(60, lineCount * 20 + 20) : 50;
                return (30 + dynamicHeight + 10) + 'px';
              })(),
              left: '0',
              right: '0',
              margin: '0 auto',
              opacity: showFormCapsule ? 1 : 0,
              pointerEvents: showFormCapsule ? 'auto' : 'none',
              zIndex: 9997,
              transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s ease-in-out',
              background: 'rgba(64, 172, 230, 0.95)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              borderRadius: '25px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: '800',
              color: '#333',
              cursor: 'pointer',
              height: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'breathingForm 3s ease-in-out infinite',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              width: '200px',
              minWidth: '200px'
            }}
            onMouseEnter={(e) => {
              if (showFormCapsule) {
                e.currentTarget.style.background = 'rgba(64, 172, 230, 1)';
                e.currentTarget.style.animationPlayState = 'paused';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }
            }}
            onMouseLeave={(e) => {
              if (showFormCapsule) {
                e.currentTarget.style.background = 'rgba(64, 172, 230, 0.95)';
                e.currentTarget.style.animationPlayState = 'running';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }
            }}
            onTouchStart={(e) => {
              if (showFormCapsule) {
                e.currentTarget.style.background = 'rgba(64, 172, 230, 1)';
                e.currentTarget.style.animationPlayState = 'paused';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1.05)';
              }
            }}
            onTouchEnd={(e) => {
              if (showFormCapsule) {
                e.currentTarget.style.background = 'rgba(64, 172, 230, 0.95)';
                e.currentTarget.style.animationPlayState = 'running';
                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              }
            }}
          >
            <span
              style={{
                opacity: 1,
                transition: 'opacity 0.3s ease',
                whiteSpace: 'nowrap'
              }}
            >
              FILL FORM & JOIN US
            </span>
          </button>
        </>,
        document.body
      )}
      </div>
    </>
  );
};

export default FullscreenPDFViewer;
