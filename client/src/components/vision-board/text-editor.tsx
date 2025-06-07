import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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