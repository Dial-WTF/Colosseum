'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Canvas, Object as FabricObject, IText } from 'fabric';
import type { Project, ProjectVersion, ImageProjectData } from '@dial/types';
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
import { VersionManager } from './version-manager';
import { ProjectHeader } from './project-header';
import { projectStorage, createProject, createVersion, getProject, updateProject as updateProjectApi, deleteVersion as deleteVersionApi, updateVersion as updateVersionApi } from '@/lib/project-service';

export function ImageStudioProject() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams?.get('projectId');
  const mode = searchParams?.get('mode');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fabricRef = useRef<typeof import('fabric') | null>(null);
  
  const [project, setProject] = useState<Project | null>(null);
  const [currentVersion, setCurrentVersion] = useState<ProjectVersion | null>(null);
  const [selectedObject, setSelectedObject] = useState<FabricObject | null>(null);
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState(40);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [showVersionPanel, setShowVersionPanel] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Initializing canvas editor...');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize or load project
  useEffect(() => {
    initializeProject();
  }, [projectId, mode]);

  const initializeProject = async () => {
    try {
      if (projectId) {
        // Load existing project
        const existingProject = await getProject(projectId);
        if (existingProject) {
          setProject(existingProject);
          
          // Load current version
          const currentVersionId = existingProject.currentVersionId;
          if (currentVersionId) {
            const version = existingProject.versions.find(v => v.id === currentVersionId);
            if (version) {
              setCurrentVersion(version);
            }
          } else if (existingProject.versions.length > 0) {
            // Load latest version
            setCurrentVersion(existingProject.versions[existingProject.versions.length - 1]);
          }
        }
      } else if (mode === 'project') {
        // Create new project
        const newProject = await createProject({
          name: `Untitled Image Project`,
          type: 'image',
          description: 'Created in Image Studio',
        });
        setProject(newProject);
        // Update URL with new project ID
        router.replace(`/create/image?projectId=${newProject.id}`);
      }
    } catch (error) {
      console.error('Failed to initialize project:', error);
    }
  };

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricCanvasRef.current) return;

    let mounted = true;

    const initCanvas = async () => {
      try {
        setLoadingStep('Loading Fabric.js library...');
        
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

        // Track changes
        canvas.on('object:modified', () => setHasUnsavedChanges(true));
        canvas.on('object:added', () => setHasUnsavedChanges(true));
        canvas.on('object:removed', () => setHasUnsavedChanges(true));

        setLoadingStep('Ready!');
        
        setTimeout(() => {
          if (mounted) {
            setIsLoading(false);
            // Load version data if available
            if (currentVersion) {
              loadVersionToCanvas(currentVersion);
            }
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

  // Load version data when currentVersion changes
  useEffect(() => {
    if (currentVersion && fabricCanvasRef.current && !isLoading) {
      loadVersionToCanvas(currentVersion);
    }
  }, [currentVersion?.id, isLoading]);

  // Update background color
  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.backgroundColor = backgroundColor;
      fabricCanvasRef.current.renderAll();
      setHasUnsavedChanges(true);
    }
  }, [backgroundColor]);

  const loadVersionToCanvas = async (version: ProjectVersion) => {
    if (!fabricCanvasRef.current || version.data.type !== 'image') return;

    try {
      const imageData = version.data as ImageProjectData;
      
      // Load canvas state
      await fabricCanvasRef.current.loadFromJSON(imageData.canvasState);
      fabricCanvasRef.current.renderAll();
      
      // Update local state
      setBackgroundColor(imageData.backgroundColor);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to load version:', error);
      alert('Failed to load version');
    }
  };

  const handleSaveVersion = async (name: string, notes?: string) => {
    if (!project || !fabricCanvasRef.current) return;

    setIsSaving(true);
    try {
      // Get canvas state
      const canvasState = JSON.stringify(fabricCanvasRef.current.toJSON());
      
      // Generate thumbnail
      const thumbnail = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 0.8,
        multiplier: 0.3,
      });

      // Generate export URL
      const exportUrl = fabricCanvasRef.current.toDataURL({
        format: 'png',
        quality: 1,
      });

      const imageData: ImageProjectData = {
        type: 'image',
        canvasState,
        width: fabricCanvasRef.current.width || 800,
        height: fabricCanvasRef.current.height || 600,
        backgroundColor,
        exportUrl,
      };

      const version = await createVersion({
        projectId: project.id,
        name,
        data: imageData,
        thumbnail,
        notes,
      });

      // Reload project to get updated state
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
        setCurrentVersion(version);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to save version:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadVersion = async (versionId: string) => {
    if (!project) return;

    const version = project.versions.find(v => v.id === versionId);
    if (version) {
      if (hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Loading another version will discard them. Continue?')) {
          return;
        }
      }
      
      setCurrentVersion(version);
      await projectStorage.setCurrentVersion(project.id, versionId);
      
      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    if (!project) return;

    try {
      await deleteVersionApi(project.id, versionId);
      
      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
        
        // Update current version if needed
        if (currentVersion?.id === versionId) {
          const latestVersion = updatedProject.versions[updatedProject.versions.length - 1];
          setCurrentVersion(latestVersion || null);
        }
      }
    } catch (error) {
      console.error('Failed to delete version:', error);
      throw error;
    }
  };

  const handleRenameVersion = async (versionId: string, newName: string) => {
    if (!project) return;

    try {
      await updateVersionApi(project.id, versionId, { name: newName });
      
      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
        
        // Update current version if it's the one being renamed
        if (currentVersion?.id === versionId) {
          const updatedVersion = updatedProject.versions.find(v => v.id === versionId);
          if (updatedVersion) {
            setCurrentVersion(updatedVersion);
          }
        }
      }
    } catch (error) {
      console.error('Failed to rename version:', error);
      throw error;
    }
  };

  const handleUpdateProject = async (updates: { name?: string; description?: string }) => {
    if (!project) return;

    try {
      await updateProjectApi(project.id, updates);
      
      // Reload project
      const updatedProject = await getProject(project.id);
      if (updatedProject) {
        setProject(updatedProject);
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  };

  // Canvas operations
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

  const deleteSelected = () => {
    if (!fabricCanvasRef.current || !selectedObject) return;
    
    fabricCanvasRef.current.remove(selectedObject);
    fabricCanvasRef.current.renderAll();
    setSelectedObject(null);
  };

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

  const exportImage = () => {
    if (!fabricCanvasRef.current) return;

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
    });

    const link = document.createElement('a');
    link.download = `${project?.name || 'image'}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleAIGenerate = (result: { url: string; prompt: string }) => {
    if (!fabricCanvasRef.current || !fabricRef.current) return;

    fabricRef.current.Image.fromURL(result.url, (img) => {
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

  const isTextSelected = selectedObject?.type === 'i-text';

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

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Project Header */}
      <ProjectHeader
        project={project}
        onUpdateProject={handleUpdateProject}
      />

      <div className="flex flex-1 overflow-hidden relative">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-card border-b border-border p-4 overflow-x-auto">
            <div className="flex flex-wrap items-center gap-4 min-w-max">
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

              <div className="h-8 w-px bg-border" />

              {/* Text Formatting */}
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

              {hasUnsavedChanges && (
                <span className="text-sm text-amber-500 font-medium">• Unsaved changes</span>
              )}
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 p-8 overflow-auto">
            <canvas ref={canvasRef} className="border border-border shadow-lg bg-white" />
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 border-t border-border p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong className="text-foreground">Tips:</strong> Click elements to select • Drag to move • Use corner handles to resize • Double-click text to edit • Save versions to track your progress
            </p>
          </div>
        </div>

        {/* Version Manager Sidebar */}
        <div 
          className={`transition-all duration-300 border-l border-border bg-card ${
            showVersionPanel ? 'w-96' : 'w-0'
          } overflow-hidden`}
        >
          <div className="w-96 h-full overflow-y-auto p-4">
            <VersionManager
              project={project}
              currentVersion={currentVersion}
              onSaveVersion={handleSaveVersion}
              onLoadVersion={handleLoadVersion}
              onDeleteVersion={handleDeleteVersion}
              onRenameVersion={handleRenameVersion}
              isSaving={isSaving}
            />
          </div>
        </div>

        {/* Toggle Version Panel Button */}
        <button
          onClick={() => setShowVersionPanel(!showVersionPanel)}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground p-2 rounded-l-md shadow-lg hover:bg-primary/90 transition-all z-10"
          style={{ right: showVersionPanel ? '24rem' : '0' }}
        >
          {showVersionPanel ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
    </div>
  );
}

