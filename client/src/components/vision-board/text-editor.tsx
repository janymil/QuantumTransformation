import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VisionBoardItem } from "./vision-board-types";

interface TextEditorProps {
  item: VisionBoardItem;
  isEditing: boolean;
  onUpdate: (updates: Partial<VisionBoardItem>) => void;
  onFinishEditing: () => void;
  onStartEditing: () => void;
}

export function useTextEditor() {
  const [editingText, setEditingText] = useState<string | null>(null);
  const [tempText, setTempText] = useState("");

  const startEditing = (elementId: string, currentContent: string) => {
    setEditingText(elementId);
    setTempText(currentContent);
  };

  const finishEditing = () => {
    setEditingText(null);
    setTempText("");
  };

  const cancelEditing = () => {
    setEditingText(null);
    setTempText("");
  };

  return {
    editingText,
    tempText,
    setTempText,
    startEditing,
    finishEditing,
    cancelEditing
  };
}

export function TextEditor({ item, isEditing, onUpdate, onFinishEditing, onStartEditing }: TextEditorProps) {
  const [tempText, setTempText] = useState(item.content);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    onUpdate({ content: tempText });
    onFinishEditing();
  };

  const handleCancel = () => {
    setTempText(item.content);
    onFinishEditing();
  };

  if (isEditing) {
    return (
      <div className="absolute inset-0 z-50">
        <Input
          ref={inputRef}
          value={tempText}
          onChange={(e) => setTempText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-full h-full border-2 border-blue-500 bg-white"
          style={{
            fontSize: item.fontSize || 16,
            fontFamily: item.fontFamily || 'Arial',
            fontWeight: item.fontWeight || 'normal',
            color: item.color || '#000000',
            textAlign: (item.textAlign as any) || 'left'
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-hidden cursor-text"
      onDoubleClick={onStartEditing}
      style={{
        fontSize: item.fontSize || 16,
        fontFamily: item.fontFamily || 'Arial',
        fontWeight: item.fontWeight || 'normal',
        color: item.color || '#000000',
        textAlign: (item.textAlign as any) || 'left'
      }}
    >
      {item.content || 'Double-click to edit'}
    </div>
  );
}

interface TextFormattingToolbarProps {
  item: VisionBoardItem;
  onUpdate: (updates: Partial<VisionBoardItem>) => void;
  isVisible: boolean;
}

// Popup Text Editor Component
interface PopupTextEditorProps {
  item: VisionBoardItem;
  onUpdate: (updates: Partial<VisionBoardItem>) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function PopupTextEditor({ item, onUpdate, onClose, isOpen }: PopupTextEditorProps) {
  const [content, setContent] = useState(item?.content || '');
  const [fontSize, setFontSize] = useState(item?.fontSize || 16);
  const [color, setColor] = useState(item?.color || '#000000');
  const [fontWeight, setFontWeight] = useState(item?.fontWeight || 'normal');
  const [textAlign, setTextAlign] = useState(item?.textAlign || 'left');
  const [fontFamily, setFontFamily] = useState(item?.fontFamily || 'Arial');

  // Update state when item changes
  useEffect(() => {
    if (item) {
      setContent(item.content || '');
      setFontSize(item.fontSize || 16);
      setColor(item.color || '#000000');
      setFontWeight(item.fontWeight || 'normal');
      setTextAlign(item.textAlign || 'left');
      setFontFamily(item.fontFamily || 'Arial');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSave = () => {
    onUpdate({
      content,
      fontSize,
      color,
      fontWeight,
      textAlign,
      fontFamily
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 min-w-96 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Text</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Text Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-20 mt-1"
              placeholder="Enter your text..."
              autoFocus
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Font Size</Label>
              <Select value={fontSize.toString()} onValueChange={(value) => setFontSize(parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[12, 14, 16, 18, 20, 24, 28, 32, 36, 48].map(size => (
                    <SelectItem key={size} value={size.toString()}>{size}px</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Font Family</Label>
              <Select value={fontFamily} onValueChange={setFontFamily}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times">Times</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Font Weight</Label>
              <Select value={fontWeight} onValueChange={setFontWeight}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Text Align</Label>
              <Select value={textAlign} onValueChange={setTextAlign}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Text Color</Label>
            <div className="flex items-center gap-3 mt-1">
              <div 
                className="w-10 h-10 rounded border-2 cursor-pointer hover:border-gray-400"
                style={{ backgroundColor: color }}
                onClick={() => document.getElementById('popup-color-picker')?.click()}
              />
              <Input
                id="popup-color-picker"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="sr-only"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TextFormattingToolbar({ item, onUpdate, isVisible }: TextFormattingToolbarProps) {
  if (!isVisible) return null;

  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];
  const fontFamilies = ['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Comic Sans MS'];
  const fontWeights = ['normal', 'bold', 'lighter', 'bolder'];
  const textAligns = ['left', 'center', 'right', 'justify'];

  return (
    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 min-w-80">
      <div className="grid grid-cols-2 gap-3">
        {/* Font Size */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Size</label>
          <select
            value={item.fontSize || 16}
            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
            className="w-full p-1 border border-gray-300 rounded text-sm"
          >
            {fontSizes.map(size => (
              <option key={size} value={size}>{size}px</option>
            ))}
          </select>
        </div>

        {/* Font Family */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Font</label>
          <select
            value={item.fontFamily || 'Arial'}
            onChange={(e) => onUpdate({ fontFamily: e.target.value })}
            className="w-full p-1 border border-gray-300 rounded text-sm"
          >
            {fontFamilies.map(font => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        {/* Font Weight */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Weight</label>
          <select
            value={item.fontWeight || 'normal'}
            onChange={(e) => onUpdate({ fontWeight: e.target.value })}
            className="w-full p-1 border border-gray-300 rounded text-sm"
          >
            {fontWeights.map(weight => (
              <option key={weight} value={weight}>{weight}</option>
            ))}
          </select>
        </div>

        {/* Text Align */}
        <div>
          <label className="text-xs font-medium text-gray-700 mb-1 block">Align</label>
          <select
            value={item.textAlign || 'left'}
            onChange={(e) => onUpdate({ textAlign: e.target.value })}
            className="w-full p-1 border border-gray-300 rounded text-sm"
          >
            {textAligns.map(align => (
              <option key={align} value={align}>{align}</option>
            ))}
          </select>
        </div>

        {/* Text Color */}
        <div className="col-span-2">
          <label className="text-xs font-medium text-gray-700 mb-1 block">Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={item.color || '#000000'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <Input
              type="text"
              value={item.color || '#000000'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="flex-1 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TextEditorComponent() {
  return null;
}