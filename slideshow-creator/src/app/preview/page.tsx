'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSlideshowContext } from '@/context/slideshow-context';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Preview() {
  const router = useRouter();
  const { currentSlideshow, currentSlideIndex, setCurrentSlideIndex } = useSlideshowContext();
  const [isControlsVisible, setIsControlsVisible] = React.useState(true);

  React.useEffect(() => {
    if (!currentSlideshow) {
      router.push('/');
    }

    // Hide controls after 3 seconds
    const timer = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentSlideshow, router]);

  const handleNext = () => {
    if (!currentSlideshow) return;
    if (currentSlideIndex < currentSlideshow.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleExitPreview = () => {
    router.push('/editor');
  };

  const handleMouseMove = () => {
    setIsControlsVisible(true);

    // Hide controls after 3 seconds of inactivity
    const timer = setTimeout(() => {
      setIsControlsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  };

  if (!currentSlideshow) {
    return null; // Will be redirected by useEffect
  }

  const currentSlide = currentSlideshow.slides[currentSlideIndex];

  return (
    <div
      className="h-screen w-screen flex items-center justify-center bg-black relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Slide content */}
      <div
        className="w-full h-full max-w-6xl max-h-[80vh] bg-white relative"
        style={{
          backgroundColor: currentSlide.backgroundColor,
          backgroundImage: currentSlide.backgroundImage ? `url(${currentSlide.backgroundImage})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {currentSlide.annotations.map((annotation) => {
          switch (annotation.type) {
            case 'text':
              return (
                <div
                  key={annotation.id}
                  className="absolute"
                  style={{
                    left: `${annotation.x}px`,
                    top: `${annotation.y}px`,
                    transform: `rotate(${annotation.rotation}deg)`,
                    color: annotation.color,
                    fontSize: `${annotation.fontSize}px`,
                    width: `${annotation.width}px`,
                    height: `${annotation.height}px`,
                  }}
                >
                  {annotation.content}
                </div>
              );
            case 'highlight':
              return (
                <div
                  key={annotation.id}
                  className="absolute"
                  style={{
                    left: `${annotation.x}px`,
                    top: `${annotation.y}px`,
                    width: `${annotation.width}px`,
                    height: `${annotation.height}px`,
                    backgroundColor: annotation.color,
                    opacity: 0.3,
                    transform: `rotate(${annotation.rotation}deg)`,
                  }}
                />
              );
            case 'arrow': {
              const arrowPoints = annotation.arrowPoints;
              if (!arrowPoints) return null;

              return (
                <svg
                  key={annotation.id}
                  className="absolute top-0 left-0 w-full h-full"
                  style={{
                    pointerEvents: 'none',
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
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={annotation.color}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={arrowPoints.x1}
                    y1={arrowPoints.y1}
                    x2={arrowPoints.x2}
                    y2={arrowPoints.y2}
                    stroke={annotation.color}
                    strokeWidth="2"
                    markerEnd={`url(#arrowhead-${annotation.id})`}
                  />
                </svg>
              );
            }
            default:
              return null;
          }
        })}
      </div>

      {/* Controls */}
      <div
        className={`absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="absolute top-4 right-4 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={handleExitPreview}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center space-x-4 pointer-events-auto">
          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={handlePrevious}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="text-white bg-black/50 px-3 py-1 rounded-md">
            {currentSlideIndex + 1} / {currentSlideshow.slides.length}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={handleNext}
            disabled={currentSlideIndex >= currentSlideshow.slides.length - 1}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
