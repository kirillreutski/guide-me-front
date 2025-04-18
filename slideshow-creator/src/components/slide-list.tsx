'use client';

import React from 'react';
import { useSlideshowContext } from '@/context/slideshow-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoreHorizontal, Trash2, Copy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { v4 as uuidv4 } from 'uuid';

export function SlideList() {
  const {
    currentSlideshow,
    currentSlideIndex,
    setCurrentSlideIndex,
    addSlide,
    deleteSlide,
    updateSlide,
    updateSlideshow,
  } = useSlideshowContext();

  if (!currentSlideshow) {
    return <div className="text-gray-500 text-center p-4">No slideshow selected</div>;
  }

  const handleDuplicateSlide = (slideId: string) => {
    const slideIndex = currentSlideshow.slides.findIndex(slide => slide.id === slideId);
    if (slideIndex === -1) return;

    const slideToDuplicate = currentSlideshow.slides[slideIndex];
    // Clone the slide with a new ID
    const newSlide = {
      ...JSON.parse(JSON.stringify(slideToDuplicate)),
      id: uuidv4(),
    };

    // Add the slide to the slideshow
    const updatedSlides = [...currentSlideshow.slides];
    updatedSlides.splice(slideIndex + 1, 0, newSlide);

    // Update the slideshow
    const updatedSlideshow = {
      ...currentSlideshow,
      slides: updatedSlides,
    };

    updateSlideshow(updatedSlideshow);
    setCurrentSlideIndex(slideIndex + 1);
  };

  return (
    <div className="space-y-2 flex-1 overflow-y-auto">
      {currentSlideshow.slides.map((slide, index) => (
        <Card
          key={slide.id}
          className={`p-2 flex items-center justify-between cursor-pointer group ${index === currentSlideIndex ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'}`}
          onClick={() => setCurrentSlideIndex(index)}
        >
          <div className="flex items-center">
            <div className="text-sm font-medium mr-2">{index + 1}</div>
            <div
              className="w-16 h-12 bg-gray-100 flex-shrink-0"
              style={{
                backgroundColor: slide.backgroundColor,
                backgroundImage: slide.backgroundImage ? `url(${slide.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </div>

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex items-center cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateSlide(slide.id);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center text-red-600 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentSlideshow.slides.length > 1) {
                      deleteSlide(slide.id);
                    }
                  }}
                  disabled={currentSlideshow.slides.length <= 1}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      ))}
    </div>
  );
}
