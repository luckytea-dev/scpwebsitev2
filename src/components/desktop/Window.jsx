import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Minus, Maximize2 } from 'lucide-react';

const DEFAULT_SIZES = {
  admin: { w: 1100, h: 750 },
  default: { w: 800, h: 600 },
};

export default function Window({ id, title, children, isOpen, isMinimized, onClose, onMinimize, zIndex, bringToFront, forceOnTop }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const defaultSize = DEFAULT_SIZES[id] || DEFAULT_SIZES.default;
  const [size, setSize] = useState({ w: defaultSize.w, h: defaultSize.h });
  const resizing = useRef(false);
  const resizeDir = useRef('');
  const startPos = useRef({});
  const startSize = useRef({});

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const dragControls = useDragControls();
  if (!isOpen) return null;
  const fullscreen = isMaximized || isMobile;

  const onResizeMouseDown = (e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    resizeDir.current = dir;
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { w: size.w, h: size.h };

    const onMove = (ev) => {
      if (!resizing.current) return;
      const dx = ev.clientX - startPos.current.x;
      const dy = ev.clientY - startPos.current.y;
      setSize({
        w: Math.max(400, startSize.current.w + (resizeDir.current.includes('e') ? dx : resizeDir.current.includes('w') ? -dx : 0)),
        h: Math.max(300, startSize.current.h + (resizeDir.current.includes('s') ? dy : resizeDir.current.includes('n') ? -dy : 0)),
      });
    };
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <AnimatePresence>
      {!isMinimized && (
        <motion.div
          drag={!fullscreen}
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onPointerDown={() => bringToFront(id)}
          className={`absolute flex flex-col bg-slate-950 border border-slate-700 shadow-2xl overflow-hidden ${fullscreen ? 'w-full rounded-none' : 'rounded-lg'}`}
          style={{
            zIndex: forceOnTop ? 9999 : zIndex,
            top: fullscreen ? 32 : '5vh',
            left: fullscreen ? 0 : '5vw',
            width: fullscreen ? '100%' : size.w,
            height: fullscreen ? 'calc(100vh - 80px)' : size.h,
          }}
        >
          {/* Title bar */}
          <div
            className="flex justify-between items-center bg-slate-900 border-b border-slate-700 px-3 py-2 cursor-move select-none flex-shrink-0"
            onPointerDown={(e) => { if (!fullscreen) dragControls.start(e); }}
            style={{ touchAction: 'none' }}
          >
            <div className="text-sm font-bold text-slate-300 tracking-widest pointer-events-none">{title}</div>
            <div className="flex space-x-2" onPointerDown={(e) => e.stopPropagation()}>
              <button onClick={() => onMinimize(id)} className="text-slate-400 hover:text-white p-1 bg-slate-800 hover:bg-slate-700 rounded"><Minus size={14} /></button>
              <button onClick={() => setIsMaximized(!isMaximized)} className="text-slate-400 hover:text-white p-1 bg-slate-800 hover:bg-slate-700 rounded"><Maximize2 size={14} /></button>
              <button onClick={() => onClose(id)} className="text-slate-400 hover:text-white p-1 bg-red-900 hover:bg-red-700 rounded"><X size={14} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-auto relative">
            {children}
          </div>

          {/* Resize handles */}
          {!fullscreen && (
            <>
              <div onMouseDown={e => onResizeMouseDown(e, 'se')} className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10" style={{ background: 'transparent' }} />
              <div onMouseDown={e => onResizeMouseDown(e, 's')} className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize z-10" />
              <div onMouseDown={e => onResizeMouseDown(e, 'e')} className="absolute top-8 bottom-2 right-0 w-2 cursor-e-resize z-10" />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}