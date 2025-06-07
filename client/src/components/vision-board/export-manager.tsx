import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Image, FileText, Printer, Share2 } from "lucide-react";
import { VisionBoard } from "./vision-board-types";

interface ExportManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBoard: VisionBoard;
  canvasRef: React.RefObject<HTMLDivElement>;
}

interface ExportSettings {
  format: 'png' | 'jpg' | 'pdf' | 'svg';
  quality: number;
  resolution: 'low' | 'medium' | 'high' | 'ultra';
  includeMetadata: boolean;
  transparentBackground: boolean;
}

export default function ExportManager({
  isOpen,
  onClose,
  currentBoard,
  canvasRef
}: ExportManagerProps) {
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'png',
    quality: 0.9,
    resolution: 'high',
    includeMetadata: false,
    transparentBackground: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getResolutionMultiplier = (resolution: string) => {
    switch (resolution) {
      case 'low': return 1;
      case 'medium': return 1.5;
      case 'high': return 2;
      case 'ultra': return 3;
      default: return 2;
    }
  };

  const exportAsImage = async () => {
    if (!canvasRef.current) {
      toast({
        title: "Export Failed",
        description: "Canvas not available for export",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsExporting(true);

      // Import html2canvas dynamically
      const html2canvas = (await import('html2canvas')).default;

      const multiplier = getResolutionMultiplier(settings.resolution);
      const canvas = await html2canvas(canvasRef.current, {
        scale: multiplier,
        backgroundColor: settings.transparentBackground ? null : currentBoard.canvasData.backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Convert to desired format
      const mimeType = settings.format === 'jpg' ? 'image/jpeg' : 'image/png';
      const dataURL = canvas.toDataURL(mimeType, settings.quality);

      // Create download link
      const link = document.createElement('a');
      link.download = `${currentBoard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${settings.format}`;
      link.href = dataURL;
      link.click();

      toast({
        title: "Export Successful",
        description: `Vision board exported as ${settings.format.toUpperCase()}`
      });

    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export vision board as image",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    try {
      setIsExporting(true);

      // Import jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      
      if (!canvasRef.current) throw new Error("Canvas not available");

      // Import html2canvas for PDF generation
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: currentBoard.canvasData.backgroundColor,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('landscape', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = (pdfHeight - imgHeight * ratio) / 2;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      if (settings.includeMetadata) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text(currentBoard.title, 20, 30);
        
        if (currentBoard.description) {
          pdf.setFontSize(12);
          pdf.text('Description:', 20, 50);
          const splitDescription = pdf.splitTextToSize(currentBoard.description, 170);
          pdf.text(splitDescription, 20, 60);
        }

        if (currentBoard.tags && currentBoard.tags.length > 0) {
          pdf.text('Tags: ' + currentBoard.tags.join(', '), 20, 100);
        }
      }

      pdf.save(`${currentBoard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);

      toast({
        title: "PDF Export Successful",
        description: "Vision board exported as PDF"
      });

    } catch (error) {
      toast({
        title: "PDF Export Failed",
        description: "Failed to export vision board as PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsSVG = async () => {
    try {
      setIsExporting(true);

      // Create SVG representation
      const svgWidth = currentBoard.canvasData.canvasWidth;
      const svgHeight = currentBoard.canvasData.canvasHeight;
      
      let svgContent = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">`;
      
      // Background
      if (!settings.transparentBackground) {
        svgContent += `<rect width="100%" height="100%" fill="${currentBoard.canvasData.backgroundColor}"/>`;
      }

      // Add elements
      currentBoard.canvasData.items.forEach(item => {
        if (item.type === 'text') {
          svgContent += `<text x="${item.x}" y="${item.y + (item.fontSize || 16)}" 
            font-size="${item.fontSize || 16}" 
            font-family="${item.fontFamily || 'Arial'}"
            font-weight="${item.fontWeight || 'normal'}"
            fill="${item.color || '#000000'}"
            opacity="${item.opacity || 1}">
            ${item.content}
          </text>`;
        } else if (item.type === 'shape') {
          svgContent += `<rect x="${item.x}" y="${item.y}" 
            width="${item.width}" height="${item.height}"
            fill="${item.backgroundColor || '#cccccc'}"
            opacity="${item.opacity || 1}"/>`;
        }
      });

      svgContent += '</svg>';

      // Create download
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${currentBoard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: "SVG Export Successful",
        description: "Vision board exported as SVG"
      });

    } catch (error) {
      toast({
        title: "SVG Export Failed",
        description: "Failed to export vision board as SVG",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExport = async () => {
    switch (settings.format) {
      case 'png':
      case 'jpg':
        await exportAsImage();
        break;
      case 'pdf':
        await exportAsPDF();
        break;
      case 'svg':
        await exportAsSVG();
        break;
    }
  };

  const shareVisionBoard = async () => {
    if (navigator.share && canvasRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(canvasRef.current);
        
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `${currentBoard.title}.png`, { type: 'image/png' });
            await navigator.share({
              title: currentBoard.title,
              text: currentBoard.description || 'Check out my vision board!',
              files: [file]
            });
          }
        });
      } catch (error) {
        toast({
          title: "Share Failed",
          description: "Could not share vision board",
          variant: "destructive"
        });
      }
    } else {
      toast({
        title: "Share Not Available",
        description: "Sharing is not supported on this device",
        variant: "destructive"
      });
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'png':
        return 'High quality with transparency support';
      case 'jpg':
        return 'Smaller file size, good for sharing';
      case 'pdf':
        return 'Perfect for printing and presentations';
      case 'svg':
        return 'Vector format, infinite scalability';
      default:
        return '';
    }
  };

  const getEstimatedFileSize = () => {
    const multiplier = getResolutionMultiplier(settings.resolution);
    const baseSize = currentBoard.canvasData.canvasWidth * currentBoard.canvasData.canvasHeight;
    const scaledSize = baseSize * multiplier * multiplier;
    
    let estimatedMB;
    switch (settings.format) {
      case 'png':
        estimatedMB = (scaledSize * 4) / (1024 * 1024); // 4 bytes per pixel
        break;
      case 'jpg':
        estimatedMB = (scaledSize * 3 * settings.quality) / (1024 * 1024); // 3 bytes per pixel, quality adjusted
        break;
      case 'pdf':
        estimatedMB = Math.max(1, (scaledSize * 3) / (1024 * 1024));
        break;
      case 'svg':
        estimatedMB = 0.1; // SVG is typically very small
        break;
      default:
        estimatedMB = 1;
    }

    return estimatedMB < 1 ? `${Math.round(estimatedMB * 1024)} KB` : `${estimatedMB.toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-600" />
            Export Vision Board
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export Settings</CardTitle>
              <CardDescription>
                Choose format and quality settings for your export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Format</Label>
                  <Select 
                    value={settings.format} 
                    onValueChange={(value: 'png' | 'jpg' | 'pdf' | 'svg') => 
                      setSettings(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG Image</SelectItem>
                      <SelectItem value="jpg">JPG Image</SelectItem>
                      <SelectItem value="pdf">PDF Document</SelectItem>
                      <SelectItem value="svg">SVG Vector</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {getFormatDescription(settings.format)}
                  </p>
                </div>

                <div>
                  <Label>Resolution</Label>
                  <Select 
                    value={settings.resolution} 
                    onValueChange={(value: 'low' | 'medium' | 'high' | 'ultra') => 
                      setSettings(prev => ({ ...prev, resolution: value }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (1x)</SelectItem>
                      <SelectItem value="medium">Medium (1.5x)</SelectItem>
                      <SelectItem value="high">High (2x)</SelectItem>
                      <SelectItem value="ultra">Ultra (3x)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(settings.format === 'jpg' || settings.format === 'png') && (
                <div>
                  <Label>Quality: {Math.round(settings.quality * 100)}%</Label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </div>
              )}

              <div className="space-y-3">
                {settings.format === 'png' && (
                  <div className="flex items-center justify-between">
                    <Label>Transparent Background</Label>
                    <Switch
                      checked={settings.transparentBackground}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, transparentBackground: checked }))
                      }
                    />
                  </div>
                )}

                {settings.format === 'pdf' && (
                  <div className="flex items-center justify-between">
                    <Label>Include Metadata</Label>
                    <Switch
                      checked={settings.includeMetadata}
                      onCheckedChange={(checked) => 
                        setSettings(prev => ({ ...prev, includeMetadata: checked }))
                      }
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-blue-900">Export Information:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-800">Format:</span> {settings.format.toUpperCase()}
              </div>
              <div>
                <span className="text-blue-800">Resolution:</span> {settings.resolution}
              </div>
              <div>
                <span className="text-blue-800">Est. Size:</span> {getEstimatedFileSize()}
              </div>
              <div>
                <span className="text-blue-800">Elements:</span> {currentBoard.canvasData.items.length}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export {settings.format.toUpperCase()}
            </Button>

            {navigator.share && (
              <Button 
                onClick={shareVisionBoard}
                variant="outline"
                className="flex-1"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}