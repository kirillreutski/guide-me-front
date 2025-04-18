'use client';

import React from 'react';
import { useSlideshowContext } from '@/context/slideshow-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { AnnotationType } from '@/types';
import { Type, Square, ArrowRightCircle, ImageIcon, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ToolPanel() {
  const { toast } = useToast();
  const {
    currentSlideshow,
    currentSlideIndex,
    addAnnotation,
    updateSlideBackground,
    deleteAnnotation,
  } = useSlideshowContext();

  const [selectedTool, setSelectedTool] = React.useState<AnnotationType | null>(null);
  const [bgColor, setBgColor] = React.useState('#ffffff');
  const [backgroundImageUrl, setBackgroundImageUrl] = React.useState('');

  React.useEffect(() => {
    if (currentSlideshow && currentSlideIndex >= 0 && currentSlideIndex < currentSlideshow.slides.length) {
      const currentSlide = currentSlideshow.slides[currentSlideIndex];
      setBgColor(currentSlide.backgroundColor);
      setBackgroundImageUrl(currentSlide.backgroundImage || '');
    }
  }, [currentSlideshow, currentSlideIndex]);

  // Listen for annotation added events from SlideEditor
  React.useEffect(() => {
    const handleAnnotationAdded = () => {
      setSelectedTool(null);
    };

    window.addEventListener('annotation-added', handleAnnotationAdded as EventListener);
    return () => window.removeEventListener('annotation-added', handleAnnotationAdded as EventListener);
  }, []);

  const handleToolSelect = (tool: AnnotationType) => {
    setSelectedTool(tool);

    // Notify SlideEditor about tool change (would be replaced with a proper event system or context)
    window.dispatchEvent(new CustomEvent('tool-change', {
      detail: { tool }
    }));

    toast({
      title: `${tool} tool selected`,
      description: `Click on the slide to add a ${tool} annotation.`
    });
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setBgColor(newColor);

    if (currentSlideshow && currentSlideIndex >= 0) {
      const currentSlide = currentSlideshow.slides[currentSlideIndex];
      updateSlideBackground(currentSlide.id, currentSlide.backgroundImage, newColor);
    }
  };

  const handleBackgroundImageChange = () => {
    if (!backgroundImageUrl.trim() || currentSlideIndex < 0) return;

    if (currentSlideshow && currentSlideIndex >= 0) {
      const currentSlide = currentSlideshow.slides[currentSlideIndex];
      updateSlideBackground(currentSlide.id, backgroundImageUrl, currentSlide.backgroundColor);

      toast({
        title: "Background updated",
        description: "The slide background has been updated."
      });
    }
  };

  const handleRemoveBackgroundImage = () => {
    if (currentSlideshow && currentSlideIndex >= 0) {
      const currentSlide = currentSlideshow.slides[currentSlideIndex];
      updateSlideBackground(currentSlide.id, null, currentSlide.backgroundColor);
      setBackgroundImageUrl('');

      toast({
        title: "Background image removed",
        description: "The background image has been removed from the slide."
      });
    }
  };

  if (!currentSlideshow || currentSlideIndex < 0) {
    return <div className="text-gray-500">Select a slide to edit</div>;
  }

  return (
    <div className="space-y-6">
      {/* Annotation tools */}
      <div>
        <h3 className="text-sm font-medium mb-2">Add Annotation</h3>
        <div className="flex space-x-2">
          <Button
            variant={selectedTool === 'text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('text')}
          >
            <Type className="h-4 w-4 mr-1" />
            Text
          </Button>
          <Button
            variant={selectedTool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('arrow')}
          >
            <ArrowRightCircle className="h-4 w-4 mr-1" />
            Arrow
          </Button>
          <Button
            variant={selectedTool === 'highlight' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolSelect('highlight')}
          >
            <Square className="h-4 w-4 mr-1" />
            Highlight
          </Button>
        </div>

        {selectedTool && (
          <div className="mt-2 text-sm text-blue-600">
            Click on the slide to add a {selectedTool} annotation
          </div>
        )}
      </div>

      <Separator />

      {/* Background settings */}
      <div>
        <h3 className="text-sm font-medium mb-2">Background</h3>

        <div className="space-y-4">
          <div>
            <Label htmlFor="bg-color" className="text-xs text-gray-600">Background Color</Label>
            <div className="flex mt-1">
              <div
                className="w-8 h-8 border rounded-l-md flex-shrink-0"
                style={{ backgroundColor: bgColor }}
              />
              <Input
                id="bg-color"
                type="color"
                value={bgColor}
                onChange={handleBackgroundColorChange}
                className="w-full rounded-l-none"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bg-image" className="text-xs text-gray-600">Background Image URL</Label>
            <div className="flex mt-1">
              <Input
                id="bg-image"
                type="text"
                placeholder="https://example.com/image.jpg"
                value={backgroundImageUrl}
                onChange={(e) => setBackgroundImageUrl(e.target.value)}
                className="rounded-r-none"
              />
              <Button
                variant="outline"
                className="rounded-l-none"
                onClick={handleBackgroundImageChange}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {currentSlideshow.slides[currentSlideIndex].backgroundImage && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-500 hover:text-red-600 w-full"
              onClick={handleRemoveBackgroundImage}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Remove Image
            </Button>
          )}
        </div>
      </div>

      <Separator />

      {/* Selected annotation properties - would appear when an annotation is selected */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground">
          Select an annotation to edit its properties
        </h3>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="bg-gray-50 p-3 rounded-md text-sm">
        <h3 className="font-medium mb-2">Keyboard Shortcuts</h3>
        <ul className="space-y-1 text-gray-600">
          <li>
            <span className="bg-gray-200 px-1 rounded">Delete</span> - Remove selected annotation
          </li>
          <li>
            <span className="bg-gray-200 px-1 rounded">Click + Drag</span> - Move annotation
          </li>
          <li>
            <span className="bg-gray-200 px-1 rounded">Handles</span> - Resize annotation
          </li>
        </ul>
      </div>
    </div>
  );
}
