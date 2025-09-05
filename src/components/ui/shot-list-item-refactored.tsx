import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  GripVertical, 
  Trash2, 
  Upload, 
  Link, 
  Camera,
  Clapperboard,
  Image as ImageIcon,
  MapPin,
  Package,
  User,
  Lightbulb,
  X,
  Check,
  Plus
} from "lucide-react";

interface ShotListItemProps {
  shot: {
    id: string | number;
    shot_type?: string;
    description: string;
    duration?: number;
    location: string;
    equipment?: string[];
    notes?: string;
    status?: string;
    camera: string;
    action: string;
    background: string;
    overlays?: string; // Keep for backward compatibility
    assignee_id?: string;
    references: string[];
    completed: boolean;
    order: number;
    // NEW FIELDS
    props: string[];
    talent: string;
    lightingNotes: string;
  };
  onUpdate: (id: string | number, updates: any) => void;
  onDelete: (id: string | number) => void;
  teamMembers: Array<{ id: string; name: string; avatar: string }>;
}

export function ShotListItem({ shot, onUpdate, onDelete, teamMembers }: ShotListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [propInputValue, setPropInputValue] = useState("");
  const [referenceInputValue, setReferenceInputValue] = useState("");
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  
  // Auto-save debouncing
  const updateTimeoutRef = useRef<NodeJS.Timeout>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced update function (800ms)
  const debouncedUpdate = useCallback((field: string, value: any) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      onUpdate(shot.id, { [field]: value });
    }, 800);
  }, [shot.id, onUpdate]);

  // Immediate update for toggles and non-text fields
  const immediateUpdate = useCallback((field: string, value: any) => {
    onUpdate(shot.id, { [field]: value });
  }, [shot.id, onUpdate]);

  // Props chip handling
  const handleAddProp = useCallback((inputValue: string) => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    // Split by comma and clean up
    const newProps = trimmed.split(',')
      .map(p => p.trim())
      .filter(p => p && !shot.props.includes(p));
    
    if (newProps.length > 0) {
      const updatedProps = [...shot.props, ...newProps];
      immediateUpdate('props', updatedProps);
      setPropInputValue("");
    }
  }, [shot.props, immediateUpdate]);

  const handleRemoveProp = useCallback((index: number) => {
    const updatedProps = shot.props.filter((_, i) => i !== index);
    immediateUpdate('props', updatedProps);
  }, [shot.props, immediateUpdate]);

  // Reference handling
  const handleAddReference = useCallback((url: string) => {
    const trimmed = url.trim();
    if (!trimmed || shot.references.includes(trimmed)) return;
    
    const updatedReferences = [...shot.references, trimmed];
    immediateUpdate('references', updatedReferences);
    setReferenceInputValue("");
  }, [shot.references, immediateUpdate]);

  const handleRemoveReference = useCallback((index: number) => {
    const updatedReferences = shot.references.filter((_, i) => i !== index);
    immediateUpdate('references', updatedReferences);
  }, [shot.references, immediateUpdate]);

  // File upload handling
  const handleFileUpload = useCallback((files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          if (dataUrl) {
            handleAddReference(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }, [handleAddReference]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, [handleFileUpload]);

  // Keyboard handlers
  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-card rounded-2xl shadow-sm border hover:shadow-md transition-all duration-200 ${
      shot.completed 
        ? 'border-green-200 bg-green-50/30 dark:border-green-800 dark:bg-green-950/20' 
        : 'border-border hover:border-primary/20'
    }`}>
      {/* Header with drag handle, shot number, title, and completed toggle */}
      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab hover:text-foreground transition-colors flex-shrink-0" />
        
        {/* Shot Number Badge */}
        <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-colors flex-shrink-0 ${
          shot.completed 
            ? 'bg-green-500 text-white' 
            : 'bg-primary/10 text-primary border-2 border-primary/20'
        }`}>
          {shot.order + 1}
        </div>
        
        {/* Shot Title/Description */}
        <div className="flex-1 min-w-0">
          <Input
            value={shot.description}
            onChange={(e) => debouncedUpdate('description', e.target.value)}
            placeholder="Shot description..."
            className={`border-none bg-transparent p-0 h-auto text-base focus-visible:ring-0 font-medium ${
              shot.completed ? 'line-through text-muted-foreground' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
          />
          
          {/* Subtle metadata row */}
          {(shot.location || shot.talent || shot.lightingNotes) && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 truncate">
              {shot.location && <span className="truncate">{shot.location}</span>}
              {shot.talent && (
                <>
                  {shot.location && <span>·</span>}
                  <span className="truncate">{shot.talent}</span>
                </>
              )}
              {shot.lightingNotes && (
                <>
                  {(shot.location || shot.talent) && <span>·</span>}
                  <span className="text-blue-600 dark:text-blue-400">Lighting</span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Completed Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Label htmlFor={`completed-${shot.id}`} className="text-xs text-muted-foreground cursor-pointer">
            {shot.completed ? 'Complete' : 'Pending'}
          </Label>
          <Checkbox
            id={`completed-${shot.id}`}
            checked={shot.completed}
            onCheckedChange={(checked) => immediateUpdate('completed', checked)}
            className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
          />
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* SECTION 1: Shot Basics */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Camera */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" />
                  Camera Angle
                </Label>
                <Input
                  value={shot.camera}
                  onChange={(e) => debouncedUpdate('camera', e.target.value)}
                  placeholder="Wide shot, Close-up, Medium..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
                />
              </div>

              {/* Action */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5" />
                  Action
                </Label>
                <Input
                  value={shot.action}
                  onChange={(e) => debouncedUpdate('action', e.target.value)}
                  placeholder="What happens in this shot..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Scene Setup */}
          <div className="border-t border-muted/30 pt-3 space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Location */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Location
                </Label>
                <Input
                  value={shot.location || ''}
                  onChange={(e) => debouncedUpdate('location', e.target.value)}
                  placeholder="studio, outdoor, office..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
                />
              </div>

              {/* Talent/Model */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Talent/Model
                </Label>
                <Input
                  value={shot.talent || ''}
                  onChange={(e) => debouncedUpdate('talent', e.target.value)}
                  placeholder="Actor, Model, Hand model..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
                />
              </div>
            </div>

            {/* Background */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Background</Label>
              <Textarea
                value={shot.background}
                onChange={(e) => debouncedUpdate('background', e.target.value)}
                placeholder="Describe the background/setting..."
                className="resize-none h-16 text-sm"
                onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
              />
            </div>

            {/* Lighting Notes */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Lighting Notes <span className="opacity-60">(optional)</span>
              </Label>
              <Textarea
                value={shot.lightingNotes || ''}
                onChange={(e) => debouncedUpdate('lightingNotes', e.target.value)}
                placeholder="Soft light, backlit, natural light..."
                className="resize-none h-12 text-sm"
                onKeyDown={(e) => e.key === 'Escape' && e.currentTarget.blur()}
              />
            </div>

            {/* Props - Chip Input */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Props
              </Label>
              
              {/* Props Chips Display */}
              {shot.props.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {shot.props.map((prop, index) => (
                    <div key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs font-medium">
                      <span>{prop}</span>
                      <button
                        onClick={() => handleRemoveProp(index)}
                        className="ml-1 text-primary/70 hover:text-primary hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Props Input */}
              <div className="flex gap-2">
                <Input
                  value={propInputValue}
                  onChange={(e) => setPropInputValue(e.target.value)}
                  placeholder="Add props (comma-separated)... necklace, box, table"
                  className="text-sm"
                  onKeyDown={(e) => handleKeyDown(e, () => handleAddProp(propInputValue))}
                />
                <Button 
                  onClick={() => handleAddProp(propInputValue)} 
                  size="sm"
                  variant="outline"
                  className="px-3"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* SECTION 3: References */}
          <div className="border-t border-muted/30 pt-3 space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Reference Images/Links
            </Label>
            
            {/* File Upload Area */}
            <div 
              className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-3 text-center hover:border-muted-foreground/40 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Images or Drag & Drop
              </Button>
            </div>

            {/* Add Reference URL */}
            <div className="flex gap-2">
              <Input
                value={referenceInputValue}
                onChange={(e) => setReferenceInputValue(e.target.value)}
                placeholder="Or paste image URL / reference link..."
                className="text-sm"
                onKeyDown={(e) => handleKeyDown(e, () => handleAddReference(referenceInputValue))}
              />
              <Button 
                onClick={() => handleAddReference(referenceInputValue)} 
                size="sm"
                variant="outline"
                className="px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* References Display */}
            {shot.references.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {shot.references.map((reference, index) => (
                  <div key={index} className="relative group">
                    {reference.startsWith('data:image') || reference.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      // Image thumbnail
                      <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={reference} 
                          alt={`Reference ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveReference(index)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      // URL link pill
                      <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg group-hover:bg-muted/50 transition-colors">
                        <Link className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs truncate flex-1">{reference}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveReference(index)}
                          className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delete Shot Button */}
          <div className="border-t border-muted/30 pt-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                console.log('🗑️ Delete button clicked for shot:', {
                  id: shot.id,
                  description: shot.description,
                  order: shot.order
                });
                onDelete(shot.id);
              }}
              className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 hover:border-destructive/30 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Shot
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}