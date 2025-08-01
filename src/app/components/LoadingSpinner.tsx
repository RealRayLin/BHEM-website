'use client';

import { useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';

interface LoadingSpinnerProps {
  progress?: number; // 0-1 之间的进度值
  size?: number; // 容器大小，默认128px
  logoSrc?: string;
  logoSize?: number;
  isFullscreen?: boolean; // 是否显示全屏覆盖层
  isVisible?: boolean; // 控制显示/隐藏
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  progress = 0,
  size = 128,
  logoSrc = "/logo.png",
  logoSize = 36,
  isFullscreen = false,
  isVisible = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const strokeWidth = 8;
  const radius = 45;
  const circumference = 282.743; // 预计算的2 * π * 45
  const logoContainerSize = 72; // 固定Logo容器大小
  
  const strokeDashoffset = useMemo(() => {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    return circumference * (1 - clampedProgress);
  }, [progress, circumference]);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (currentContainer) {
      currentContainer.style.willChange = 'transform, opacity';
      currentContainer.style.backfaceVisibility = 'hidden';
      currentContainer.style.perspective = '1000px';
      currentContainer.style.transform = 'translateZ(0)'; // 强制硬件加速
    }
    
    return () => {
      if (currentContainer) {
        currentContainer.style.willChange = 'auto';
      }
    };
  }, []);

  useEffect(() => {
    if (isFullscreen) {
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        if (containerRef.current) {
          containerRef.current.style.transform = 'translateZ(0)';
        }
      };

      setVH();

      let ticking = false;
      const handleResize = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            setVH();
            ticking = false;
          });
          ticking = true;
        }
      };

      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', setVH);
      window.addEventListener('scroll', handleResize, { passive: true });
      
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleResize);
      }

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', setVH);
        window.removeEventListener('scroll', handleResize);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleResize);
        }
      };
    }
  }, [isFullscreen]);

  if (!isVisible) {
    return null;
  }

  
  const spinnerContent = (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`,
        transformStyle: 'preserve-3d',
        contain: 'layout style paint',
        isolation: 'isolate'
      }}
    >
      {/* CSS动画定义 - 内联避免外部依赖 */}
      <style jsx>{`
        
        /* Chrome mobile specific centering fix */
        @media screen and (max-width: 768px) {
          .fullscreen-loading {
            /* Use viewport units that adjust for Chrome's address bar */
            height: 100dvh !important;
            min-height: 100dvh !important;
            /* Additional centering for problematic Chrome versions */
            place-items: center;
            place-content: center;
            /* Prevent any potential overflow issues */
            overflow: hidden;
            /* Force re-center on orientation change */
            align-items: center !important;
            justify-content: center !important;
          }
        }
      `}</style>
      
      {/* 环形进度条 */}
      <svg 
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'rotate(-90deg) translateZ(0)', // 硬件加速
          display: 'block',
          shapeRendering: 'geometricPrecision' // 提高渲染质量
        }}
      >
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
        
        {/* 进度圆环 - 改为黄色 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E6AC40"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // 更流畅的缓动
            transform: 'translateZ(0)' // 硬件加速
          }}
        />
      </svg>
      
      {/* Logo容器 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) translateZ(0)', // 硬件加速
          width: `${logoContainerSize}px`,
          height: `${logoContainerSize}px`,
          background: 'white',
          borderRadius: '50%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 8px rgba(230, 172, 64, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          contain: 'layout style',
          isolation: 'isolate'
        }}
      >
        <Image 
          src={logoSrc}
          alt="Logo" 
          width={logoSize}
          height={logoSize}
          priority
          style={{ 
            objectFit: 'contain',
            maxWidth: '60%',
            maxHeight: '60%',
            transform: 'translateZ(0)' // 硬件加速
          }}
        />
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div 
        className="fullscreen-loading"
        style={{
          position: 'fixed',
          top: 'env(safe-area-inset-top, 0)',
          left: 'env(safe-area-inset-left, 0)',
          right: 'env(safe-area-inset-right, 0)',
          bottom: 'env(safe-area-inset-bottom, 0)',
          width: 'calc(100vw - env(safe-area-inset-left, 0) - env(safe-area-inset-right, 0))',
          /* Use dynamic viewport height for Chrome mobile */
          height: '100dvh',
          /* Fallback for older browsers that don't support dvh */
          minHeight: 'calc(var(--vh, 1vh) * 100)',
          background: 'var(--bhem-deep-cocoa, #44200F)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          /* Force proper centering on mobile Chrome */
          alignContent: 'center',
          flexDirection: 'column',
          zIndex: 9999,
          /* Ensure proper rendering on mobile */
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)'
        }}
      >
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default LoadingSpinner;
