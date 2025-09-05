import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Sparkles, 
  Plus,
  Folder,
  FolderOpen,
  Check,
  Clock,
  HelpCircle,
  Image,
  Video,
  FileText,
  Copy,
  Eye,
  Download,
  MessageSquare,
  Send,
  Filter,
  AtSign,
  Paperclip
} from "lucide-react";
import { ContentService } from "@/services/contentService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { ShotListItem } from "@/components/ui/shot-list-item";
import { RawFilesUploader } from "@/components/raw-files/RawFilesUploader";
import { EnhancedRawFilesGrid } from "@/components/raw-files/EnhancedRawFilesGrid";
import { RawFilesService } from "@/services/rawFilesService";
import { RawFile } from "@/types/rawFiles";
import { supabase } from "@/integrations/supabase/client";

const STAGES = [
  "Ideation",
  "Scripting", 
  "Shoot Prep",
  "Editing",
  "Variations",
  "Ready to test",
  "Live",
];

const FORMATS = ["Video", "Static", "AI", "Animated", "3D"];


// Mock data - in real app this would come from API/database
const mockCards = [
  {
    id: 1,
    title: "Instagram Stories Guide",
    stage: "Ideation",
    date: "2025-08-30",
    product: "Photo Necklace",
    format: "Video",
    notesHtml: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "2025-09-03",
    attachments: [],
    checklist: [],
    referenceLinks: [],
    lastUpdated: "",
    lastUpdatedBy: "",
  },
  {
    id: 2,
    title: "Couple Gifting Script",
    stage: "Scripting",
    date: "2025-08-31",
    product: "Bracelet",
    format: "Static",
    notesHtml: "",
    assignedTo: "arjun",
    priority: "Low",
    deadline: "",
    attachments: [],
    checklist: [],
    referenceLinks: [],
    lastUpdated: "",
    lastUpdatedBy: "",
  },
  {
    id: 3,
    title: "Men's Bracelet Shoot",
    stage: "Shoot Planning",
    date: "2025-09-01",
    product: "Aura Bracelet",
    format: "AI",
    notesHtml: "",
    assignedTo: "ria",
    priority: "High",
    deadline: "2025-09-07",
    attachments: [],
    checklist: [],
    referenceLinks: ["https://www.notion.so/shotlist-demo"],
    lastUpdated: "",
    lastUpdatedBy: "",
  },
];

const TEAM = [
  { id: "nandani", name: "Nandani", avatar: "https://i.pravatar.cc/100?img=1" },
  { id: "arjun", name: "Arjun", avatar: "https://i.pravatar.cc/100?img=2" },
  { id: "ria", name: "Ria", avatar: "https://i.pravatar.cc/100?img=3" },
];

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

const stageIndex = (stage) => Math.max(0, STAGES.indexOf(stage));
const progressPct = (stage) => ((stageIndex(stage) + 1) / STAGES.length) * 100;

const deadlineInfo = (deadline) => {
  if (!deadline) return { label: "No deadline", cls: "bg-gray-200 text-gray-700" };
  const today = new Date().toISOString().slice(0, 10);
  const d1 = new Date(deadline);
  const d2 = new Date(today);
  const diff = Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return { label: "Overdue", cls: "bg-red-100 text-red-700 border border-red-200" };
  if (diff <= 3) return { label: `Due in ${diff}d`, cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
  return { label: `Due in ${diff}d`, cls: "bg-green-100 text-green-700 border border-green-200" };
};

const getTimeSince = (date) => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

const teamById = Object.fromEntries(TEAM.map((t) => [t.id, t]));


export default function ContentDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editable, setEditable] = useState(null);
  const [loading, setLoading] = useState(true);
  // Removed isSaving state for Notion-like silent auto-save
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [contentId, setContentId] = useState(null);
  const [commentFilter, setCommentFilter] = useState('all'); // all, unresolved, resolved
  const [newComment, setNewComment] = useState('');
  
  // Raw Files state
  const [rawFiles, setRawFiles] = useState<RawFile[]>([]);
  const [rawFilesLoading, setRawFilesLoading] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const lastRawFilesLoadTime = useRef<number>(0);
  
  // Define loadRawFiles before useEffect hooks that use it
  const loadRawFiles = useCallback(async () => {
    const actualContentId = contentId || editable?.id;
    console.log('🔍 loadRawFiles called with contentId:', contentId, 'editable.id:', editable?.id, 'using:', actualContentId);
    
    if (!actualContentId) {
      console.log('❌ No contentId available (neither contentId nor editable.id), cannot load raw files');
      return;
    }

    // Prevent ALL reloads during auto-saves to fix scroll jumping
    if (isAutoSaving) {
      console.log('⏭️ Skipping raw files reload: auto-save in progress');
      return;
    }
    
    // Also prevent too frequent reloads to maintain scroll position
    const now = Date.now();
    const timeSinceLastLoad = now - lastRawFilesLoadTime.current;
    if (timeSinceLastLoad < 3000) { // Increased to 3 seconds to reduce reload frequency
      console.log('⏭️ Skipping raw files reload: too recent reload (preserving scroll position)');
      return;
    }
    lastRawFilesLoadTime.current = now;
    
    setRawFilesLoading(true);
    try {
      console.log('📂 Loading raw files for actualContentId:', actualContentId);
      const files = await RawFilesService.getRawFiles(actualContentId);
      console.log('✅ Raw files loaded from service:', files);
      console.log('🔢 Number of files:', files?.length || 0);
      console.log('📋 Files details:', files?.map(f => ({ id: f.id, name: f.display_name, status: f.status, size: f.file_size, url: f.file_url })));
      
      // Validate that files have required properties
      const validFiles = files.filter(file => {
        const isValid = file.id && file.display_name && file.file_url;
        if (!isValid) {
          console.warn('⚠️ Invalid file found:', file);
        }
        return isValid;
      });
      
      console.log(`🎯 Setting ${validFiles.length} valid files in state`);
      setRawFiles(validFiles);
      console.log('💾 Raw files state updated');
      
      // Additional debug log for empty results
      if (validFiles.length === 0) {
        console.log('⚠️ No files found for contentId:', actualContentId);
        console.log('🔍 Running diagnostic query...');
        
        // Debug: Check if there are any files in the database at all
        const { data: allFiles } = await supabase
          .from('raw_files')
          .select('id, display_name, content_id')
          .limit(5);
        console.log('🔍 Sample of all files in database:', allFiles);
      }
    } catch (error) {
      console.error('❌ Failed to load raw files:', error);
      toast({
        title: "Failed to load raw files",
        description: "Please try refreshing the page",
        variant: "destructive"
      });
    } finally {
      setRawFilesLoading(false);
    }
  }, [contentId, editable?.id, isAutoSaving, toast]);
  
  // Debug rawFiles state changes
  useEffect(() => {
    console.log('🎬 rawFiles state changed:', rawFiles);
    console.log('🎬 rawFiles count:', rawFiles?.length || 0);
  }, [rawFiles]);
  
  const saveTimeoutRef = useRef(null);
  const realtimeSubscriptionRef = useRef(null);

  // Load raw files ONLY when contentId changes - NOT when editable changes
  // Remove loadRawFiles dependency to prevent reload during autosave
  useEffect(() => {
    if (contentId) {
      console.log('🎯 ContentId changed, loading raw files:', contentId);
      loadRawFiles();
    } else {
      console.log('⏳ Content ID not yet available, waiting...');
    }
  }, [contentId]); // Removed loadRawFiles dependency to prevent autosave reloads

  // Removed the problematic useEffect that was causing infinite reload cycles
  // Raw files are already loaded by the contentId/editable.id useEffect above

  const handleRawFilesUploaded = (newFiles: RawFile[]) => {
    console.log('📤 Raw files uploaded:', newFiles.map(f => ({ id: f.id, name: f.display_name })));
    
    // Add new files to current state immediately for instant feedback
    setRawFiles(prev => [...newFiles, ...prev]);
    
    // Skip database reload after upload to prevent scroll jumping
    // Files are already added to state immediately above for instant feedback
    console.log('✅ Skipping database reload after upload to preserve scroll position');
  };

  // Stable raw files array to prevent constant re-renders
  const memoizedRawFiles = useMemo(() => {
    // Only return a new array if the actual content has changed
    return rawFiles;
  }, [rawFiles.length, ...rawFiles.map(f => `${f.id}-${f.status}-${f.updated_at}`)]);

  const handleRawFilesChanged = useCallback((updatedFiles: RawFile[]) => {
    setRawFiles(updatedFiles);
  }, []);



  // Cleanup function to remove duplicate content entries
  const cleanupDuplicateContent = async () => {
    console.log('🧹 Starting cleanup of duplicate content...');
    try {
      const { data: allContent, error } = await supabase
        .from('content_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Failed to fetch content for cleanup:', error);
        return;
      }

      console.log(`📊 Found ${allContent?.length || 0} total content items`);
      
      // Group by title to find duplicates
      const titleGroups = {};
      allContent?.forEach(item => {
        const title = item.title || 'Untitled';
        if (!titleGroups[title]) {
          titleGroups[title] = [];
        }
        titleGroups[title].push(item);
      });

      // Find titles with multiple entries
      const duplicates = Object.entries(titleGroups).filter(([title, items]) => items.length > 1);
      console.log(`🔍 Found ${duplicates.length} titles with duplicates`);

      for (const [title, items] of duplicates) {
        console.log(`📋 Title "${title}" has ${items.length} duplicates`);
        // Keep the most recent one, mark others for deletion
        const [keep, ...toDelete] = items;
        console.log(`✅ Keeping: ${keep.id} (${keep.created_at})`);
        
        for (const item of toDelete) {
          console.log(`🗑️ Would delete: ${item.id} (${item.created_at})`);
          // Uncomment the next line to actually delete:
          // await supabase.from('content_items').delete().eq('id', item.id);
        }
      }

      toast({
        title: "Cleanup Analysis Complete",
        description: `Found ${duplicates.length} titles with duplicates. Check console for details.`
      });

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  };

  useEffect(() => {
    loadContent();
    
    // Keyboard shortcuts
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveCard();
      }
      // Escape to close (navigate back)
      if (e.key === 'Escape') {
        navigate('/content/planning');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup on unmount
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (realtimeSubscriptionRef.current) {
        ContentService.unsubscribe(realtimeSubscriptionRef.current);
      }
    };
  }, [slug, navigate]);

  const loadContent = async () => {
    console.log('📥 loadContent called for slug:', slug);
    
    try {
      setLoading(true);
      setError("");
      
      let content = null;
      let hadStoredContent = false; // Track if we had localStorage content
      
      // First try to get content from localStorage (from Planning page)
      const storedContent = localStorage.getItem('currentContent');
      console.log('💾 Stored content from localStorage:', storedContent);
      if (storedContent) {
        hadStoredContent = true; // Mark that we had stored content
        try {
          const storedContentData = JSON.parse(storedContent);
          console.log('📋 Parsed content from localStorage:', storedContentData);
          console.log('🆔 Content ID from localStorage:', storedContentData?.id);
          
          if (storedContentData.id) {
            try {
              console.log('🔍 Loading full content from database with ID:', storedContentData.id);
              // Load full content from database with enhanced data
              const fullContent = await ContentService.getContentById(storedContentData.id);
              console.log('📊 Full content from database:', fullContent);
              console.log('📜 Scripts from database:', fullContent?.content_scripts);
              console.log('🎬 Shot list from database:', fullContent?.shot_list);
              
              content = transformDbContentToEditable(fullContent);
              console.log('🔄 Transformed content:', content);
              console.log('📝 Transformed scriptContent:', content?.scriptContent);
              console.log('🎬 Transformed shotList:', content?.shotList);
              
              setContentId(fullContent.id);
              console.log('🆔 ContentId set from localStorage content:', fullContent.id);
              
              // Only remove from localStorage after successful load
              localStorage.removeItem('currentContent');
              console.log('🧹 Cleared localStorage after successful load');
            } catch (dbError) {
              console.error('❌ Failed to load full content from database, using localStorage fallback:', dbError);
              // Use the stored content as fallback if database load fails
              content = storedContentData;
              setContentId(storedContentData.id);
              console.log('⚠️ Using localStorage fallback due to database error');
              console.log('📋 Fallback content:', {
                id: content.id,
                databaseId: content.databaseId,
                title: content.title
              });
              localStorage.removeItem('currentContent'); // Still remove to prevent repeated errors
            }
          } else {
            // Use the stored content as fallback
            content = storedContentData;
            console.log('⚠️ Using localStorage fallback content:', content);
            if (content?.id) {
              setContentId(content.id);
              console.log('🆔 ContentId set from localStorage fallback:', content.id);
            }
            localStorage.removeItem('currentContent'); // Remove since we're using it
          }
        } catch (error) {
          console.error('Error parsing stored content:', error);
          // Don't remove localStorage on error - might be needed for retry
        }
      }
      
      // If no stored content, try to find by slug
      if (!content && slug) {
        try {
          console.log('🔍 Searching for content by slug:', slug);
          const contentList = await ContentService.getContentList();
          console.log('📋 Available content items:', contentList?.length || 0);
          console.log('📋 Available content titles and slugs:', contentList.map(item => ({ 
            title: item.title, 
            slug: generateSlug(item.title),
            id: item.id 
          })));
          
          // Enhanced slug matching with better debugging
          console.log('🔍 Looking for exact match...');
          let foundContent = contentList.find(item => {
            const itemSlug = generateSlug(item.title);
            console.log(`  Comparing "${itemSlug}" === "${slug}"`);
            return itemSlug === slug;
          });
          
          // Fallback 1: Case-insensitive exact match
          if (!foundContent) {
            console.log('🔍 Trying case-insensitive match...');
            foundContent = contentList.find(item => {
              const itemSlug = generateSlug(item.title).toLowerCase();
              const targetSlug = slug.toLowerCase();
              console.log(`  Comparing "${itemSlug}" === "${targetSlug}"`);
              return itemSlug === targetSlug;
            });
          }
          
          // Fallback 2: Partial matching
          if (!foundContent) {
            console.log('🔍 Trying partial matching...');
            foundContent = contentList.find(item => {
              const itemSlug = generateSlug(item.title).toLowerCase();
              const targetSlug = slug.toLowerCase();
              const partialMatch = itemSlug.includes(targetSlug) || targetSlug.includes(itemSlug);
              if (partialMatch) {
                console.log(`  Partial match found: "${itemSlug}" <-> "${targetSlug}"`);
              }
              return partialMatch;
            });
          }
          
          // Fallback 3: Title similarity (with spaces)
          if (!foundContent) {
            console.log('🔍 Trying title similarity matching...');
            foundContent = contentList.find(item => {
              const itemTitle = item.title.toLowerCase();
              const targetTitle = slug.replace(/-/g, ' ').toLowerCase();
              const similarityMatch = itemTitle.includes(targetTitle) || targetTitle.includes(itemTitle);
              if (similarityMatch) {
                console.log(`  Similarity match found: "${itemTitle}" <-> "${targetTitle}"`);
              }
              return similarityMatch;
            });
          }
          
          // Fallback 4: Try to match by ID if slug looks like an ID
          if (!foundContent && /^[0-9a-f-]{36}$|^[0-9]+$/.test(slug)) {
            console.log('🔍 Slug looks like an ID, trying direct ID match...');
            foundContent = contentList.find(item => item.id === slug || item.id.toString() === slug);
          }
          
          if (foundContent) {
            console.log('✅ Found content by slug matching:', {
              id: foundContent.id,
              title: foundContent.title,
              matchedSlug: generateSlug(foundContent.title)
            });
            
            try {
              console.log('🔍 Loading full content from database for slug match, ID:', foundContent.id);
              const fullContent = await ContentService.getContentById(foundContent.id);
              console.log('📊 Full content from database (slug path):', fullContent);
              console.log('🎬 Shot list from database (slug path):', fullContent?.shot_list);
              
              content = transformDbContentToEditable(fullContent);
              console.log('🔄 Transformed content (slug path):', content);
              console.log('🎬 Transformed shotList (slug path):', content?.shotList);
              
              setContentId(foundContent.id);
              console.log('🆔 ContentId set from slug lookup:', foundContent.id);
            } catch (enhancedError) {
              console.error('❌ Failed to load enhanced content, using basic content:', enhancedError);
              // Fallback to basic content transformation
              content = {
                id: foundContent.id,
                title: foundContent.title,
                stage: mapDbStatusToStage(foundContent.status),
                date: foundContent.created_at ? new Date(foundContent.created_at).toISOString().slice(0, 10) : todayYMD(),
                product: foundContent.metadata?.product || "Unknown Product",
                format: foundContent.platform || "Video",
                notesHtml: foundContent.metadata?.notesHtml || "",
                assignedTo: foundContent.content_team_assignments?.[0]?.user_id || "",
                priority: foundContent.metadata?.priority || "Medium",
                deadline: foundContent.metadata?.deadline || "",
                attachments: foundContent.content_attachments || [],
                checklist: foundContent.metadata?.checklist || [],
                referenceLinks: foundContent.metadata?.referenceLinks || [],
                planning: { concept: "", hook: "", body: "", cta: "" },
                shotList: [],
                editing: { guide: "", deliverables: [] },
                review: { comments: [] },
                lastUpdated: foundContent.updated_at || "",
                lastUpdatedBy: foundContent.metadata?.lastUpdatedBy || "",
              };
              setContentId(foundContent.id);
            }
          } else {
            console.log('❌ No content found for slug:', slug);
            console.log('❌ Available slugs:', contentList.map(item => generateSlug(item.title)));
          }
        } catch (err) {
          console.error('Error searching for content:', err);
        }
      }
      
      // If still no content found, show helpful error
      if (!content) {
        console.error('❌ No content found! Slug:', slug, 'Had stored content:', hadStoredContent);
        console.error('❌ This could be due to:');
        console.error('  1. Slug mismatch between URL and database content');
        console.error('  2. Content was deleted or moved');
        console.error('  3. Database connection issues');
        
        setError(`Content not found for "${slug}". The content may have been moved or deleted. Please return to the planning page to find the correct content.`);
        setLoading(false);
        return;
      }
      
      setEditable(content);
      
      // Set up real-time subscription if we have a content ID
      if (contentId) {
        setupRealtimeSubscription(contentId);
      }
      
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const transformDbContentToEditable = (dbContent) => {
    console.log('🔄 Transforming DB content:', dbContent);
    console.log('📊 Available data:', {
      shot_list: dbContent.shot_list?.length || 0,
      content_planning_data: dbContent.content_planning_data?.length || 0,
      content_editing_data: dbContent.content_editing_data?.length || 0,
      content_deliverables: dbContent.content_deliverables?.length || 0,
      content_comments: dbContent.content_comments?.length || 0,
    });
    
    console.log('🎬 Shot list data details:', dbContent.shot_list?.map(shot => ({
      id: shot.id,
      description: shot.description,
      order_index: shot.order_index,
      camera: shot.camera,
      action: shot.action,
      completed: shot.completed
    })));
    
    return {
      id: dbContent.id,
      title: dbContent.title,
      stage: mapDbStatusToStage(dbContent.status),
      date: dbContent.created_at ? new Date(dbContent.created_at).toISOString().slice(0, 10) : todayYMD(),
      product: dbContent.metadata?.product || "",
      format: dbContent.platform || "Video",
      notesHtml: dbContent.metadata?.notesHtml || "",
      assignedTo: dbContent.content_team_assignments?.[0]?.user_id || "",
      priority: dbContent.metadata?.priority || "Medium",
      deadline: dbContent.metadata?.deadline || "",
      // Use database tables for structured data
      attachments: dbContent.content_attachments || dbContent.metadata?.attachments || [],
      checklist: dbContent.metadata?.checklist || [],
      referenceLinks: dbContent.content_tags?.filter(tag => tag.tag.startsWith('ref:')).map(tag => tag.tag.slice(4)) || dbContent.metadata?.referenceLinks || [],
      hookRows: dbContent.content_hooks?.sort((a, b) => a.order_index - b.order_index).map(hook => ({
        id: hook.order_index + 1,
        type: hook.hook_type,
        text: hook.text
      })) || [],
      // Planning tab data from database
      planning: {
        concept: dbContent.content_planning_data?.[0]?.concept || "",
        hook: dbContent.content_planning_data?.[0]?.hook || "",
        body: dbContent.content_planning_data?.[0]?.body || "",
        cta: dbContent.content_planning_data?.[0]?.cta || ""
      },
      // Shot List tab data
      shotList: dbContent.shot_list?.map(shot => ({
        id: shot.id || `db_${Date.now()}_${Math.random()}`,
        shot_type: shot.shot_type || "",
        description: shot.description || "",
        duration: shot.duration || null,
        location: shot.location || "",
        equipment: shot.equipment || [],
        notes: shot.notes || "",
        status: shot.status || "planned",
        camera: shot.camera || "",
        action: shot.action || "",
        background: shot.background || "",
        overlays: shot.overlays || "", // Keep for backward compatibility
        assignee_id: shot.assignee_id || null,
        references: shot.references || [],
        completed: shot.completed || false,
        order: shot.order_index || 0,
        // NEW FIELDS
        props: shot.props || [],
        talent: shot.talent || "",
        lightingNotes: shot.lighting_notes || ""
      })) || [],
      // Editing tab data
      editing: {
        guide: dbContent.content_editing_data?.[0]?.editing_guide || "",
        deliverables: dbContent.content_deliverables || []
      },
      // Review tab data
      review: {
        comments: dbContent.content_comments?.map(comment => ({
          id: comment.id,
          text: comment.text || comment.comment,
          author: comment.author_id || 'Unknown',
          resolved: comment.resolved || false,
          createdAt: comment.created_at || new Date().toISOString()
        })) || []
      },
      bodyRows: dbContent.content_body_sections?.sort((a, b) => a.order_index - b.order_index).map(section => ({
        id: section.order_index + 1,
        title: section.section_title || "",
        bulletPoints: section.bullet_points || [],
        details: section.details || ""
      })) || [],
      lastUpdated: dbContent.updated_at || "",
      lastUpdatedBy: dbContent.metadata?.lastUpdatedBy || "",
    };
  };


  const createNewContent = (slug) => {
    return {
      id: null, // Will be set when saved to database
      title: slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New Content',
      stage: "Ideation",
      date: new Date().toISOString().slice(0, 10),
      product: "",
      format: "Video",
      notesHtml: "",
      assignedTo: "",
      priority: "Medium",
      deadline: "",
      attachments: [],
      checklist: [],
      referenceLinks: [],
      // Planning tab data
      planning: {
        concept: "",
        hook: "",
        body: "",
        cta: ""
      },
      // Shot List tab data
      shotList: [],
      // Editing tab data
      editing: {
        guide: "",
        deliverables: []
      },
      // Review tab data
      review: {
        comments: []
      },
      lastUpdated: "",
      lastUpdatedBy: "",
    };
  };

  const setupRealtimeSubscription = (id) => {
    realtimeSubscriptionRef.current = ContentService.subscribeToContent(id, (payload) => {
      console.log('Real-time update:', payload);
      // Reload content when changes are detected
      if (payload.eventType !== 'DELETE') {
        loadContent();
      }
    });
  };

  // Map database status to stage
  const mapDbStatusToStage = (dbStatus) => {
    const statusMap = {
      'draft': 'Ideation',
      'in_progress': 'Scripting',
      'review': 'Editing',
      'published': 'Live',
      'archived': 'Live'
    };
    return statusMap[dbStatus] || 'Ideation';
  };

  // Map stage to database status
  const mapStageToDbStatus = (stage) => {
    const stageMap = {
      'Ideation': 'draft',
      'Scripting': 'in_progress',
      'Shoot Prep': 'in_progress',
      'Editing': 'review',
      'Variations': 'review',
      'Ready to test': 'review',
      'Live': 'published'
    };
    return stageMap[stage] || 'draft';
  };

  // Auto-save functionality
  useEffect(() => {
    if (!editable || !isOnline) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      await autoSaveContent();
    }, 800); // Auto-save after 800ms of no changes

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    editable?.title, 
    editable?.notesHtml, 
    editable?.planning,
    editable?.shotList,
    editable?.editing,
    editable?.review,
    isOnline
  ]);

  const autoSaveContent = async () => {
    // Silent auto-save like Notion - no UI feedback or logging
    
    if (!editable) {
      return;
    }
    
    setIsAutoSaving(true);
    try {
      setError(""); // Clear any previous errors silently
      
      const actualContentId = editable?.id || contentId;
      
      if (actualContentId) {
        // Update existing content - only if we have a valid content ID
        await saveContentToDatabase();
        setLastSaved(new Date());
        
        // Refresh planning data from database
        await refreshPlanningData(actualContentId);
      } else {
        // Don't auto-save new content without explicit user action
        // This prevents creating duplicate entries when loading existing content
        console.log('⚠️ Skipping auto-save: No content ID found');
      }
      
      // Complete silence on successful saves
    } catch (err) {
      console.error('Auto-save failed:', err);
      // Silent failure - no user-facing error messages
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Refresh planning data from database after saving
  const refreshPlanningData = async (contentId) => {
    console.log('🔄 Refreshing planning data from database...');
    try {
      const planningData = await ContentService.getPlanningData(contentId);
      console.log('✅ Planning data refreshed:', planningData);
      
      setEditable(prev => ({
        ...prev,
        planning: planningData
      }));
    } catch (error) {
      console.error('❌ Failed to refresh planning data:', error);
    }
  };

  const saveContentToDatabase = async () => {
    console.log('💾 Saving content to database...');
    console.log('🆔 Editable ID:', editable?.id);
    console.log('🆔 ContentId state:', contentId);
    console.log('📊 Data to save:', {
      shotList: editable.shotList?.length || 0,
      editing: !!editable.editing,
      review: editable.review?.comments?.length || 0,
    });
    
    const actualContentId = editable?.id || contentId;
    if (!actualContentId) {
      console.log('❌ No content ID found (neither editable.id nor contentId), cannot save');
      return;
    }
    
    console.log('🎯 Using content ID for save:', actualContentId);

    console.log('💾 Saving content data for:', {
      contentId: actualContentId,
      hasPlanning: !!editable.planning,
      hasShotList: !!(editable.shotList && editable.shotList.length > 0),
      hasAttachments: !!(editable.attachments && editable.attachments.length > 0)
    });

    // Save basic content data
    await ContentService.updateContent(actualContentId, {
      title: editable.title,
      status: mapStageToDbStatus(editable.stage),
      platform: editable.format,
      metadata: {
        product: editable.product,
        notesHtml: editable.notesHtml,
        priority: editable.priority,
        deadline: editable.deadline,
        checklist: editable.checklist,
        lastUpdatedBy: "current_user" // Replace with actual user
      }
    });

    // Save planning data if available
    if (editable.planning) {
      await ContentService.savePlanningData(actualContentId, {
        concept: editable.planning.concept || '',
        hook: editable.planning.hook || '',
        body: editable.planning.body || '',
        cta: editable.planning.cta || ''
      });
    }

    // Save shot list if available
    if (editable.shotList && editable.shotList.length > 0) {
      await ContentService.saveShotList(actualContentId, editable.shotList.map((shot, index) => ({
        shot_number: index + 1,
        shot_type: shot.shot_type || '',
        description: shot.description || '',
        duration: shot.duration || null,
        location: shot.location || '',
        equipment: shot.equipment || [],
        notes: shot.notes || '',
        status: shot.status || 'planned',
        order_index: index,
        action: shot.action || '',
        camera: shot.camera || '',
        background: shot.background || '',
        overlays: shot.overlays || '', // Keep for backward compatibility
        assignee_id: shot.assignee_id || null,
        references: shot.references || [],
        completed: shot.completed || false,
        // NEW FIELDS
        props: shot.props || [],
        talent: shot.talent || '',
        lighting_notes: shot.lightingNotes || ''
      })));
    }

    // Save attachments separately
    if (editable.attachments && editable.attachments.length > 0) {
      await ContentService.saveAttachments(actualContentId, editable.attachments.map(att => ({
        fileName: att.name || att.fileName || 'untitled',
        filePath: att.path || att.filePath || '',
        fileType: att.type || att.fileType,
        fileSize: att.size || att.fileSize
      })));
    }

    // Save reference links as tags
    if (editable.referenceLinks && editable.referenceLinks.length > 0) {
      // Add new reference tags
      for (const link of editable.referenceLinks) {
        await ContentService.addTag(actualContentId, `ref:${link}`);
      }
    }
  };

  const createNewContentInDatabase = async () => {
    // DISABLED TO PREVENT DUPLICATES - ContentDetail should only work with existing content
    console.error('❌ createNewContentInDatabase called but DISABLED to prevent duplicates');
    console.error('❌ ContentDetail should only be used for existing content from Planning page');
    throw new Error('Content creation is disabled in ContentDetail to prevent duplicates');
  };

  const saveCard = async () => {
    console.log('💾 saveCard function called');
    console.log('📝 editable state:', editable);
    console.log('🆔 editable.id:', editable?.id);
    
    if (!editable) {
      console.log('❌ No editable data found!');
      return;
    }
    
    try {
      setError("");
      
      if (editable.id) {
        console.log('🔄 Updating existing content with ID:', editable.id);
        await saveContentToDatabase();
      } else {
        console.error('❌ No content ID found - cannot save');
        console.error('❌ ContentDetail should only work with existing content');
        throw new Error('Cannot save content without ID - ContentDetail should only work with existing content');
      }
      
      console.log('✅ Save completed successfully');
      setLastSaved(new Date());
      
      // Refresh planning data from database
      const actualContentId = editable?.id || contentId;
      if (actualContentId) {
        await refreshPlanningData(actualContentId);
      }
      
      toast({
        title: "Saved",
        description: "Your content has been saved successfully",
      });
    } catch (err) {
      console.error('Save failed:', err);
      setError('Failed to save content. Please try again.');
      
      // Run diagnostic tests when save fails
      console.log('🔬 Running diagnostic tests...');
      ContentService.testDatabaseConnection().then(dbTest => {
        console.log('Database connection test result:', dbTest);
      });
      ContentService.testPlanningDataTable().then(planningTest => {
        console.log('Planning data table test result:', planningTest);
      });
      
      toast({
        title: "Save failed",
        description: "Your content couldn't be saved. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteCard = async () => {
    if (!editable?.id) return;
    
    try {
      await ContentService.deleteContent(editable.id);
      navigate('/content/planning');
    } catch (err) {
      console.error('Delete failed:', err);
      setError('Failed to delete content. Please try again.');
    }
  };

  const StageProgressBar = ({ stage }) => (
    <div
      className="w-full h-3 bg-muted rounded-full overflow-hidden"
      title={`${stageIndex(stage) + 1}/${STAGES.length}`}
    >
      <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progressPct(stage)}%` }} />
    </div>
  );

  const AssigneePill = ({ id }) => {
    const t = teamById[id];
    if (!t) return null;
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs border border-border/50">
        <img src={t.avatar} alt={t.name} className="h-5 w-5 rounded-full border border-border/20" />
        <span className="font-medium">{t.name}</span>
      </span>
    );
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Content Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link to="/content/planning">
              <Button>Back to Content Planning</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => {
                setError("");
                setLoading(true);
                loadContent();
              }}
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!editable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Loading Content</h1>
          <p className="text-muted-foreground">Please wait while we load your content...</p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  const dl = deadlineInfo(editable.deadline);

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-3">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-start justify-between">
            {/* Left: Back link + Content Info */}
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <Link to="/content/planning">
                <Button variant="ghost" size="sm" className="gap-2 flex-shrink-0 mt-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                {/* Main title row with badges */}
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-foreground truncate">{editable.title}</h1>
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs font-medium">
                    {editable.format}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    dl.cls.includes('red') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : dl.cls.includes('yellow') 
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {dl.label}
                  </span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    {editable.stage}
                  </span>
                </div>
                {/* Essential metadata row - only show if we have valid data */}
                <div className="text-xs text-muted-foreground">
                  {editable.date && `Created on ${new Date(editable.date).toLocaleDateString()}`}
                  {editable.lastUpdated && (editable.date ? ' · ' : '') + `Last updated ${getTimeSince(editable.lastUpdated)}`}
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={saveCard}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p>Save changes</p>
                      <p className="text-xs text-muted-foreground">⌘S</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={deleteCard} 
                      className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p>Delete project</p>
                      <p className="text-xs text-muted-foreground">Esc to close</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-2">
            {/* Top Row: Back button + Title */}
            <div className="flex items-start gap-3">
              <Link to="/content/planning">
                <Button variant="ghost" size="sm" className="gap-2 flex-shrink-0 mt-1">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-foreground truncate leading-tight">{editable.title}</h1>
                {/* Badges row */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs font-medium">
                    {editable.format}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    dl.cls.includes('red') 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : dl.cls.includes('yellow') 
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {dl.label}
                  </span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs font-medium">
                    {editable.stage || 'Draft'}
                  </span>
                </div>
                {/* Essential metadata row - only show if we have valid data */}
                <div className="text-xs text-muted-foreground mt-1">
                  {editable.date && `Created on ${new Date(editable.date).toLocaleDateString()}`}
                  {editable.lastUpdated && (editable.date ? ' · ' : '') + `Last updated ${getTimeSince(editable.lastUpdated)}`}
                </div>
              </div>
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-end gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={saveCard}
                      size="sm" 
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Save className="h-4 w-4" />
                      Save
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p>Save changes</p>
                      <p className="text-xs text-muted-foreground">⌘S</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={deleteCard} 
                      className="gap-2 border-destructive/20 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <p>Delete project</p>
                      <p className="text-xs text-muted-foreground">Esc to close</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        {/* Subtle divider line */}
        <div className="border-b border-border/30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="basic-info" className="w-full">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl bg-muted/30 p-1 rounded-lg mb-8">
            <TabsTrigger value="basic-info" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Basic Info</TabsTrigger>
            <TabsTrigger value="planning" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Planning</TabsTrigger>
            <TabsTrigger value="shot-list" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Shoot Prep</TabsTrigger>
            <TabsTrigger value="raw-files" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Raw Files</TabsTrigger>
            <TabsTrigger value="editing" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Editing</TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-card data-[state=active]:shadow-sm text-xs sm:text-sm">Review</TabsTrigger>
          </TabsList>

          {/* TAB 1: BASIC INFO */}
          <TabsContent value="basic-info" className="space-y-8">
            {/* BASIC INFO */}
            <div className="enhanced-card p-6">
              <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
                📝 Basic Info
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={editable.title} onChange={(e) => setEditable({ ...editable, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">Content ID</Label>
                  <Input id="id" value={editable.id} disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date Created</Label>
                  <Input id="date" type="date" value={editable.date || ""} onChange={(e) => setEditable({ ...editable, date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input id="deadline" type="date" value={editable.deadline || ""} onChange={(e) => setEditable({ ...editable, deadline: e.target.value })} />
                </div>
              </div>
            </div>

            {/* CLASSIFICATION */}
            <div className="enhanced-card p-6">
              <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
                🏷️ Classification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Stage</Label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    value={editable.stage}
                    onChange={(e) => setEditable({ ...editable, stage: e.target.value })}
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    value={editable.format}
                    onChange={(e) => setEditable({ ...editable, format: e.target.value })}
                  >
                    {FORMATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product">Product</Label>
                  <Input id="product" value={editable.product} onChange={(e) => setEditable({ ...editable, product: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    value={editable.priority || "Medium"}
                    onChange={(e) => setEditable({ ...editable, priority: e.target.value })}
                  >
                    <option value="High">🔥 High</option>
                    <option value="Medium">⚖️ Medium</option>
                    <option value="Low">🕊️ Low</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Assigned To</Label>
                  <select
                    className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    value={editable.assignedTo || TEAM[0].id}
                    onChange={(e) => setEditable({ ...editable, assignedTo: e.target.value })}
                  >
                    {TEAM.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label>Progress</Label>
                  <StageProgressBar stage={editable.stage} />
                </div>
              </div>
            </div>

            {/* DETAILS */}
            <div className="enhanced-card p-6">
              <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
                📋 Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label>Notes (Rich Text)</Label>
                  <div
                    contentEditable
                    className="min-h-[120px] p-4 bg-card border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    onInput={(e) => setEditable({ ...editable, notesHtml: e.currentTarget.innerHTML })}
                    dangerouslySetInnerHTML={{ __html: editable.notesHtml || "" }}
                  />
                </div>

                {/* Reference Links */}
                <div className="space-y-2 md:col-span-2">
                  <Label>Reference Links</Label>
                  <Input
                    placeholder="https://... (press Enter to add)"
                    onKeyDown={(e) => {
                      const v = e.currentTarget.value.trim();
                      if (e.key === "Enter" && v) {
                        try {
                          new URL(v);
                          setEditable({
                            ...editable,
                            referenceLinks: [...(editable.referenceLinks || []), v],
                          });
                          e.currentTarget.value = "";
                        } catch (error) {
                          console.error('Invalid URL:', error);
                        }
                      }
                    }}
                  />
                  <ul className="mt-2 space-y-1">
                    {(editable.referenceLinks || []).map((link, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:text-primary/80 hover:underline truncate max-w-[85%] transition-colors"
                        >
                          {link}
                        </a>
                        <button
                          className="text-xs text-destructive hover:text-destructive/80 transition-colors"
                          onClick={() =>
                            setEditable({
                              ...editable,
                              referenceLinks: editable.referenceLinks.filter((_, idx) => idx !== i),
                            })
                          }
                        >
                          remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: PLANNING */}
          <TabsContent value="planning" className="space-y-8">
            {/* Concept Section */}
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  💡 Concept
                </h3>
                <span className="text-xs text-muted-foreground">The core idea and message</span>
              </div>
              <RichTextEditor
                content={editable?.planning?.concept || ''}
                onChange={(content) => setEditable({
                  ...editable,
                  planning: {
                    ...editable.planning,
                    concept: content
                  }
                })}
                placeholder="Describe the main concept, theme, or message for this content..."
                minHeight="120px"
              />
            </div>

            {/* Hook Section */}
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  🎣 Hook
                </h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Assist
                </Button>
              </div>
              <RichTextEditor
                content={editable?.planning?.hook || ''}
                onChange={(content) => setEditable({
                  ...editable,
                  planning: {
                    ...editable.planning,
                    hook: content
                  }
                })}
                placeholder="Write your compelling hook here..."
                minHeight="80px"
              />
            </div>

            {/* Body Section */}
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  📝 Body
                </h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Assist
                </Button>
              </div>
              <RichTextEditor
                content={editable?.planning?.body || ''}
                onChange={(content) => setEditable({
                  ...editable,
                  planning: {
                    ...editable.planning,
                    body: content
                  }
                })}
                placeholder="Develop your main content here..."
                minHeight="200px"
              />
            </div>

            {/* CTA Section */}
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  🎯 Call to Action
                </h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Assist
                </Button>
              </div>
              <RichTextEditor
                content={editable?.planning?.cta || ''}
                onChange={(content) => setEditable({
                  ...editable,
                  planning: {
                    ...editable.planning,
                    cta: content
                  }
                })}
                placeholder="Write your call to action..."
                minHeight="80px"
              />
            </div>
          </TabsContent>

          {/* TAB 3: SHOT LIST */}
          <TabsContent value="shot-list" className="space-y-4">
            <div className="enhanced-card p-4">
              {/* Header with Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">Shot List</h3>
                    {editable?.shotList && editable.shotList.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>
                          {editable.shotList.filter(shot => shot.completed).length} of {editable.shotList.length} shots completed
                        </span>
                      </div>
                    )}
                  </div>
                  <Button onClick={() => {
                    console.log('🎬 Add Shot clicked');
                    console.log('🎬 Current shotList:', editable?.shotList);
                    const newShot = {
                      id: `new_${Date.now()}`, // Use 'new_' prefix for new shots
                      shot_type: "",
                      description: "",
                      duration: null,
                      location: "",
                      equipment: [],
                      notes: "",
                      status: "planned",
                      camera: "",
                      action: "",
                      background: "",
                      overlays: "", // Keep for backward compatibility
                      assignee_id: null,
                      references: [],
                      completed: false,
                      order: (editable?.shotList || []).length,
                      // NEW FIELDS
                      props: [],
                      talent: "",
                      lightingNotes: ""
                    };
                    console.log('🎬 New shot to add:', newShot);
                    const updatedEditable = {
                      ...editable,
                      shotList: [...(editable?.shotList || []), newShot]
                    };
                    console.log('🎬 Updated shotList:', updatedEditable.shotList);
                    setEditable(updatedEditable);
                  }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Shot
                  </Button>
                </div>
                
                {/* Progress Bar */}
                {editable?.shotList && editable.shotList.length > 0 && (
                  <div className="w-full bg-secondary rounded-full h-2 mb-1">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ 
                        width: `${Math.round((editable.shotList.filter(shot => shot.completed).length / editable.shotList.length) * 100)}%`
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Shot List */}
              <div className="space-y-3">
                {editable?.shotList?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-6 border-2 border-dashed border-border rounded-lg">
                    <div className="space-y-1">
                      <p>No shots added yet</p>
                      <p className="text-sm">Click "Add Shot" to create your first shot</p>
                    </div>
                  </div>
                ) : (
                  editable?.shotList?.map((shot) => (
                    <ShotListItem
                      key={shot.id}
                      shot={shot}
                      onUpdate={(id, updates) => {
                        setEditable({
                          ...editable,
                          shotList: editable.shotList.map(s => 
                            s.id === id ? { ...s, ...updates } : s
                          )
                        });
                      }}
                      onDelete={async (id) => {
                        console.log('🎬 DELETE HANDLER - Shot ID to delete:', id);
                        console.log('🎬 DELETE HANDLER - Current shotList:', editable.shotList.map(s => ({
                          id: s.id,
                          description: s.description,
                          order: s.order
                        })));
                        
                        const shotToDelete = editable.shotList.find(s => s.id === id);
                        console.log('🎬 DELETE HANDLER - Found shot to delete:', shotToDelete);
                        
                        try {
                          // Only delete from database if it has a real database ID (not new_ prefix)
                          if (typeof id === 'string' && id.startsWith('new_')) {
                            console.log('🎬 DELETE HANDLER - Skipping database delete for new shot');
                          } else {
                            console.log('🎬 DELETE HANDLER - Deleting from database');
                            await ContentService.deleteShotById(id);
                          }
                          
                          // Then remove from frontend state
                          const newShotList = editable.shotList.filter(s => s.id !== id);
                          console.log('🎬 DELETE HANDLER - New shotList after filter:', newShotList.map(s => ({
                            id: s.id,
                            description: s.description,
                            order: s.order
                          })));
                          
                          setEditable({
                            ...editable,
                            shotList: newShotList
                          });
                          
                          console.log('✅ Shot deleted successfully');
                        } catch (error) {
                          console.error('❌ Failed to delete shot:', error);
                          // You might want to show a toast notification here
                          // For now, we'll still remove from frontend to prevent UI inconsistency
                          setEditable({
                            ...editable,
                            shotList: editable.shotList.filter(s => s.id !== id)
                          });
                        }
                      }}
                      teamMembers={TEAM}
                    />
                  ))
                )}
              </div>
              
              {/* Progress Summary */}
              {editable?.shotList?.length > 0 && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress:</span>
                    <span className="font-medium">
                      {editable.shotList.filter(shot => shot.completed).length} / {editable.shotList.length} shots completed
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-300"
                      style={{
                        width: `${(editable.shotList.filter(shot => shot.completed).length / editable.shotList.length) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 4: RAW FILES */}
          <TabsContent value="raw-files" className="space-y-4">
            {/* Enhanced Files Management with integrated upload */}
            <div className="enhanced-card p-6">
              <EnhancedRawFilesGrid
                contentId={(contentId || editable?.id) || 'temp'}
                files={memoizedRawFiles}
                onFilesChange={handleRawFilesChanged}
                onFilesUploaded={handleRawFilesUploaded}
                loading={rawFilesLoading}
                onRefresh={loadRawFiles}
                uploadDisabled={!(contentId || editable?.id)}
              />
              
              {!(contentId || editable?.id) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                  <p>⚠️ Please save this content first to enable file uploads</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 5: EDITING */}
          <TabsContent value="editing" className="space-y-6">
            {/* Editing Guide */}
            <div className="enhanced-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Editing Guide</h3>
              <Textarea
                value={editable?.editing?.guide || ''}
                onChange={(e) => setEditable({
                  ...editable,
                  editing: {
                    ...editable.editing,
                    guide: e.target.value
                  }
                })}
                placeholder="Add editing instructions, style guidelines, brand requirements, or any notes for the editor..."
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Deliverables Table */}
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Deliverables</h3>
                <Button 
                  onClick={() => {
                    const newDeliverable = {
                      id: Date.now(),
                      version: 'v1',
                      type: '',
                      resolution: '',
                      length: '',
                      link: '',
                      notes: '',
                      uploadedAt: new Date().toISOString(),
                      status: 'pending'
                    };
                    setEditable({
                      ...editable,
                      editing: {
                        ...editable.editing,
                        deliverables: [...(editable?.editing?.deliverables || []), newDeliverable]
                      }
                    });
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Deliverable
                </Button>
              </div>

              {editable?.editing?.deliverables?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                  <div className="space-y-2">
                    <p>No deliverables added yet</p>
                    <p className="text-sm">Click "Add Deliverable" to upload your first edit</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 font-medium text-sm">Version</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Type</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Resolution</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Length</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Link</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Notes</th>
                        <th className="text-left py-3 px-2 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editable?.editing?.deliverables?.map((deliverable, index) => (
                        <tr key={deliverable.id} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-2">
                            <Input
                              value={deliverable.version}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, version: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="h-8 text-sm"
                              placeholder="v1"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <select
                              value={deliverable.type}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, type: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="w-full h-8 text-sm border border-border rounded px-2 bg-card"
                            >
                              <option value="">Select type...</option>
                              <option value="final">Final Cut</option>
                              <option value="rough">Rough Cut</option>
                              <option value="teaser">Teaser</option>
                              <option value="social">Social Media</option>
                              <option value="thumbnail">Thumbnail</option>
                              <option value="other">Other</option>
                            </select>
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={deliverable.resolution}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, resolution: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="h-8 text-sm"
                              placeholder="1920x1080"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={deliverable.length}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, length: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="h-8 text-sm"
                              placeholder="2:30"
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={deliverable.link}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, link: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="h-8 text-sm"
                              placeholder="https://..."
                            />
                          </td>
                          <td className="py-3 px-2">
                            <Input
                              value={deliverable.notes}
                              onChange={(e) => {
                                const updated = editable.editing.deliverables.map(d =>
                                  d.id === deliverable.id ? { ...d, notes: e.target.value } : d
                                );
                                setEditable({
                                  ...editable,
                                  editing: { ...editable.editing, deliverables: updated }
                                });
                              }}
                              className="h-8 text-sm"
                              placeholder="Notes..."
                            />
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              {deliverable.link && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(deliverable.link, '_blank')}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const updated = editable.editing.deliverables.filter(d => d.id !== deliverable.id);
                                  setEditable({
                                    ...editable,
                                    editing: { ...editable.editing, deliverables: updated }
                                  });
                                }}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 6: REVIEW */}
          <TabsContent value="review" className="space-y-6">
            <div className="enhanced-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Review & Comments
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant={commentFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCommentFilter('all')}
                  >
                    All ({(editable?.review?.comments || []).length})
                  </Button>
                  <Button
                    variant={commentFilter === 'unresolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCommentFilter('unresolved')}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Unresolved ({(editable?.review?.comments || []).filter(c => !c.resolved).length})
                  </Button>
                  <Button
                    variant={commentFilter === 'resolved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCommentFilter('resolved')}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Resolved ({(editable?.review?.comments || []).filter(c => c.resolved).length})
                  </Button>
                </div>
              </div>

              {/* Add New Comment */}
              <div className="border border-border rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment or feedback... Use @username to mention team members"
                      className="min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Paperclip className="h-4 w-4 mr-1" />
                      Attach
                    </Button>
                    <Button variant="ghost" size="sm">
                      <AtSign className="h-4 w-4 mr-1" />
                      Mention
                    </Button>
                  </div>
                  <Button 
                    onClick={() => {
                      if (newComment.trim()) {
                        const comment = {
                          id: Date.now(),
                          text: newComment,
                          author: "Current User", // Replace with actual user
                          avatar: "https://i.pravatar.cc/100?img=1",
                          createdAt: new Date().toISOString(),
                          resolved: false,
                          attachments: [],
                          replies: []
                        };
                        setEditable({
                          ...editable,
                          review: {
                            ...editable.review,
                            comments: [...(editable?.review?.comments || []), comment]
                          }
                        });
                        setNewComment('');
                        toast({
                          title: "Comment added",
                          description: "Your comment has been posted",
                        });
                      }
                    }}
                    disabled={!newComment.trim()}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    Post Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {(() => {
                  const filteredComments = (editable?.review?.comments || []).filter(comment => {
                    if (commentFilter === 'resolved') return comment.resolved;
                    if (commentFilter === 'unresolved') return !comment.resolved;
                    return true;
                  });

                  if (filteredComments.length === 0) {
                    return (
                      <div className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-lg">
                        <div className="space-y-2">
                          <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p>{commentFilter === 'all' ? 'No comments yet' : `No ${commentFilter} comments`}</p>
                          <p className="text-sm">
                            {commentFilter === 'all' ? 'Start the conversation by adding the first comment' : 'Switch to "All" to see other comments'}
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return filteredComments.map((comment) => (
                    <div key={comment.id} className={`border rounded-lg p-4 ${comment.resolved ? 'bg-green-50/50 border-green-200' : 'bg-card border-border'}`}>
                      <div className="flex items-start gap-3">
                        <img 
                          src={comment.avatar} 
                          alt={comment.author}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                            {comment.resolved && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                                <Check className="h-3 w-3" />
                                Resolved
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-foreground mb-3 whitespace-pre-wrap">
                            {comment.text}
                          </div>
                          
                          {/* Comment Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updated = editable.review.comments.map(c =>
                                  c.id === comment.id ? { ...c, resolved: !c.resolved } : c
                                );
                                setEditable({
                                  ...editable,
                                  review: { ...editable.review, comments: updated }
                                });
                                toast({
                                  title: comment.resolved ? "Comment reopened" : "Comment resolved",
                                  description: comment.resolved ? "Comment marked as unresolved" : "Comment marked as resolved",
                                });
                              }}
                              className="h-7 text-xs gap-1"
                            >
                              {comment.resolved ? (
                                <>
                                  <Clock className="h-3 w-3" />
                                  Reopen
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3" />
                                  Resolve
                                </>
                              )}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              Reply
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const updated = editable.review.comments.filter(c => c.id !== comment.id);
                                setEditable({
                                  ...editable,
                                  review: { ...editable.review, comments: updated }
                                });
                              }}
                              className="h-7 text-xs text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}