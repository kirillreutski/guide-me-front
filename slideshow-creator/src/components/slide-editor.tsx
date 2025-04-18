'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useSlideshowContext } from '@/context/slideshow-context';
import type { Annotation, AnnotationType } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function SlideEditor() {
  const { toast } = useToast();
  const {
    currentSlideshow,
    currentSlideIndex,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation
  } = useSlideshowContext();

  const [selectedAnnotation, setSelectedAnnotation] = React.useState<Annotation | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeDirection, setResizeDirection] = React.useState('');
  const [selectedTool, setSelectedTool] = React.useState<AnnotationType | null>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);

  // Pan & zoom states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });

  const clampZoom = (value: number) => Math.max(0.2, Math.min(3, value));
  const handleZoomIn = () => setZoom((z) => clampZoom(z + 0.1));
  const handleZoomOut = () => setZoom((z) => clampZoom(z - 0.1));
  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel for zoom (ctrl+wheel)
  useEffect(() => {
    const node = editorRef.current;
    if (!node) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setZoom((z) => clampZoom(z - e.deltaY * 0.002));
      }
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [editorRef]);

  // Start panning with middle mouse or ctrl+left drag
  const handlePanStart = (e: React.MouseEvent) => {
    // Middle mouse button or ctrl+left mouse button drag
    if (
      e.button === 1 ||
      (e.button === 0 && e.nativeEvent instanceof MouseEvent && e.nativeEvent.buttons === 1 && e.nativeEvent.ctrlKey)
    ) {
      setIsPanning(true);
      panStart.current = pan;
      mouseStart.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handlePan = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy });
  };
  const handlePanEnd = () => setIsPanning(false);

  // Listen for key events to delete the selected annotation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedAnnotation) {
        deleteAnnotation(selectedAnnotation.id);
        setSelectedAnnotation(null);

        toast({
          title: "Annotation deleted",
          description: "The annotation has been removed from the slide."
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deleteAnnotation, selectedAnnotation, toast]);

  // Subscribe to tool changes from the ToolPanel
  React.useEffect(() => {
    const handleToolChange = (e: CustomEvent) => {
      setSelectedTool(e.detail.tool);
    };

    window.addEventListener('tool-change' as any, handleToolChange);
    return () => window.removeEventListener('tool-change' as any, handleToolChange);
  }, []);

  // Editing state for text annotations
  const [editingTextId, setEditingTextId] = useState<string|null>(null);
  const [editingTextContent, setEditingTextContent] = useState('');

  if (!currentSlideshow || currentSlideIndex >= currentSlideshow.slides.length) {
    return <div className="text-center p-8 text-gray-500">No slide selected</div>;
  }

  const currentSlide = currentSlideshow.slides[currentSlideIndex];

  // Canvas size matches the logical slide size (e.g. 1280x720 or whatever base size is used per slide)
  const slideW = currentSlide.width || 1280;
  const slideH = currentSlide.height || 720;

  return (
    <>
      <div className="mb-2 flex gap-1 items-center">
        <button type="button" className="px-2" onClick={handleZoomOut} aria-label="Zoom out">-</button>
        <span className="px-2 select-none">{Math.round(zoom * 100)}%</span>
        <button type="button" className="px-2" onClick={handleZoomIn} aria-label="Zoom in">+</button>
        <button type="button" className="px-2 text-xs border px-1 ml-3" onClick={handleZoomReset} aria-label="Reset zoom">Reset</button>
        <span className="text-xs text-gray-500 ml-2 select-none">(Ctrl+wheel, drag with middle mouse)</span>
        {selectedAnnotation && (
          <button
            type="button"
            className="ml-auto px-2 py-1 text-red-600 border border-red-600 rounded text-sm hover:bg-red-600 hover:text-white transition"
            onClick={handleDeleteAnnotation}
            aria-label="Delete selected annotation"
          >
            Delete Annotation
          </button>
        )}
      </div>
      <div
        className="relative w-full h-full max-w-6xl max-h-[80vh] bg-neutral-100 shadow-lg outline-none overflow-auto flex items-center justify-center"
        style={{ minHeight: slideH * 0.6 }}
        tabIndex={0}
        ref={editorRef}
        onMouseDown={(e) => { handlePanStart(e); handleEditorClick(e); }}
        onMouseMove={(e) => { handlePan(e); handleMouseMove(e); }}
        onMouseUp={(e) => { handlePanEnd(); handleMouseUp(); }}
        onMouseLeave={() => { handlePanEnd(); handleMouseUp(); }}
      >
        {/* The actual canvas where slide background and all content lives */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: slideW,
            height: slideH,
            transform: `translate(-50%, -50%) scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'top left',
            backgroundColor: currentSlide.backgroundColor,
            backgroundImage: currentSlide.backgroundImage ? `url(${currentSlide.backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
            borderRadius: 10,
            overflow: 'visible',
            pointerEvents: 'auto',
            position: 'absolute',
          }}
        >
          {renderAnnotations()}
        </div>
        {selectedTool && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded text-sm select-none pointer-events-none z-30">
            Click to add {selectedTool}
          </div>
        )}
      </div>
    </>
  );
}
