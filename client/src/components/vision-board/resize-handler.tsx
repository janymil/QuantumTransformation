import { useState } from "react";
import { VisionBoardItem } from "./vision-board-types";

interface ResizeHandlerProps {
  selectedItem: string | null;
  items: VisionBoardItem[];
  onUpdateElement: (elementId: string, updates: Partial<VisionBoardItem>) => void;
  zoomLevel: number;
}

interface ResizeState {
  isResizing: boolean;
  resizeHandle: string | null;
  resizeStart: { x: number; y: number; width: number; height: number };
}

export function useResizeHandler({
  selectedItem,
  items,
  onUpdateElement,
  zoomLevel
}: ResizeHandlerProps) {
  const [resizeState, setResizeState] = useState<ResizeState>({
    isResizing: false,
    resizeHandle: null,
    resizeStart: { x: 0, y: 0, width: 0, height: 0 }
  });

  const handleResizeStart = (handle: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!selectedItem) return;
    
    const element = items.find(item => item.id === selectedItem);
    if (!element) return;

    setResizeState({
      isResizing: true,
      resizeHandle: handle,
      resizeStart: {
        x: event.clientX,
        y: event.clientY,
        width: element.width,
        height: element.height
      }
    });
  };

  const handleResizeMove = (event: React.MouseEvent) => {
    if (!resizeState.isResizing || !selectedItem || !resizeState.resizeHandle) return;

    const element = items.find(item => item.id === selectedItem);
    if (!element) return;

    const deltaX = event.clientX - resizeState.resizeStart.x;
    const deltaY = event.clientY - resizeState.resizeStart.y;
    const scaleFactor = zoomLevel / 100;

    let newWidth = resizeState.resizeStart.width;
    let newHeight = resizeState.resizeStart.height;
    let newX = element.x;
    let newY = element.y;

    switch (resizeState.resizeHandle) {
      case 'nw': // Northwest
        newWidth = Math.max(20, resizeState.resizeStart.width - deltaX / scaleFactor);
        newHeight = Math.max(20, resizeState.resizeStart.height - deltaY / scaleFactor);
        newX = element.x + (resizeState.resizeStart.width - newWidth);
        newY = element.y + (resizeState.resizeStart.height - newHeight);
        break;
      case 'ne': // Northeast
        newWidth = Math.max(20, resizeState.resizeStart.width + deltaX / scaleFactor);
        newHeight = Math.max(20, resizeState.resizeStart.height - deltaY / scaleFactor);
        newY = element.y + (resizeState.resizeStart.height - newHeight);
        break;
      case 'sw': // Southwest
        newWidth = Math.max(20, resizeState.resizeStart.width - deltaX / scaleFactor);
        newHeight = Math.max(20, resizeState.resizeStart.height + deltaY / scaleFactor);
        newX = element.x + (resizeState.resizeStart.width - newWidth);
        break;
      case 'se': // Southeast
        newWidth = Math.max(20, resizeState.resizeStart.width + deltaX / scaleFactor);
        newHeight = Math.max(20, resizeState.resizeStart.height + deltaY / scaleFactor);
        break;
      case 'n': // North
        newHeight = Math.max(20, resizeState.resizeStart.height - deltaY / scaleFactor);
        newY = element.y + (resizeState.resizeStart.height - newHeight);
        break;
      case 's': // South
        newHeight = Math.max(20, resizeState.resizeStart.height + deltaY / scaleFactor);
        break;
      case 'w': // West
        newWidth = Math.max(20, resizeState.resizeStart.width - deltaX / scaleFactor);
        newX = element.x + (resizeState.resizeStart.width - newWidth);
        break;
      case 'e': // East
        newWidth = Math.max(20, resizeState.resizeStart.width + deltaX / scaleFactor);
        break;
    }

    onUpdateElement(selectedItem, {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight
    });
  };

  const handleResizeEnd = () => {
    setResizeState({
      isResizing: false,
      resizeHandle: null,
      resizeStart: { x: 0, y: 0, width: 0, height: 0 }
    });
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (!selectedItem) return;
    
    const element = items.find(item => item.id === selectedItem);
    if (!element) return;

    const currentRotation = element.rotation || 0;
    const newRotation = direction === 'left' 
      ? currentRotation - 15 
      : currentRotation + 15;

    onUpdateElement(selectedItem, {
      rotation: newRotation % 360
    });
  };

  return {
    resizeState,
    handleResizeStart,
    handleResizeMove,
    handleResizeEnd,
    handleRotate
  };
}

interface ResizeHandlesProps {
  elementId: string;
  isSelected: boolean;
  onResizeStart: (handle: string, event: React.MouseEvent) => void;
  onRotate: (direction: 'left' | 'right') => void;
}

export function ResizeHandles({ elementId, isSelected, onResizeStart, onRotate }: ResizeHandlesProps) {
  if (!isSelected) return null;

  return (
    <>
      {/* Corner handles */}
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize -top-1 -left-1"
        onMouseDown={(e) => onResizeStart('nw', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-ne-resize -top-1 -right-1"
        onMouseDown={(e) => onResizeStart('ne', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-sw-resize -bottom-1 -left-1"
        onMouseDown={(e) => onResizeStart('sw', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize -bottom-1 -right-1"
        onMouseDown={(e) => onResizeStart('se', e)}
      />
      
      {/* Edge handles */}
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-n-resize -top-1 left-1/2 transform -translate-x-1/2"
        onMouseDown={(e) => onResizeStart('n', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-s-resize -bottom-1 left-1/2 transform -translate-x-1/2"
        onMouseDown={(e) => onResizeStart('s', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-w-resize -left-1 top-1/2 transform -translate-y-1/2"
        onMouseDown={(e) => onResizeStart('w', e)}
      />
      <div
        className="absolute w-2 h-2 bg-blue-500 border border-white cursor-e-resize -right-1 top-1/2 transform -translate-y-1/2"
        onMouseDown={(e) => onResizeStart('e', e)}
      />

      {/* Rotation handles */}
      <div
        className="absolute w-4 h-4 bg-green-500 border border-white cursor-pointer rounded-full -top-6 left-1/2 transform -translate-x-1/2"
        title="Rotate left"
        onClick={() => onRotate('left')}
      />
      <div
        className="absolute w-4 h-4 bg-green-500 border border-white cursor-pointer rounded-full -bottom-6 left-1/2 transform -translate-x-1/2"
        title="Rotate right"
        onClick={() => onRotate('right')}
      />
    </>
  );
}

export default function ResizeHandler() {
  return null;
}