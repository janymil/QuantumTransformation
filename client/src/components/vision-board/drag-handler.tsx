import { useState, useRef } from "react";
import { VisionBoardItem } from "./vision-board-types";

interface DragHandlerProps {
  items: VisionBoardItem[];
  selectedItem: string | null;
  onUpdateElement: (elementId: string, updates: Partial<VisionBoardItem>) => void;
  onSelectElement: (elementId: string | null) => void;
  zoomLevel: number;
}

interface DragState {
  isDragging: boolean;
  dragStart: { x: number; y: number };
  draggedElement: string | null;
}

export function useDragHandler({
  items,
  selectedItem,
  onUpdateElement,
  onSelectElement,
  zoomLevel
}: DragHandlerProps) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    draggedElement: null
  });

  const handleElementMouseDown = (elementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    onSelectElement(elementId);
    
    setDragState({
      isDragging: true,
      dragStart: { x: event.clientX, y: event.clientY },
      draggedElement: elementId
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (dragState.isDragging && dragState.draggedElement) {
      const deltaX = event.clientX - dragState.dragStart.x;
      const deltaY = event.clientY - dragState.dragStart.y;
      
      const element = items.find(item => item.id === dragState.draggedElement);
      if (element) {
        const scaleFactor = zoomLevel / 100;
        onUpdateElement(dragState.draggedElement, {
          x: Math.max(0, element.x + deltaX / scaleFactor),
          y: Math.max(0, element.y + deltaY / scaleFactor)
        });
        
        setDragState(prev => ({
          ...prev,
          dragStart: { x: event.clientX, y: event.clientY }
        }));
      }
    }
  };

  const handleMouseUp = () => {
    setDragState({
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      draggedElement: null
    });
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    // Handle file drops for images
    const files = Array.from(event.dataTransfer.files);
    return files.filter(file => file.type.startsWith('image/'));
  };

  return {
    dragState,
    handleElementMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleDragOver,
    handleDrop
  };
}

export default function DragHandler() {
  // This component doesn't render anything, it's just a hook provider
  return null;
}