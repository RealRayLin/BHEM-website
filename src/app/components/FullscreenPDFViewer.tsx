'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';
import YoutubePlaylistViewer from './YoutubePlaylistViewer';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const Document = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Document })),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => ({ default: mod.Page })),
  { ssr: false }
);

interface PlaylistPage {
  type: 'playlist';
  playlistUrl: string;
  title: string;
  subtitle: string;
}

interface FullscreenPDFViewerProps {
  pdfUrl?: string;
}

const FullscreenPDFViewer: React.FC<FullscreenPDFViewerProps> = ({ 
  pdfUrl = "/BHEM Brand Deck-Website.pdf" 
}) => {
  // Playlist pages configuration - insert between PDF pages
  const playlistPages = useMemo(() => ({
    1.5: {
      type: 'playlist' as const,
      playlistUrl: 'https://www.youtube.com/playlist?list=PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4',
      title: 'Journeying to Emancipation',
      subtitle: 'Friday, August 1, 2025'
    }
  }), []);

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isReady, setIsReady] = useState<boolean>(false);
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

  // Helper functions for playlist pages
  const isPlaylistPage = useCallback((page: number): boolean => {
    return page in playlistPages;
  }, [playlistPages]);

  const getPlaylistData = useCallback((page: number): PlaylistPage | null => {
    return playlistPages[page as keyof typeof playlistPages] || null;
  }, [playlistPages]);

  // Convert display page to actual PDF page number
  const getActualPDFPage = useCallback((displayPage: number): number => {
    if (displayPage <= 1) return 1;
    if (isPlaylistPage(displayPage)) return -1; // This shouldn't be called for playlist pages
    
    // Simple mapping for our case:
    // Display 1 -> PDF 1
    // Display 1.5 -> playlist (invalid for PDF)
    // Display 2 -> PDF 2
    // Display 3 -> PDF 3, etc.
    
    // Since playlist page is at 1.5, any display page >= 2 maps directly to the same PDF page
    if (displayPage >= 2) {
      return Math.floor(displayPage); // 2.0->2, 3.0->3, etc.
    } else {
      return displayPage; // 1->1
    }
  }, [isPlaylistPage]);



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
    setHasError(false);
    
    // Ensure current page is within valid range including playlist pages
    setCurrentPage(prev => {
      if (prev < 1 || (prev > numPages && prev !== 1.5)) {
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
    if (!isPlaylistPage(currentPage) && pageNumber === getActualPDFPage(currentPage)) {
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
  }, [numPages, currentPage, synchronizeTextLayer, getActualPDFPage, isPlaylistPage]);

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
    // Carousel works for both PDF pages and playlist pages
    
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

  const navigateWithAnimation = useCallback((direction: 'next' | 'prev', animationDirection: 'left' | 'right' | 'up' | 'down') => {
    const now = Date.now();
    
    if (!animationInitialized) {
      return;
    }
    
    if (isNavigating || (now - lastNavigationTime.current) < navigationDebounceTime) {
      return;
    }
    
    if (numPages <= 0 || currentPage < 1) {
      return;
    }
    
    let targetPage: number;
    
    if (direction === 'next') {
      if (currentPage === 1) {
        targetPage = 1.5; // Go to playlist page after page 1
      } else if (currentPage === 1.5) {
        targetPage = 2; // Go to page 2 after playlist page
      } else if (currentPage >= numPages) {
        targetPage = 1; // Loop back to first page
      } else {
        targetPage = currentPage + 1;
      }
    } else {
      if (currentPage === 2) {
        targetPage = 1.5; // Go back to playlist page from page 2
      } else if (currentPage === 1.5) {
        targetPage = 1; // Go back to page 1 from playlist page
      } else if (currentPage <= 1) {
        targetPage = numPages; // Go to last page from first page
      } else {
        targetPage = currentPage - 1;
      }
    }
    
    // Valid pages are: 1, 1.5, 2, 3, ..., numPages
    if (targetPage < 1 || (targetPage > numPages && targetPage !== 1.5)) {
      return;
    }
    
    if (indicatorInterval.current) {
      clearInterval(indicatorInterval.current);
    }
    
    // For playlist pages, don't show page numbers
    if (!isPlaylistPage(targetPage)) {
      setShowPageNumber(true); // Show new page number for PDF pages
    }
    
    setIsNavigating(true);
    lastNavigationTime.current = now;
    
    setPageTransition({ direction: animationDirection, isExiting: true, isEntering: false });
    
    setTimeout(() => {
      setCurrentPage(targetPage);
      
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
    
  }, [currentPage, numPages, isNavigating, animationInitialized, restartIndicatorCarousel, isPlaylistPage]);

  const handleIndicatorClick = useCallback(() => {
    if (indicatorInterval.current) {
      clearInterval(indicatorInterval.current);
    }
    
    setShowPageNumber(true);
    
    if (currentPage >= numPages) {
      setCurrentPage(1);
      restartIndicatorCarousel(1500);
    } else {
      navigateWithAnimation('next', 'right');
    }
    
  }, [currentPage, navigateWithAnimation, restartIndicatorCarousel, numPages]);

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
      
      setTimeout(() => {
        window.location.reload();
      }, 200);
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
      // Start carousel for both PDF pages and playlist pages
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
  }, [currentPage, isPlaylistPage]);

  useEffect(() => {
    if (currentPage >= 15 && capsuleTransitionState === 'single') {
      setCapsuleTransitionState('transitioning');
      
      setTimeout(() => {
        setShowDonateCapsule(true);
        
        setTimeout(() => {
          setCapsuleTransitionState('dual');
        }, 400);
      }, 400);
    } else if (currentPage >= 16 && capsuleTransitionState === 'dual') {
      setCapsuleTransitionState('transitioning');
      
      setTimeout(() => {
        setShowFormCapsule(true);
        
        setTimeout(() => {
          setCapsuleTransitionState('triple');
        }, 400);
      }, 400);
    }
  }, [currentPage, capsuleTransitionState]);


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
    
    // Skip touch gestures on playlist pages
    if (isPlaylistPage(currentPage)) {
      touchStartX.current = 0;
      touchStartY.current = 0;
      touchEndX.current = 0;
      touchEndY.current = 0;
      return;
    }
    
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
      // Skip keyboard navigation on playlist pages
      if (isPlaylistPage(currentPage)) {
        return;
      }
      
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
      // Skip wheel navigation on playlist pages
      if (isPlaylistPage(currentPage)) {
        return;
      }
      
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
  }, [navigateWithAnimation, currentPage, isPlaylistPage]);

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
        {pageWidth > 0 && numPages > 0 && currentPage >= 1 && !isPlaylistPage(currentPage) && (() => {
          const actualPageNumber = getActualPDFPage(currentPage);
          // Validate that the actual page number is within bounds
          if (actualPageNumber < 1 || actualPageNumber > numPages) {
            return null;
          }
          return (
          <div 
            className={`current-page-container ${getPageTransitionClass()}`}
            ref={pageRef}
            style={{
              ...getPageTransitionStyle()
            }}
            data-current-page={currentPage}
            data-animation-state={pageTransition.isExiting ? 'exiting' : pageTransition.isEntering ? 'entering' : 'normal'}
          >
            <Page
              pageNumber={actualPageNumber}
              width={pageWidth}
              height={pageHeight}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              devicePixelRatio={8}
              onLoadSuccess={() => onPageLoadSuccess(actualPageNumber)}
              onLoadError={(error) => onPageLoadError(actualPageNumber, error)}
              onRenderSuccess={() => {
                setTimeout(() => synchronizeTextLayer(), 50);
              }}
            />
          </div>
        );
        })()}

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
              
              // Calculate adjacent PDF pages, handling playlist page logic
              let prevPDFPage, nextPDFPage;
              
              if (isPlaylistPage(currentPage)) {
                // For playlist pages, get adjacent actual PDF pages
                const actualPrevPage = getActualPDFPage(currentPage - 0.5);
                const actualNextPage = getActualPDFPage(currentPage + 0.5);
                
                if (Number.isInteger(actualPrevPage) && actualPrevPage >= 1) {
                  prevPDFPage = actualPrevPage;
                }
                if (Number.isInteger(actualNextPage) && actualNextPage <= numPages) {
                  nextPDFPage = actualNextPage;
                }
              } else {
                // For regular PDF pages, get actual adjacent PDF pages
                const prevDisplayPage = currentPage - 1;
                const nextDisplayPage = currentPage + 1;
                
                if (prevDisplayPage >= 1 && !isPlaylistPage(prevDisplayPage)) {
                  prevPDFPage = getActualPDFPage(prevDisplayPage);
                }
                if (nextDisplayPage <= numPages && !isPlaylistPage(nextDisplayPage)) {
                  nextPDFPage = getActualPDFPage(nextDisplayPage);
                }
              }
              
              if (prevPDFPage && prevPDFPage >= 1 && prevPDFPage <= numPages && 
                  Number.isInteger(prevPDFPage) && !loadedPages.has(prevPDFPage) && 
                  !priorityPages.includes(prevPDFPage)) {
                priorityPages.push(prevPDFPage);
              }
              if (nextPDFPage && nextPDFPage >= 1 && nextPDFPage <= numPages && 
                  Number.isInteger(nextPDFPage) && !loadedPages.has(nextPDFPage) && 
                  !priorityPages.includes(nextPDFPage)) {
                priorityPages.push(nextPDFPage);
              }
              
              for (let i = 1; i <= numPages && priorityPages.length < 10; i++) {
                // Skip if already in priority list or loaded
                if (priorityPages.includes(i) || loadedPages.has(i)) {
                  continue;
                }
                
                // Skip if this PDF page corresponds to the current display page
                const actualCurrentPDFPage = isPlaylistPage(currentPage) ? null : getActualPDFPage(currentPage);
                if (actualCurrentPDFPage && i === actualCurrentPDFPage) {
                  continue;
                }
                
                priorityPages.push(i);
              }
              
              return priorityPages.map(pageNumber => {
                if (!numPages || numPages <= 0) {
                  return null;
                }
                
                // Validate page number is integer and within bounds
                if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > numPages) {
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
      </div>
      
      {/* YouTube playlist viewer - render outside PDF container */}
      {isPlaylistPage(currentPage) && typeof window !== 'undefined' && (() => {
        const playlistData = getPlaylistData(currentPage);
        if (!playlistData) return null;
        
        return createPortal((
          <div 
            className={`fullscreen-playlist-page ${getPageTransitionClass()}`}
            style={{
              ...getPageTransitionStyle()
            }}
            data-current-page={currentPage}
            data-animation-state={pageTransition.isExiting ? 'exiting' : pageTransition.isEntering ? 'entering' : 'normal'}
          >
            <YoutubePlaylistViewer
              playlistUrl={playlistData.playlistUrl}
              title={playlistData.title}
              subtitle={playlistData.subtitle}
            />
          </div>
        ), document.body);
      })()}
      
      {/* Bottom floating indicator using Portal to avoid transform interference */}
      {!isLoading && numPages > 0 && typeof window !== 'undefined' && createPortal(
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
          
          {/* White capsule - fixed bottom center position */}
          <div
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '0',
              right: '0',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
              zIndex: 9999
            }}
          >
            <button
              className="bottom-indicator"
              onClick={handleIndicatorClick}
              style={{
                opacity: 1,
                pointerEvents: 'auto',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                border: 'none',
                borderRadius: '50px', // Maximum border radius for perfect pill shape
                padding: isPlaylistPage(currentPage) && showPageNumber ? '12px 32px' : '12px 24px',
                fontSize: isPlaylistPage(currentPage) ? (showPageNumber ? '14px' : '16px') : '16px',
                fontWeight: '800',
                color: '#333',
                cursor: 'pointer',
                width: isPlaylistPage(currentPage) && showPageNumber ? 'auto' : '200px',
                minWidth: '200px',
                height: isPlaylistPage(currentPage) ? (showPageNumber ? '60px' : '50px') : '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'breathingButton 3s ease-in-out infinite',
                transition: 'width 0.3s ease-in-out, height 0.3s ease-in-out, font-size 0.3s ease-in-out, padding 0.3s ease-in-out',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.animationPlayState = 'paused';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.animationPlayState = 'running';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.animationPlayState = 'paused';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.animationPlayState = 'running';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <span
              style={{
                opacity: isTextTransitioning ? 0 : 1,
                transition: 'opacity 0.3s ease',
                textAlign: 'center',
                lineHeight: '1.2',
                whiteSpace: isPlaylistPage(currentPage) ? (showPageNumber ? 'pre-line' : 'nowrap') : 'nowrap',
                display: 'inline-block'
              }}
            >
              {isPlaylistPage(currentPage) ? (() => {
                const playlistData = getPlaylistData(currentPage);
                if (!playlistData) return 'NEXT';
                
                // For playlist pages, alternate between custom title and 'NEXT'
                if (showPageNumber) {
                  return `${playlistData.title}\n${playlistData.subtitle || ''}`;
                } else {
                  return 'NEXT';
                }
              })() : (showPageNumber ? currentPage : 'NEXT')}
            </span>
          </button>
          </div>
          
          {/* Yellow Donate Capsule - appears above white capsule */}
          <button
            className="donate-capsule"
            onClick={handleDonateClick}
            style={{
              position: 'fixed',
              bottom: showDonateCapsule ? '90px' : '30px',
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
              borderRadius: '50px', // Maximum border radius for perfect pill shape
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
              bottom: showFormCapsule ? '150px' : '90px',
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
              borderRadius: '50px', // Maximum border radius for perfect pill shape
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
    </>
  );
};

export default FullscreenPDFViewer;
