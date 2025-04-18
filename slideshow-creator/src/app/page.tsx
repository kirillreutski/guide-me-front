'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSlideshowContext } from '@/context/slideshow-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { slideshows, createSlideshow, deleteSlideshow, setCurrentSlideshow } = useSlideshowContext();
  const [newSlideshowTitle, setNewSlideshowTitle] = React.useState('');
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  // Log state whenever the home component renders
  React.useEffect(() => {
    console.log('[Home] slideshows:', slideshows);
  }, [slideshows]);

  const handleCreateSlideshow = () => {
    if (!newSlideshowTitle.trim()) return;
    const created = createSlideshow(newSlideshowTitle);
    setNewSlideshowTitle('');
    setIsDialogOpen(false);
    if (created) {
      setCurrentSlideshow(created);
      console.log('[Home] Setting currentSlideshow to returned', created);
      router.push(`/editor?id=${created.id}`);
    }
  };

  const handleEditSlideshow = (slideshow) => {
    setCurrentSlideshow(slideshow);
    console.log('[Home] handleEditSlideshow: setting currentSlideshow to', slideshow);
    router.push(`/editor?id=${slideshow.id}`);
  };

  return (
    <main className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Slideshow Creator</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Slideshow
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Slideshow</DialogTitle>
              <DialogDescription>
                Enter a title for your new slideshow.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="slideshow-title">Title</Label>
              <Input
                id="slideshow-title"
                value={newSlideshowTitle}
                onChange={(e) => setNewSlideshowTitle(e.target.value)}
                placeholder="My Slideshow"
              />
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSlideshow}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {slideshows.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium text-gray-600 mb-4">No slideshows yet</h2>
          <p className="text-gray-500 mb-6">Create your first slideshow to get started</p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Slideshow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {slideshows.map((slideshow) => (
            <Card key={slideshow.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>{slideshow.title}</CardTitle>
                <CardDescription>
                  {slideshow.slides.length} slide{slideshow.slides.length !== 1 && 's'} •
                  Created {slideshow.createdAt.toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-40 bg-gray-100 flex items-center justify-center border-y">
                {slideshow.slides[0]?.backgroundImage ? (
                  <div
                    className="w-full h-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${slideshow.slides[0].backgroundImage})` }}
                  />
                ) : (
                  <div className="text-center text-gray-400">Slide preview</div>
                )}
              </CardContent>
              <CardFooter className="pt-4 flex justify-between">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteSlideshow(slideshow.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button size="sm" onClick={() => handleEditSlideshow(slideshow)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
