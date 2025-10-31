'use client';

import { useEffect, useRef, useState } from 'react';
import type { Canvas, Object as FabricObject, IText, Image as FabricImage } from 'fabric';
import { 
  Type, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  Bold,
  Italic,
  Underline,
  Palette,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { AIGeneratorPanel } from './ai-generator-panel';

export function ImageStudio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fabricRef = useRef<typeof import('fabric') | null>(null);
  
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Initializing canvas editor...');

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    let mounted = true;

    const initCanvas = async () => {
      try {
        setLoadingStep('Loading Fabric.js library...');
        
        // Dynamically import fabric only on client side
        const fabricModule = await import('fabric');
        
        if (!mounted) return;
        setLoadingStep('Setting up canvas renderer...');
        
        fabricRef.current = fabricModule;

        if (!canvasRef.current) {
          setIsLoading(false);
          return;
        }

        setLoadingStep('Initializing drawing surface...');
        
        const canvas = new fabricModule.Canvas(canvasRef.current, {
          width: 800,
          height: 600,
          backgroundColor: backgroundColor,
        });

        if (!mounted) return;
        
        setLoadingStep('Configuring event handlers...');
        fabricCanvasRef.current = canvas;

        // Handle object selection
        canvas.on('selection:created', (e) => {
          setSelectedObject(e.selected?.[0] || null);
        });

        canvas.on('selection:updated', (e) => {
          setSelectedObject(e.selected?.[0] || null);
        });

        canvas.on('selection:cleared', () => {
          setSelectedObject(null);
        });

        setLoadingStep('Ready!');
        
        // Small delay to show the "Ready!" message
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 300);
      } catch (error) {
        console.error('Failed to load fabric.js:', error);
        setLoadingStep('Error loading editor');
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
          }
        }, 1000);
      }
    };

    initCanvas();

    return () => {
      mounted = false;
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
      }
    };
  }, []);

  // Update background color
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = backgroundColor;
      fabricCanvasRef.current.renderAll();
    }
  }, [backgroundColor]);

  // Add text
  const addText = () => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    const text = new fabricRef.current.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontSize: fontSize,
      fill: textColor,
      fontFamily: 'Arial',
    });

    fabricCanvasRef.current.add(text);
    fabricCanvasRef.current.setActiveObject(text);
    fabricCanvasRef.current.renderAll();
  };

  // Add image
  const addImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fabricCanvasRef.current || !fabricRef.current) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target?.result as string;
      
      fabricRef.current!.Image.fromURL(imgUrl, (img) => {
        // Scale image to fit canvas
        const scale = Math.min(
          400 / (img.width || 1),
          400 / (img.height || 1)
        );
        
        img.scale(scale);
        img.set({
          left: 200,
          top: 100,
        });

        fabricCanvasRef.current?.add(img);
        fabricCanvasRef.current?.setActiveObject(img);
        fabricCanvasRef.current?.renderAll();
      });
    };
    
    reader.readAsDataURL(file);
  };

  // Delete selected object
  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  };

  // Text formatting
  const setTextAlign = (align: string) => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    
    (selectedObject as IText).set({ textAlign: align });
    fabricCanvasRef.current?.renderAll();
  };

  const toggleBold = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    
    const text = selectedObject as IText;
    const current = text.fontWeight;
    text.set({ fontWeight: current === 'bold' ? 'normal' : 'bold' });
    fabricCanvasRef.current?.renderAll();
  };

  const toggleItalic = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    
    const text = selectedObject as IText;
    text.set({ fontStyle: text.fontStyle === 'italic' ? 'normal' : 'italic' });
    fabricCanvasRef.current?.renderAll();
  };

  const toggleUnderline = () => {
    if (!selectedObject || selectedObject.type !== 'i-text') return;
    
    const text = selectedObject as IText;
    text.set({ underline: !text.underline });
    fabricCanvasRef.current?.renderAll();
  };

  const updateTextColor = (color: string) => {
    setTextColor(color);
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as IText).set({ fill: color });
      fabricCanvasRef.current?.renderAll();
    }
  };

  const updateFontSize = (size: number) => {
    setFontSize(size);
    if (selectedObject && selectedObject.type === 'i-text') {
      (selectedObject as IText).set({ fontSize: size });
      fabricCanvasRef.current?.renderAll();
    }
  };

  // Export canvas
  const exportImage = () => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `sticker-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const isTextSelected = selectedObject?.type === 'i-text';

  // Handle AI-generated image
  const handleAIGenerate = (result: { url: string; prompt: string }) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    fabricRef.current.Image.fromURL(result.url, (img) => {
      // Scale image to fit canvas
      const scale = Math.min(
        600 / (img.width || 1),
        450 / (img.height || 1)
      );
      
      img.scale(scale);
      img.set({
        left: 100,
        top: 75,
      });

      fabricCanvasRef.current?.add(img);
      fabricCanvasRef.current?.setActiveObject(img);
      fabricCanvasRef.current?.renderAll();
    });
  };

   if (isLoading) {
     return (
       <div className="flex min-h-screen items-center justify-center bg-muted/30">
         <div className="text-center">
           <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
           <p className="text-foreground font-medium text-lg mb-2">Loading Canvas Editor</p>
           <p className="text-muted-foreground text-sm animate-pulse">{loadingStep}</p>
         </div>
       </div>
     );
   }

  return (
    <div className="flex h-full relative">
      {/* AI Generator Sidebar */}
      <div 
        className={`transition-all duration-300 border-r border-border bg-card ${
          showAIPanel ? 'w-96' : 'w-0'
        } overflow-hidden`}
      >
        <div className="w-96 h-full overflow-y-auto p-4">
          <AIGeneratorPanel type="image" onGenerate={handleAIGenerate} />
        </div>
      </div>

      {/* Toggle AI Panel Button */}
      <button
        onClick={() => setShowAIPanel(!showAIPanel)}
        className="absolute left-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-r-md shadow-lg hover:bg-primary/90 transition-all z-10"
        style={{ left: showAIPanel ? '24rem' : '0' }}
      >
        {showAIPanel ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-card border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Add Elements */}
          <div className="flex items-center gap-2">
            <button
              onClick={addText}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Type size={18} />
              Add Text
            </button>
            <button
              onClick={addImage}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              <ImageIcon size={18} />
              Add Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Text Formatting (only when text is selected) */}
          {isTextSelected && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleBold}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Bold"
                >
                  <Bold size={18} />
                </button>
                <button
                  onClick={toggleItalic}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Italic"
                >
                  <Italic size={18} />
                </button>
                <button
                  onClick={toggleUnderline}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Underline"
                >
                  <Underline size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTextAlign('left')}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Align Left"
                >
                  <AlignLeft size={18} />
                </button>
                <button
                  onClick={() => setTextAlign('center')}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Align Center"
                >
                  <AlignCenter size={18} />
                </button>
                <button
                  onClick={() => setTextAlign('right')}
                  className="p-2 rounded hover:bg-accent transition-colors text-foreground"
                  title="Align Right"
                >
                  <AlignRight size={18} />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Size:</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={(e) => updateFontSize(Number(e.target.value))}
                  className="w-20 px-2 py-1 bg-background border border-input rounded text-foreground"
                  min="10"
                  max="200"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-foreground">Color:</label>
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => updateTextColor(e.target.value)}
                  className="w-12 h-8 rounded cursor-pointer border border-input"
                />
              </div>

              <div className="h-8 w-px bg-border" />
            </>
          )}

          {/* Background Color */}
          <div className="flex items-center gap-2">
            <Palette size={18} className="text-foreground" />
            <label className="text-sm font-medium text-foreground">Background:</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-12 h-8 rounded cursor-pointer border border-input"
            />
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border" />

          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedObject && (
              <button
                onClick={deleteSelected}
                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
            <button
              onClick={exportImage}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <Download size={18} />
              Export PNG
            </button>
          </div>
        </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 p-8 overflow-auto">
          <canvas ref={canvasRef} className="border border-border shadow-lg bg-white" />
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 border-t border-border p-4">
          <p className="text-sm text-muted-foreground">
            💡 <strong className="text-foreground">Tips:</strong> Click elements to select • Drag to move • Use corner handles to resize • Double-click text to edit
          </p>
        </div>
      </div>
    </div>
  );
}
