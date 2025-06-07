export interface VisionBoardItem {
  id: string;
  type: 'image' | 'text' | 'shape' | 'sticker';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  zIndex?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAlign?: string;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
  shadow?: boolean;
  locked?: boolean;
  visible?: boolean;
  effects?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    blur?: number;
  };
}

export interface VisionBoard {
  id?: number;
  title: string;
  description: string;
  canvasData: {
    items: VisionBoardItem[];
    canvasWidth: number;
    canvasHeight: number;
    backgroundColor: string;
    backgroundImage?: string;
    gridVisible?: boolean;
    snapToGrid?: boolean;
  };
  templateCategory: string;
  tags: string[];
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type Tool = 'select' | 'text' | 'image' | 'shape' | 'hand';
export type ViewMode = 'normal' | 'preview' | 'presentation';

export interface VisionBoardTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  elements: Array<{
    type: string;
    content: string;
    position: { x: number; y: number };
    style: Record<string, any>;
  }>;
}

export interface AIGenerationResult {
  title: string;
  theme: string;
  backgroundColor: string;
  elements: VisionBoardItem[];
  personalizedInsights: string[];
  goalCategories: string[];
  manifestationTips: string[];
}

export interface AIImageGenerationResult {
  imageUrl: string;
  prompt: string;
  size: string;
  quality: string;
  model: string;
  cost: number;
  remainingRequests: number;
  savedToGallery: boolean;
  galleryId?: number;
}

export interface AISuggestion {
  id: string;
  title: string;
  description: string;
  type: 'element' | 'layout' | 'color' | 'text' | 'image';
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  reasoning: string;
}