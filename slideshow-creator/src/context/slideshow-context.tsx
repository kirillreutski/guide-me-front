import React, { createContext, useContext, useState } from 'react';
import type { Annotation, Slide, Slideshow, AnnotationType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

type SlideshowContextType = {
  slideshows: Slideshow[];
  currentSlideshow: Slideshow | null;
  currentSlideIndex: number;
  setCurrentSlideshow: (slideshow: Slideshow | null) => void;
  setCurrentSlideIndex: (index: number) => void;
  createSlideshow: (title: string) => Slideshow; // Updated return type
  updateSlideshow: (slideshow: Slideshow) => void;
  deleteSlideshow: (id: string) => void;
  addSlide: () => void;
  deleteSlide: (slideId: string) => void;
  updateSlide: (slide: Slide) => void;
  addAnnotation: (type: AnnotationType, x: number, y: number, additionalDetails?: any) => void;
  updateAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (annotationId: string) => void;
  updateSlideBackground: (slideId: string, imageUrl: string | null, color: string) => void;
};

const SlideshowContext = createContext<SlideshowContextType | undefined>(undefined);

export const useSlideshowContext = () => {
  const context = useContext(SlideshowContext);
  if (!context) {
    throw new Error('useSlideshowContext must be used within a SlideshowProvider');
  }
  return context;
};

export const SlideshowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slideshows, setSlideshows] = useState<Slideshow[]>([]);
  const [currentSlideshow, setCurrentSlideshow] = useState<Slideshow | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Debug: log on change for root slideshow state
  React.useEffect(() => {
    console.log('[Provider] slideshows changed:', slideshows);
  }, [slideshows]);
  React.useEffect(() => {
    console.log('[Provider] currentSlideshow changed:', currentSlideshow);
  }, [currentSlideshow]);
  React.useEffect(() => {
    console.log('[Provider] currentSlideIndex changed:', currentSlideIndex);
  }, [currentSlideIndex]);

  const createSlideshow = (title: string) => {
    const newSlideshow: Slideshow = {
      id: uuidv4(),
      title,
      slides: [
        {
          id: uuidv4(),
          backgroundImage: null,
          backgroundColor: '#ffffff',
          annotations: [],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSlideshows(prev => [...prev, newSlideshow]);
    setCurrentSlideshow(newSlideshow);
    setCurrentSlideIndex(0);
    return newSlideshow; // Added return statement
  };

  const updateSlideshow = (slideshow: Slideshow) => {
    const updatedSlideshow = {
      ...slideshow,
      updatedAt: new Date(),
    };

    setSlideshows(slideshows.map(s => s.id === slideshow.id ? updatedSlideshow : s));

    if (currentSlideshow?.id === slideshow.id) {
      setCurrentSlideshow(updatedSlideshow);
    }
  };

  const deleteSlideshow = (id: string) => {
    setSlideshows(slideshows.filter(s => s.id !== id));

    if (currentSlideshow?.id === id) {
      setCurrentSlideshow(null);
      setCurrentSlideIndex(0);
    }
  };

  const addSlide = () => {
    if (!currentSlideshow) return;

    const newSlide: Slide = {
      id: uuidv4(),
      backgroundImage: null,
      backgroundColor: '#ffffff',
      annotations: [],
    };

    const updatedSlideshow = {
      ...currentSlideshow,
      slides: [...currentSlideshow.slides, newSlide],
      updatedAt: new Date(),
    };

    updateSlideshow(updatedSlideshow);
    setCurrentSlideIndex(updatedSlideshow.slides.length - 1);
  };

  const deleteSlide = (slideId: string) => {
    if (!currentSlideshow) return;
    if (currentSlideshow.slides.length <= 1) return; // Prevent deleting the last slide

    const updatedSlides = currentSlideshow.slides.filter(slide => slide.id !== slideId);
    const updatedSlideshow = {
      ...currentSlideshow,
      slides: updatedSlides,
      updatedAt: new Date(),
    };

    updateSlideshow(updatedSlideshow);
    if (currentSlideIndex >= updatedSlides.length) {
      setCurrentSlideIndex(updatedSlides.length - 1);
    }
  };

  const updateSlide = (slide: Slide) => {
    if (!currentSlideshow) return;

    const updatedSlides = currentSlideshow.slides.map(s =>
      s.id === slide.id ? slide : s
    );

    const updatedSlideshow = {
      ...currentSlideshow,
      slides: updatedSlides,
      updatedAt: new Date(),
    };

    updateSlideshow(updatedSlideshow);
  };

  const addAnnotation = (type: AnnotationType, x: number, y: number, additionalDetails?: any) => {
    if (!currentSlideshow) return;

    const currentSlide = currentSlideshow.slides[currentSlideIndex];
    if (!currentSlide) return;

    const annotationWidth = additionalDetails?.width || 200;
    const annotationHeight = additionalDetails?.height || 100;

    const newAnnotation: Annotation = {
      id: uuidv4(),
      type,
      content: type === 'text' ? 'Text annotation' : '',
      x,
      y,
      width: annotationWidth,
      height: annotationHeight,
      rotation: 0,
      color: '#000000',
      ...(type === 'text' && { fontSize: 16 }),
      ...(type === 'arrow' && {
        arrowPoints: {
          x1: additionalDetails.arrowPoints.x1,
          y1: additionalDetails.arrowPoints.y1,
          x2: additionalDetails.arrowPoints.x2,
          y2: additionalDetails.arrowPoints.y2
        }
      }),
    };

    const updatedSlide = {
      ...currentSlide,
      annotations: [...currentSlide.annotations, newAnnotation],
    };

    updateSlide(updatedSlide);
  };

  const updateAnnotation = (annotation: Annotation) => {
    if (!currentSlideshow) return;

    const currentSlide = currentSlideshow.slides[currentSlideIndex];
    if (!currentSlide) return;

    const updatedAnnotations = currentSlide.annotations.map(a =>
      a.id === annotation.id ? annotation : a
    );

    const updatedSlide = {
      ...currentSlide,
      annotations: updatedAnnotations,
    };

    updateSlide(updatedSlide);
  };

  const deleteAnnotation = (annotationId: string) => {
    if (!currentSlideshow) return;

    const currentSlide = currentSlideshow.slides[currentSlideIndex];
    if (!currentSlide) return;

    const updatedAnnotations = currentSlide.annotations.filter(a => a.id !== annotationId);

    const updatedSlide = {
      ...currentSlide,
      annotations: updatedAnnotations,
    };

    updateSlide(updatedSlide);
  };

  const updateSlideBackground = (slideId: string, imageUrl: string | null, color: string) => {
    if (!currentSlideshow) return;

    const slideToUpdate = currentSlideshow.slides.find(s => s.id === slideId);
    if (!slideToUpdate) return;

    const updatedSlide = {
      ...slideToUpdate,
      backgroundImage: imageUrl,
      backgroundColor: color,
    };

    updateSlide(updatedSlide);
  };

  return (
    <SlideshowContext.Provider
      value={{
        slideshows,
        currentSlideshow,
        currentSlideIndex,
        setCurrentSlideshow,
        setCurrentSlideIndex,
        createSlideshow,
        updateSlideshow,
        deleteSlideshow,
        addSlide,
        deleteSlide,
        updateSlide,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        updateSlideBackground,
      }}
    >
      {children}
    </SlideshowContext.Provider>
  );
};
