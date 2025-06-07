import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Type, Palette, Eye, EyeOff, Lock, Unlock, Trash2 } from "lucide-react";
import { VisionBoardItem } from "./vision-board-types";

interface ElementEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElement: VisionBoardItem | null;
  onElementUpdate: (element: VisionBoardItem) => void;
  onElementDelete: (elementId: string) => void;
}

export default function ElementEditor({
  isOpen,
  onClose,
  selectedElement,
  onElementUpdate,
  onElementDelete
}: ElementEditorProps) {
  const [editedElement, setEditedElement] = useState<VisionBoardItem | null>(selectedElement);
  const { toast } = useToast();

  const handleSave = () => {
    if (editedElement) {
      onElementUpdate(editedElement);
      onClose();
      toast({
        title: "Element Updated",
        description: "Changes have been saved"
      });
    }
  };

  const handleDelete = () => {
    if (editedElement && confirm("Are you sure you want to delete this element?")) {
      onElementDelete(editedElement.id);
      onClose();
      toast({
        title: "Element Deleted",
        description: "Element has been removed from the board"
      });
    }
  };

  const updateElement = (updates: Partial<VisionBoardItem>) => {
    if (editedElement) {
      setEditedElement({ ...editedElement, ...updates });
    }
  };

  if (!selectedElement || !editedElement) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Type className="w-5 h-5 text-blue-600" />
            Edit Element
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content</CardTitle>
              <CardDescription>
                Edit the content and basic properties
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editedElement.type === 'text' ? (
                <div>
                  <Label htmlFor="content">Text Content</Label>
                  <Textarea
                    id="content"
                    value={editedElement.content}
                    onChange={(e) => updateElement({ content: e.target.value })}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="content">Content URL/Path</Label>
                  <Input
                    id="content"
                    value={editedElement.content}
                    onChange={(e) => updateElement({ content: e.target.value })}
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={editedElement.width}
                    onChange={(e) => updateElement({ width: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={editedElement.height}
                    onChange={(e) => updateElement({ height: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="x">X Position</Label>
                  <Input
                    id="x"
                    type="number"
                    value={editedElement.x}
                    onChange={(e) => updateElement({ x: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="y">Y Position</Label>
                  <Input
                    id="y"
                    type="number"
                    value={editedElement.y}
                    onChange={(e) => updateElement({ y: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Text Styling (for text elements) */}
          {editedElement.type === 'text' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Text Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Font Size</Label>
                    <Input
                      type="number"
                      value={editedElement.fontSize || 16}
                      onChange={(e) => updateElement({ fontSize: parseInt(e.target.value) || 16 })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Font Weight</Label>
                    <Select
                      value={editedElement.fontWeight || 'normal'}
                      onValueChange={(value) => updateElement({ fontWeight: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="lighter">Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={editedElement.fontFamily || 'Arial'}
                      onValueChange={(value) => updateElement({ fontFamily: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Text Align</Label>
                    <Select
                      value={editedElement.textAlign || 'left'}
                      onValueChange={(value) => updateElement({ textAlign: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Styling Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Styling
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="color"
                      type="color"
                      value={editedElement.color || '#000000'}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={editedElement.color || '#000000'}
                      onChange={(e) => updateElement({ color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={editedElement.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElement({ backgroundColor: e.target.value })}
                      className="w-16 p-1 h-10"
                    />
                    <Input
                      value={editedElement.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElement({ backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label>Opacity: {Math.round((editedElement.opacity || 1) * 100)}%</Label>
                <Slider
                  value={[(editedElement.opacity || 1) * 100]}
                  onValueChange={(value) => updateElement({ opacity: value[0] / 100 })}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Border Radius</Label>
                <Input
                  type="number"
                  value={editedElement.borderRadius || 0}
                  onChange={(e) => updateElement({ borderRadius: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Rotation: {editedElement.rotation || 0}°</Label>
                <Slider
                  value={[editedElement.rotation || 0]}
                  onValueChange={(value) => updateElement({ rotation: value[0] })}
                  min={-180}
                  max={180}
                  step={1}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Properties Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Properties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editedElement.visible ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  )}
                  <Label>Visible</Label>
                </div>
                <Switch
                  checked={editedElement.visible ?? true}
                  onCheckedChange={(checked) => updateElement({ visible: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editedElement.locked ? (
                    <Lock className="w-4 h-4 text-red-600" />
                  ) : (
                    <Unlock className="w-4 h-4 text-green-600" />
                  )}
                  <Label>Locked</Label>
                </div>
                <Switch
                  checked={editedElement.locked ?? false}
                  onCheckedChange={(checked) => updateElement({ locked: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Add Shadow</Label>
                <Switch
                  checked={editedElement.shadow ?? false}
                  onCheckedChange={(checked) => updateElement({ shadow: checked })}
                />
              </div>

              <div>
                <Label>Z-Index (Layer)</Label>
                <Input
                  type="number"
                  value={editedElement.zIndex || 1}
                  onChange={(e) => updateElement({ zIndex: parseInt(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Save Changes
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Element
            </Button>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}