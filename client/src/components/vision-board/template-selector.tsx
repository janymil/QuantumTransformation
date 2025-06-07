import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Sparkles, Crown, Heart, Target, Plane, Dumbbell, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { VisionBoardTemplate, VisionBoard, VisionBoardItem } from "./vision-board-types";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (board: VisionBoard) => void;
}

export default function TemplateSelector({
  isOpen,
  onClose,
  onTemplateSelected
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { toast } = useToast();

  // Fetch templates from backend
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/vision-board/templates'],
    enabled: isOpen
  });

  // Fetch categories from backend
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/vision-board/categories'],
    enabled: isOpen
  });

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'wealth':
        return <Crown className="w-4 h-4" />;
      case 'health':
        return <Dumbbell className="w-4 h-4" />;
      case 'career':
        return <Target className="w-4 h-4" />;
      case 'relationships':
        return <Heart className="w-4 h-4" />;
      case 'lifestyle':
        return <Plane className="w-4 h-4" />;
      case 'personal':
        return <User className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const filteredTemplates = templates.filter((template: VisionBoardTemplate) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const convertTemplateToBoard = (template: VisionBoardTemplate): VisionBoard => {
    const items: VisionBoardItem[] = template.elements.map((element, index) => ({
      id: `template-${index}-${Date.now()}`,
      type: element.type as 'image' | 'text' | 'shape' | 'sticker',
      content: element.content,
      x: element.position.x,
      y: element.position.y,
      width: element.style.width || 200,
      height: element.style.height || 50,
      fontSize: element.style.fontSize || 16,
      fontWeight: element.style.fontWeight || 'normal',
      color: element.style.color || '#000000',
      backgroundColor: element.style.backgroundColor || 'transparent',
      borderRadius: element.style.borderRadius || 0,
      opacity: 1,
      zIndex: index + 1,
      visible: true,
      locked: false
    }));

    return {
      title: template.name,
      description: template.description,
      canvasData: {
        items,
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: '#ffffff',
        gridVisible: false,
        snapToGrid: false
      },
      templateCategory: template.category,
      tags: [template.category, 'template'],
      isPublic: false
    };
  };

  const handleTemplateSelect = (template: VisionBoardTemplate) => {
    const board = convertTemplateToBoard(template);
    onTemplateSelected(board);
    onClose();
    
    toast({
      title: "Template Applied",
      description: `${template.name} template loaded successfully`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Choose a Vision Board Template
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {categories.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2"
              >
                {getCategoryIcon(category.id)}
                {category.name}
              </Button>
            ))}
          </div>

          {/* Loading state */}
          {(templatesLoading || categoriesLoading) && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            </div>
          )}

          {/* Templates grid */}
          {!templatesLoading && !categoriesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: VisionBoardTemplate) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getCategoryIcon(template.category)}
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    {/* Template preview */}
                    <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg mb-4 overflow-hidden relative">
                      {template.thumbnail ? (
                        <img
                          src={template.thumbnail}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <div className="text-center">
                            {getCategoryIcon(template.category)}
                            <p className="text-xs mt-1">{template.name}</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          onClick={() => handleTemplateSelect(template)}
                          className="bg-white text-black hover:bg-gray-100"
                        >
                          Use This Template
                        </Button>
                      </div>
                    </div>

                    {/* Template info */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {categories.find((c: any) => c.id === template.category)?.name || template.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.elements.length} elements
                        </span>
                      </div>
                      
                      <Button
                        onClick={() => handleTemplateSelect(template)}
                        className="w-full"
                        size="sm"
                      >
                        <Sparkles className="w-3 h-3 mr-2" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!templatesLoading && !categoriesLoading && filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No Templates Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or category filters
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}