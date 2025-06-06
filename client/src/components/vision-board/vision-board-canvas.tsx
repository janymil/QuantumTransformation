import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, RotateCw, Move } from "lucide-react";

interface VisionBoardItem {
  id: string;
  type: 'image' | 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  rotation?: number;
}

interface VisionBoardCanvasProps {
  items: VisionBoardItem[];
  onUpdateItem: (id: string, updates: Partial<VisionBoardItem>) => void;
  onDeleteItem: (id: string) => void;
  selectedItem: string | null;
  onSelectItem: (id: string | null) => void;
}

export default function VisionBoardCanvas({
  items,
  onUpdateItem,
  onDeleteItem,
  selectedItem,
  onSelectItem
}: VisionBoardCanvasProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizingItem, setResizingItem] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    setDraggedItem(itemId);
    onSelectItem(itemId);
    
    // Calculate offset from mouse to item's top-left corner
    setDragOffset({
      x: e.clientX - rect.left - item.x,
      y: e.clientY - rect.top - item.y
    });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggedItem || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - 100, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(rect.height - 50, e.clientY - rect.top - dragOffset.y));
    
    onUpdateItem(draggedItem, { x: newX, y: newY });
  }, [draggedItem, dragOffset, onUpdateItem]);

  const handleMouseUp = () => {
    setDraggedItem(null);
    setResizingItem(null);
  };

  const handleResizeStart = (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingItem(itemId);
  };

  const handleResizeMove = useCallback((e: React.MouseEvent) => {
    if (!resizingItem || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const item = items.find(i => i.id === resizingItem);
    if (!item) return;
    
    const newWidth = Math.max(50, e.clientX - rect.left - item.x);
    const newHeight = Math.max(30, e.clientY - rect.top - item.y);
    
    onUpdateItem(resizingItem, { width: newWidth, height: newHeight });
  }, [resizingItem, items, onUpdateItem]);

  const rotateItem = (itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    const currentRotation = item.rotation || 0;
    onUpdateItem(itemId, { rotation: (currentRotation + 15) % 360 });
  };

  const selectedItemData = items.find(item => item.id === selectedItem);

  return (
    <div className="relative w-full h-full">
      <div
        ref={canvasRef}
        className="relative bg-white border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden"
        style={{ width: '600px', height: '450px' }}
        onMouseMove={resizingItem ? handleResizeMove : handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => onSelectItem(null)}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className={`absolute cursor-move border-2 transition-all ${
              selectedItem === item.id
                ? 'border-blue-500 shadow-lg'
                : 'border-transparent hover:border-blue-300'
            }`}
            style={{
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
              transform: `rotate(${item.rotation || 0}deg)`,
              zIndex: selectedItem === item.id ? 10 : 1
            }}
            onMouseDown={(e) => handleMouseDown(e, item.id)}
          >
            {item.type === 'text' ? (
              <div
                className="w-full h-full flex items-center justify-center text-center break-words p-2"
                style={{
                  fontSize: item.fontSize || 16,
                  color: item.color || '#000000',
                  lineHeight: '1.2'
                }}
              >
                {item.content}
              </div>
            ) : (
              <img
                src={item.content}
                alt="Vision board item"
                className="w-full h-full object-cover rounded"
                draggable={false}
              />
            )}
            
            {/* Selection controls */}
            {selectedItem === item.id && (
              <>
                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                  onMouseDown={(e) => handleResizeStart(e, item.id)}
                />
                
                {/* Action buttons */}
                <div className="absolute -top-8 left-0 flex gap-1">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      rotateItem(item.id);
                    }}
                  >
                    <RotateCw className="w-3 h-3" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Move className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-lg font-medium">Start creating your vision board</p>
              <p className="text-sm">Add text and images to bring your dreams to life</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}