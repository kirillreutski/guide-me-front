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



  // Draft annotation (in-progress for drag-to-add)
  const [draftAnnotation, setDraftAnnotation] = useState<Annotation|null>(null);
  const [isDrafting, setIsDrafting] = useState(false);


  useEffect(() => {
    console.log('selectedAnnotation: ', selectedAnnotation);
  }, [selectedAnnotation]);
  // Pan & zoom states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const mouseStart = useRef({ x: 0, y: 0 });

  // Scroll viewport to center canvas on mount & zoom reset
  const viewportRef = useRef<HTMLDivElement>(null);

  const SLIDE_MARGIN = 48;

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const zoomWidth = (vp.clientWidth - SLIDE_MARGIN * 2) / SLIDE_W;
    const zoomHeight = (vp.clientHeight - SLIDE_MARGIN * 2) / SLIDE_H;
    const bestZoom = Math.min(zoomWidth, zoomHeight, 1); // don't auto over-zoom
    setZoom(bestZoom);
  }, []);

  // Optionally, you can make above run on window resize too for better UX:
  useEffect(() => {
    const onResize = () => {
      const vp = viewportRef.current;
      if (!vp) return;
      const zoomWidth = (vp.clientWidth - SLIDE_MARGIN * 2) / SLIDE_W;
      const zoomHeight = (vp.clientHeight - SLIDE_MARGIN * 2) / SLIDE_H;
      const bestZoom = Math.min(zoomWidth, zoomHeight, 1);
      setZoom(bestZoom);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Always recenter the viewport after zoom changes (wait for DOM)
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    requestAnimationFrame(() => {
      const centerX = CANVAS_SIZE / 2 * zoom - vp.clientWidth / 2;
      const centerY = CANVAS_SIZE / 2 * zoom - vp.clientHeight / 2;
      vp.scrollLeft = centerX;
      vp.scrollTop = centerY;
    });
  }, [zoom]);

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

  // Restore missing handleMouseUp to safely end interaction state
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
    finalizeDraftAnnotation();
  };

  const finalizeDraftAnnotation = () => {
    if (isDrafting && draftAnnotation && selectedTool) {
      if (selectedTool === 'highlight') {
        if (Math.abs(draftAnnotation.width) > 5 && Math.abs(draftAnnotation.height) > 5) {
          addAnnotation('highlight', draftAnnotation.x, draftAnnotation.y, {width: draftAnnotation.width, height: draftAnnotation.height});//Math.abs(), Math.abs(draftAnnotation.height));
        }
      } else if (selectedTool === 'arrow' && draftAnnotation.arrowPoints) {
        const { x1, y1, x2, y2 } = draftAnnotation.arrowPoints;
        if (Math.abs(x2 - x1) > 10 || Math.abs(y2 - y1) > 10) {
          addAnnotation('arrow', x1, y1, {arrowPoints: { x1, y1, x2, y2 }});//Math.abs(x2-x1), Math.abs(y2-y1), 0, undefined, { x1, y1, x2, y2 });
        }
      }
      setDraftAnnotation(null);
      setIsDrafting(false);
      setSelectedTool(null);
    }
  };

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

  // Logical constants for canvas and live slide area
  const CANVAS_SIZE = 3000;
  const SLIDE_W = 1600;
  const SLIDE_H = 900;
  const SLIDE_CENTER_X = CANVAS_SIZE / 2;
  const SLIDE_CENTER_Y = CANVAS_SIZE / 2;

  // Given a mouse event, get the actual canvas X,Y under zoom/scroll
  const getCanvasPointerCoords = (e: React.MouseEvent) => {
    const viewport = viewportRef.current;
    if (!viewport) return { x: 0, y: 0 };
    // 1. Get viewport's bounding box (relative to screen)
    const rect = viewport.getBoundingClientRect();
    // 2. Mouse position relative to the scrollable viewport
    const offsetX = e.clientX - rect.left + viewport.scrollLeft;
    const offsetY = e.clientY - rect.top + viewport.scrollTop;
    // 3. Undo zoom scaling
    return {
      x: offsetX / zoom,
      y: offsetY / zoom
    };
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    console.log('handleEditorClick: ', isPanning);
    if (isPanning) return;
    const target = e.target as HTMLElement;
    console.log('handleEditorClick: ', isPanning, target.closest('[data-annotation]'), selectedTool, isDrafting);

    if (target.closest('[data-annotation]')) {
      const annotation = currentSlide.annotations.find(a => a.id === target.closest('[data-annotation]')?.getAttribute('data-id'));
      if (annotation) {
        setSelectedAnnotation(annotation);
      }
      return;
    }

    if (selectedTool && !isDrafting) {
      const pos = getCanvasPointerCoords(e);
      const minX = SLIDE_CENTER_X - SLIDE_W / 2;
      const minY = SLIDE_CENTER_Y - SLIDE_H / 2;
      const maxX = SLIDE_CENTER_X + SLIDE_W / 2;
      const maxY = SLIDE_CENTER_Y + SLIDE_H / 2;
      if (!(pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY)) {
        console.log('handleEditorClick: out of bounds', pos, minX, minY, maxX, maxY);
        return;
      }
      if (selectedTool === 'text') {
        addAnnotation('text', pos.x, pos.y);
        setSelectedTool(null);
        window.dispatchEvent(new CustomEvent('annotation-added', { detail: { type: selectedTool } }));
      } else if (selectedTool === 'highlight') {
        setIsDrafting(true);
        setDraftAnnotation({
          id: 'draft', type: 'highlight', content: '', x: pos.x, y: pos.y, originX: pos.x, originY: pos.y, width: 1, height: 1, rotation: 0, color: '#ffd600',
        } as any);
      } else if (selectedTool === 'arrow') {
        setIsDrafting(true);
        setDraftAnnotation({
          id: 'draft', type: 'arrow', content: '', x: pos.x, y: pos.y, width: 1, height: 1, rotation: 0, color: '#ffd600',
          arrowPoints: { x1: pos.x, y1: pos.y, x2: pos.x, y2: pos.y },
        } as any);
      }
      return;
    }
    setSelectedAnnotation(null);
  };

  const handleEditorDrag = (e: React.MouseEvent) => {
    console.log('handleEditorDrag: ', isDrafting, draftAnnotation, selectedTool);
    if (isDrafting && draftAnnotation && selectedTool) {
      const pos = getCanvasPointerCoords(e);
      if (draftAnnotation.type === 'highlight') {
        setDraftAnnotation({
          ...draftAnnotation, x: draftAnnotation.originX, y: draftAnnotation.originY, width: pos.x, height: pos.y
        })
        // console.log('updating coords: ', pos.x, pos.y, draftAnnotation.x, draftAnnotation.y);
        // const newX = pos.x < draftAnnotation.x ? pos.x : draftAnnotation.x;
        // const newY = pos.y < draftAnnotation.y ? pos.y : draftAnnotation.y;
        // const newW = Math.abs(pos.x - draftAnnotation.x);
        // const newH = Math.abs(pos.y - draftAnnotation.y);
        // setDraftAnnotation({ ...draftAnnotation, x: newX, y: newY, width: newW, height: newH });
        // setDraftAnnotation({ ...draftAnnotation, width: pos.x - draftAnnotation.x, height: pos.y - draftAnnotation.y });
      } else if (draftAnnotation.type === 'arrow' && draftAnnotation.arrowPoints) {
        setDraftAnnotation({ ...draftAnnotation, arrowPoints: { ...draftAnnotation.arrowPoints, x2: pos.x, y2: pos.y } });
      }
      return;
    }
    // Existing handleMouseMove for selectedAnnotation drag/resize can go here...
    // ...
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    console.log('handleMouseMove: ', isDragging, isResizing, selectedAnnotation);
    if (!isDragging && !isResizing) return;
    if (!selectedAnnotation) return;
    const pos = getCanvasPointerCoords(e);
    if (isResizing && resizeDirection && (selectedAnnotation.type === 'highlight' || selectedAnnotation.type === 'text')) {
      // Only box/rect types for resize for now
      let newW = selectedAnnotation.width;
      let newH = selectedAnnotation.height;
      switch (resizeDirection) {
        case 'se':
          newW = Math.max(10, pos.x - selectedAnnotation.x);
          newH = Math.max(10, pos.y - selectedAnnotation.y);
          break;
        case 'e':
          newW = Math.max(10, pos.x - selectedAnnotation.x);
          break;
        case 's':
          newH = Math.max(10, pos.y - selectedAnnotation.y);
          break;
      }
      updateAnnotation({ ...selectedAnnotation, width: newW, height: newH });
      return;
    }
    if (isDragging) {
      // Drag any annotation type by its top-left anchor
      updateAnnotation({
        ...selectedAnnotation,
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y,
      });
    }
  };

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
            onClick={() => {
              deleteAnnotation(selectedAnnotation.id);
              setSelectedAnnotation(null);
            }}
            aria-label="Delete selected annotation"
          >
            Delete Annotation
          </button>
        )}
      </div>
      <div
        ref={viewportRef}
        className="relative w-full h-full max-w-6xl max-h-[80vh] bg-neutral-100 shadow-lg outline-none overflow-auto"
        style={{ minHeight: SLIDE_H * 0.6, minWidth: SLIDE_W * 0.7 }}
        tabIndex={0}
      >
        {/* CANVAS ABSOLUTELY POSITIONED */}
        <div
          ref={editorRef}
          className="absolute top-0 left-0"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            pointerEvents: 'auto',
            background: 'transparent',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
          onMouseDown={(e) => { handlePanStart(e); handleEditorClick(e); }}
          onMouseMove={(e) => { handlePan(e); handleEditorDrag(e); }}
          onMouseUp={() => { handlePanEnd(); handleMouseUp(); }}
          onMouseLeave={() => { handlePanEnd(); handleMouseUp(); }}
        >
          {/* Overlay outside slide area */}
          <svg
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 1 }}
          >
            <defs>
              <mask id="slideAreaMask">
                <rect width={CANVAS_SIZE} height={CANVAS_SIZE} fill="white" />
                <rect
                  x={SLIDE_CENTER_X - SLIDE_W / 2}
                  y={SLIDE_CENTER_Y - SLIDE_H / 2}
                  width={SLIDE_W}
                  height={SLIDE_H}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              fill="rgba(60,60,77,0.08)"
              mask="url(#slideAreaMask)"
            />
            {/* Slide area border */}
            <rect
              x={SLIDE_CENTER_X - SLIDE_W / 2}
              y={SLIDE_CENTER_Y - SLIDE_H / 2}
              width={SLIDE_W}
              height={SLIDE_H}
              fill="none"
              stroke="#2787f5"
              strokeWidth={4}
            />
          </svg>

          {/* Slide background image logic: center/fit inside live rect */}
          {currentSlide.backgroundImage && (
            (() => {
              // Calculate max-fit for image centering/fitting
              const imgURL = currentSlide.backgroundImage;
              const imgAspect = currentSlide.backgroundImageAspect || (16/9);
              const targetAspect = SLIDE_W / SLIDE_H;
              let bgW = SLIDE_W, bgH = SLIDE_H;
              if (imgAspect > targetAspect) {
                // image wider than target: fit by width
                bgW = SLIDE_W;
                bgH = SLIDE_W / imgAspect;
              } else {
                // image taller: fit by height
                bgH = SLIDE_H;
                bgW = SLIDE_H * imgAspect;
              }
              return (
                <img
                  src={imgURL}
                  alt="slide background"
                  style={{
                    position: 'absolute',
                    left: SLIDE_CENTER_X - bgW / 2,
                    top: SLIDE_CENTER_Y - bgH / 2,
                    width: bgW,
                    height: bgH,
                    objectFit: 'contain',
                    zIndex: 2,
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              );
            })()
          )}
          {/* Slide area background color if no image */}
          {!currentSlide.backgroundImage && (
            <rect
              x={SLIDE_CENTER_X - SLIDE_W / 2}
              y={SLIDE_CENTER_Y - SLIDE_H / 2}
              width={SLIDE_W}
              height={SLIDE_H}
              style={{
                position: 'absolute',
                zIndex: 0,
                backgroundColor: currentSlide.backgroundColor || '#fff',
              }}
            />
          )}

          {/* All annotations use canvas coordinates (0...3000) */}
          {currentSlide.annotations.map((annotation) => {
            const isSelected = selectedAnnotation?.id === annotation.id;
            if (annotation.type === 'highlight') {

              const x0 = annotation.x;
              const y0 = annotation.y;
              const x1 = annotation.width;
              const y1 = annotation.height;
              const left = Math.min(x0, x1);
              const top = Math.min(y0, y1);
              const width = Math.abs(x1 - x0);
              const height = Math.abs(y1 - y0);

              console.log('Draw position: ', left, top, width, height, x0, y0, x1, y1, annotation);

              return <div
                  key={annotation.id}
                  data-annotation
                  className="highlight-annotation"
                  onClick={() => setSelectedAnnotation(annotation)}

                  style={{
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    background: annotation.color,
                    opacity: 0.25,
                    border: isSelected ? '2px solid #ffd600' : '1px solid #888',
                    borderRadius: 7,
                    zIndex: isSelected ? 11 : 10,
                    pointerEvents: 'auto',
                    boxSizing: 'border-box'
                  }}
              />
              // return (
              //     <div
              //         key={annotation.id}
              //         data-annotation
              //         style={{
              //           position: 'absolute',
              //           left: annotation.x,
              //           top: annotation.y,
              //           width: annotation.width,
              //           height: annotation.height,
              //           background: annotation.color,
              //           opacity: 0.25,
              //           border: isSelected ? '2px solid #ffd600' : '1px solid #888',
              //           borderRadius: 7,
              //           zIndex: isSelected ? 11 : 10,
              //           pointerEvents: 'auto',
              //           boxSizing: 'border-box'
              //         }}
              //     />
              // );
            }
            if (annotation.type === 'arrow' && annotation.arrowPoints) {
              const { x1, y1, x2, y2 } = annotation.arrowPoints;
              // Calculate a tight bounding box plus padding
              const pad = 24;
              const left = Math.min(x1, x2) - pad;
              const top = Math.min(y1, y2) - pad;
              const width = Math.abs(x2 - x1) + pad * 2;
              const height = Math.abs(y2 - y1) + pad * 2;
              // Arrow endpoints relative to this SVG
              const relX1 = x1 - left;
              const relY1 = y1 - top;
              const relX2 = x2 - left;
              const relY2 = y2 - top;

              return (
                  <svg
                      key={annotation.id}
                      data-annotation
                      style={{
                        position: "absolute",
                        left,
                        top,
                        width,
                        height,
                        pointerEvents: "auto", // Enable events in child lines
                        zIndex: 12,
                      }}
                  >
                    <defs>
                      <marker
                          id={`arrowhead-${annotation.id}`}
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                      >
                        <polygon points="0 0,10 3.5,0 7" fill={annotation.color} />
                      </marker>
                    </defs>
                    {/* Transparent fat click line for hit area */}
                    <line
                        x1={relX1}
                        y1={relY1}
                        x2={relX2}
                        y2={relY2}
                        stroke="transparent"
                        strokeWidth={24}
                        pointerEvents="stroke"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedAnnotation(annotation);
                        }}
                    />
                    {/* Visual line */}
                    <line
                        x1={relX1}
                        y1={relY1}
                        x2={relX2}
                        y2={relY2}
                        stroke={annotation.color}
                        strokeWidth={isSelected ? 6 : 4}
                        markerEnd={`url(#arrowhead-${annotation.id})`}
                        pointerEvents="none"
                    />
                  </svg>
              );
            }

            return (
              <div
                key={annotation.id}
                data-annotation
                style={{
                  position: 'absolute',
                  left: annotation.x,
                  top: annotation.y,
                  width: annotation.width,
                  height: annotation.height,
                  backgroundColor: isSelected ? 'rgba(255, 255, 0, 0.5)' : 'transparent',
                }}
                onClick={() => setSelectedAnnotation(annotation)}
              >
                {/* Render annotation content based on type */}
                {annotation.type === 'text' && <span>{annotation.content}</span>}
                {/* Add other annotation types here */}
              </div>
            );
          })}
          {draftAnnotation && isDrafting && (draftAnnotation.type === 'highlight') && (
              [''].map(_ => {

                const x0 = draftAnnotation.originX;
                const y0 = draftAnnotation.originY;
                const x1 = draftAnnotation.width;
                const y1 = draftAnnotation.height;
                const left = Math.min(x0, x1);
                const top = Math.min(y0, y1);
                const width = Math.abs(x1 - x0);
                const height = Math.abs(y1 - y0);
                console.log('Rendering draft highlight: ', left, top, width, height);
                if (left === 1 && top === 1) return <></>
                return <div
                    key={draftAnnotation.id}
                    data-annotation
                    style={{
                      position: 'absolute',
                      left,
                      top,
                      width,
                      height,
                      background: '#ffd600',
                      opacity: 0.25,
                      border: '2px dashed #ebc000', borderRadius: 8,
                      borderRadius: 7,
                      pointerEvents: 'auto',
                      boxSizing: 'border-box'
                    }}
                />
              })
          )}
          {draftAnnotation && isDrafting && draftAnnotation.type === 'arrow' && draftAnnotation.arrowPoints && (
            <svg
              key={draftAnnotation.id}
              style={{position: 'absolute', left: 0, top: 0, width: CANVAS_SIZE, height: CANVAS_SIZE, pointerEvents: 'none', zIndex: 99}}
            >
              <defs>
                <marker id={`arrowhead-draft`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0,10 3.5,0 7" fill="#ffd600" /></marker>
              </defs>
              <line
                x1={draftAnnotation.arrowPoints.x1} y1={draftAnnotation.arrowPoints.y1}
                x2={draftAnnotation.arrowPoints.x2} y2={draftAnnotation.arrowPoints.y2}
                stroke="#ffd600"
                strokeWidth={4}
                markerEnd={`url(#arrowhead-draft)`}
                strokeDasharray="7"
              />
            </svg>
          )}
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
