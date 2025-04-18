'use client';

import React from 'react';
import Link from 'next/link';
import { useSlideshowContext } from '@/context/slideshow-context';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, PlusCircle, Play, Save, LayoutDashboard } from 'lucide-react';
import { SlideEditor } from '@/components/slide-editor';
import { SlideList } from '@/components/slide-list';
import { ToolPanel } from '@/components/tool-panel';
import { useRouter, useSearchParams } from 'next/navigation';
import { DialogHeader, DialogFooter, DialogDescription, DialogTitle, DialogContent, Dialog } from '@/components/ui/dialog';

export default function Editor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slideshowId = searchParams.get('id');
  const {
    slideshows,
    currentSlideshow,
    setCurrentSlideshow,
    currentSlideIndex,
    setCurrentSlideIndex,
    addSlide,
    updateSlideshow,
  } = useSlideshowContext();

  const [slideshowTitle, setSlideshowTitle] = React.useState('');
  const [isRenameDialogOpen, setIsRenameDialogOpen] = React.useState(false);

  React.useEffect(() => {
    // Log effect for debugging slideshow selection
    console.log('[Editor] Query param slideshowId:', slideshowId);
    console.log('[Editor] slideshows:', slideshows);
    console.log('[Editor] currentSlideshow:', currentSlideshow);

    // When page loads or slideshows list changes, set the current slideshow from query param!
    if (!currentSlideshow && !!slideshowId && slideshows.length > 0) {
      const found = slideshows.find((s) => s.id === slideshowId);
      if (found) setCurrentSlideshow(found);
    }
    // Just copy the title
    else if (currentSlideshow) {
      setSlideshowTitle(currentSlideshow.title);
    }
    // If no slideshow is selected, navigate back to home page
    else if (!currentSlideshow) {
      router.push('/');
    }
  }, [currentSlideshow, slideshowId, slideshows, setCurrentSlideshow, router]);

  const handleUpdateTitle = () => {
    if (!currentSlideshow || !slideshowTitle.trim()) return;
    updateSlideshow({
      ...currentSlideshow,
      title: slideshowTitle.trim(),
    });
    setIsRenameDialogOpen(false);
  };

  const handleAddSlide = () => {
    addSlide();
  };

  const handlePreview = () => {
    router.push('/preview');
  };

  if (!currentSlideshow) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-xl font-semibold" onClick={() => setIsRenameDialogOpen(true)}>
              {currentSlideshow.title}
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePreview}>
              <Play className="h-4 w-4 mr-1" />
              Preview
            </Button>
            <Button size="sm">
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar - Slide thumbnails */}
        <div className="w-64 border-r overflow-y-auto p-2 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-medium">Slides</h2>
            <Button variant="ghost" size="sm" onClick={handleAddSlide}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          <Separator className="mb-2" />
          <SlideList />
        </div>

        {/* Main editor area */}
        <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
          <SlideEditor />
        </div>

        {/* Right sidebar - Tools */}
        <div className="w-72 border-l overflow-y-auto p-4">
          <h2 className="font-medium mb-2">Tools</h2>
          <Separator className="mb-4" />
          <ToolPanel />
        </div>
      </div>

      {/* Rename dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Slideshow</DialogTitle>
            <DialogDescription>
              Enter a new title for your slideshow.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="slideshow-title">Title</Label>
            <Input
              id="slideshow-title"
              value={slideshowTitle}
              onChange={(e) => setSlideshowTitle(e.target.value)}
              placeholder="My Slideshow"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTitle}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
