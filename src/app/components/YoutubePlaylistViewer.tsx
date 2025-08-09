'use client';

import { useState, useEffect } from 'react';

interface YoutubePlaylistViewerProps {
  playlistUrl: string;
  title: string;
  subtitle: string;
}

const YoutubePlaylistViewer: React.FC<YoutubePlaylistViewerProps> = ({
  playlistUrl,
  title,
  subtitle
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Extract playlist ID from URL for embed
  const getPlaylistId = (url: string): string => {
    try {
      const urlObj = new URL(url);
      const listParam = urlObj.searchParams.get('list');
      return listParam || 'PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4';
    } catch {
      return 'PLUVpFBRxKq4N5LUQ0nJY1u8PZ22M2EzE4';
    }
  };

  const playlistId = getPlaylistId(playlistUrl);
  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&rel=0&modestbranding=1`;

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setIframeError(true);
  };

  const handleFallbackClick = () => {
    if (typeof window !== 'undefined') {
      window.open(playlistUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d1117',
        color: '#fff',
        fontSize: '18px',
        zIndex: 1000
      }}>
        Loading playlist...
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: 1000,
        backgroundColor: '#0d1117',
        display: 'table',
        tableLayout: 'fixed'
      }}
    >
      {/* Table-cell centering method - most reliable */}
      <div style={{
        display: 'table-cell',
        verticalAlign: 'middle',
        textAlign: 'center',
        width: '100%',
        height: '100%'
      }}>
        <div style={{
          display: 'inline-block',
          textAlign: 'left',
          verticalAlign: 'middle'
        }}>
          {/* Content wrapper */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px'
          }}>
            {/* Title */}
            <div style={{
              color: '#fff',
              fontSize: 'clamp(18px, 3vw, 28px)',
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: '1.2',
              whiteSpace: 'nowrap'
            }}>
              {title}
            </div>
            
            {/* Subtitle */}
            <div style={{
              color: '#8b949e',
              fontSize: 'clamp(12px, 2vw, 16px)',
              textAlign: 'center',
              whiteSpace: 'nowrap'
            }}>
              {subtitle}
            </div>
            
            {/* Iframe Container */}
            <div style={{
              width: 'min(80vw, 800px)',
              height: 'min(45vh, 450px)',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              backgroundColor: '#000'
            }}>
              {iframeError ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#21262d',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #30363d',
                  cursor: 'pointer',
                  borderRadius: '12px'
                }}
                onClick={handleFallbackClick}
                >
                  <div style={{
                    color: '#8b949e',
                    fontSize: '18px',
                    marginBottom: '10px'
                  }}>
                    Unable to load playlist
                  </div>
                  <div style={{
                    color: '#58a6ff',
                    fontSize: '14px',
                    textDecoration: 'underline'
                  }}>
                    Click to open in YouTube
                  </div>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    display: 'block',
                    borderRadius: '12px'
                  }}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                  onError={handleIframeError}
                />
              )}
            </div>
            
            {/* Fallback link */}
            <div style={{
              color: '#58a6ff',
              fontSize: '14px',
              cursor: 'pointer',
              textDecoration: 'underline',
              textAlign: 'center'
            }}
            onClick={handleFallbackClick}
            >
              Open in YouTube
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoutubePlaylistViewer;