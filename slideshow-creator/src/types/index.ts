// Types for the slideshow application

export type AnnotationType = 'text' | 'arrow' | 'highlight';

export interface Annotation {
  id: string;
  type: AnnotationType;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  fontSize?: number; // Only for text annotations
  arrowPoints?: { x1: number; y1: number; x2: number; y2: number }; // Only for arrow annotations
}

export interface Slide {
  id: string;
  backgroundImage: string | null;
  backgroundColor: string;
  annotations: Annotation[];
}

export interface Slideshow {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: Date;
  updatedAt: Date;
}
