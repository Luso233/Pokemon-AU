import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipPortalProps {
  content: React.ReactNode;
  children: React.ReactElement<React.HTMLAttributes<HTMLElement>>;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
  /** Allows clicking the trigger to pin/unpin the tooltip in addition to hover. */
  triggerOnClick?: boolean;
}

const VIEWPORT_PADDING = 12;
const OFFSET = 10;

export const TooltipPortal: React.FC<TooltipPortalProps> = ({
  content,
  children,
  placement = 'top',
  disabled = false,
  triggerOnClick = false,
}) => {
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; ready: boolean }>({
    top: -9999,
    left: -9999,
    ready: false,
  });

  const open = hovered || pinned;

  useEffect(() => {
    if (!pinned) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setHovered(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setPinned(false);
        setHovered(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    window.addEventListener('mousedown', handlePointerDown);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [pinned]);

  useLayoutEffect(() => {
    if (!open || disabled) return;
    const triggerEl = triggerRef.current;
    const tipEl = tooltipRef.current;
    if (!triggerEl || !tipEl) return;

    const updatePosition = () => {
      const tr = triggerEl.getBoundingClientRect();
      const tipW = tipEl.offsetWidth;
      const tipH = tipEl.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let top = 0;
      let left = 0;

      if (placement === 'left') {
        left = tr.left - tipW - OFFSET;
        top = tr.top + tr.height / 2 - tipH / 2;
        if (left < VIEWPORT_PADDING) {
          left = tr.right + OFFSET;
        }
      } else if (placement === 'right') {
        left = tr.right + OFFSET;
        top = tr.top + tr.height / 2 - tipH / 2;
        if (left + tipW > vw - VIEWPORT_PADDING) {
          left = tr.left - tipW - OFFSET;
        }
      } else if (placement === 'bottom') {
        top = tr.bottom + OFFSET;
        left = tr.left + tr.width / 2 - tipW / 2;
        if (top + tipH > vh - VIEWPORT_PADDING) {
          top = tr.top - tipH - OFFSET;
        }
      } else {
        // default 'top'
        top = tr.top - tipH - OFFSET;
        left = tr.left + tr.width / 2 - tipW / 2;
        if (top < VIEWPORT_PADDING) {
          top = tr.bottom + OFFSET;
        }
      }

      // Final strict viewport clamping so tooltips NEVER clip off-screen
      left = Math.max(
        VIEWPORT_PADDING,
        Math.min(vw - tipW - VIEWPORT_PADDING, left)
      );
      top = Math.max(
        VIEWPORT_PADDING,
        Math.min(vh - tipH - VIEWPORT_PADDING, top)
      );

      setCoords({ top, left, ready: true });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open, disabled, placement, content]);

  if (disabled) {
    return children;
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex max-w-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => {
          if (!pinned) setHovered(false);
        }}
        onClick={
          triggerOnClick
            ? (e) => {
                e.stopPropagation();
                setPinned((v) => !v);
              }
            : undefined
        }
      >
        {children}
      </span>

      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              opacity: coords.ready ? 1 : 0,
            }}
            className={`${
              pinned ? 'pointer-events-auto' : 'pointer-events-none'
            } z-[100] w-max max-w-[21rem] transition-opacity duration-100`}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
};
