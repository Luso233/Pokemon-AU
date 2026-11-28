import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X } from 'lucide-react';

interface HelpTipProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  size?: 'xs' | 'sm';
}

/**
 * Discreet `?` button that opens a clean, touch-friendly modal/sheet with rules or formulas
 * so verbose explanations never clutter the main UI on mobile or desktop.
 */
export const HelpTip: React.FC<HelpTipProps> = ({
  title,
  badge,
  children,
  className = '',
  size = 'sm',
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={`Ayuda: ${title}`}
        title={title}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={`inline-flex shrink-0 items-center justify-center rounded-full border border-slate-600/80 bg-slate-900/90 text-slate-300 transition hover:border-amber-400/70 hover:bg-amber-500/15 hover:text-amber-200 cursor-pointer ${
          size === 'xs' ? 'h-4 w-4' : 'h-5 w-5'
        } ${className}`}
      >
        <HelpCircle className={size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      </button>

      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl border border-amber-400/45 bg-[#0a1020] p-4 text-left text-slate-100 shadow-2xl shadow-black/90"
            >
              <div className="mb-2.5 flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <HelpCircle className="h-4 w-4 shrink-0 text-amber-400" />
                  <h3 className="truncate text-sm font-extrabold text-amber-200">
                    {title}
                  </h3>
                  {badge && (
                    <span className="font-mono-code shrink-0 rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 text-[9.5px] font-bold text-slate-300">
                      {badge}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Cerrar ayuda"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-2 text-xs leading-relaxed text-slate-300">
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
