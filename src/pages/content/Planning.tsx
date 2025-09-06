import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { ContentService } from "@/services/contentService";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

// helpers
const stageIndex = (stage) => Math.max(0, STAGES.indexOf(stage));
const progressPct = (stage) => ((stageIndex(stage) + 1) / STAGES.length) * 100;

// Generate URL-friendly slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

const todayYMD = () => new Date().toISOString().slice(0, 10);
const daysBetween = (a, b) => {
  if (!a || !b) return NaN;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
};
const deadlineInfo = (deadline) => {
  if (!deadline) return { label: "No deadline", cls: "bg-gray-200 text-gray-700" };
  const diff = daysBetween(deadline, todayYMD());
  if (diff < 0) return { label: "Overdue", cls: "bg-red-100 text-red-700 border border-red-200" };
  if (diff <= 3) return { label: `Due in ${diff}d`, cls: "bg-yellow-100 text-yellow-700 border border-yellow-200" };
  return { label: `Due in ${diff}d`, cls: "bg-green-100 text-green-700 border border-green-200" };
};

export default function ContentCalendar() {
  const navigate = useNavigate();
  
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);


  // Filters
  const [stageFilter, setStageFilter] = useState("All");
  const [formatFilter, setFormatFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // View mode + sorting
  const [viewMode, setViewMode] = useState("cards");
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");

  // New Idea modal state
  const [newOpen, setNewOpen] = useState(false);
  const [newData, setNewData] = useState({
    title: "",
    stage: STAGES[0],
    date: "",
    product: "",
    format: FORMATS[0],
    notesHtml: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "",
    attachments: [],
    checklist: [],
    referenceLinks: [],
    ideaRows: [],
  });

  // Load users from profiles table
  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('Loading users from profiles table...');
      
      const usersData = await ContentService.getAllUsers();
      console.log('Raw users data:', usersData);
      
      const transformedUsers = usersData.map(user => ({
        id: user.user_id,
        name: user.name || user.email || 'Unknown User',
        avatar: user.avatar_url || `https://i.pravatar.cc/100?u=${user.user_id}`,
        email: user.email,
        role: user.role
      }));
      
      console.log('Transformed users:', transformedUsers);
      
      setUsers(transformedUsers);
      setUsersById(Object.fromEntries(transformedUsers.map((u) => [u.id, u])));
      
      // Set default assignedTo to first user if available
      if (transformedUsers.length > 0 && !newData.assignedTo) {
        setNewData(prev => ({ ...prev, assignedTo: transformedUsers[0].id }));
      }
      
    } catch (err) {
      console.error('Error loading users:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      // Fallback to empty users list
      setUsers([]);
      setUsersById({});
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load content from Supabase on mount
  useEffect(() => {
    // Test database connection first
    ContentService.testDatabaseConnection();
    loadContent();
    loadUsers();
  }, []);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log('📥 Loading content from database...');
      
      const contentItems = await ContentService.getContentList();
      console.log('📊 Raw content items from database:', contentItems);
      console.log('📈 Number of items retrieved:', contentItems?.length || 0);
      
      // Transform Supabase data to match existing card structure
      const transformedCards = contentItems.map((item, index) => ({
        id: index + 1, // Sequential ID for display (1, 2, 3, 4, 5...)
        databaseId: item.id, // Keep original database ID for operations
        title: item.title,
        stage: mapDbStatusToStage(item.status),
        date: item.created_at ? new Date(item.created_at).toISOString().slice(0, 10) : todayYMD(),
        product: item.metadata?.product || "Unknown Product",
        format: item.platform || "Video",
        notesHtml: item.metadata?.notesHtml || "",
        assignedTo: item.content_team_assignments?.[0]?.user_id || "",
        priority: item.metadata?.priority || "Medium",
        deadline: item.metadata?.deadline || "",
        // Extract structured data from database tables
        attachments: item.content_attachments || [],
        checklist: item.metadata?.checklist || [],
        referenceLinks: item.content_tags?.filter(tag => tag.tag.startsWith('ref:')).map(tag => tag.tag.slice(4)) || item.metadata?.referenceLinks || [],
        ideaRows: item.content_hooks?.sort((a, b) => a.order_index - b.order_index).map(hook => ({
          type: hook.hook_type,
          text: hook.text
        })) || [],
        lastUpdated: item.updated_at || "",
        lastUpdatedBy: item.metadata?.lastUpdatedBy || "",
      }));
      
      console.log('🔄 Transformed cards for display:', transformedCards);
      console.log('🎯 Setting cards state with', transformedCards.length, 'items');
      
      // DEBUG: Log each card's ID mapping
      transformedCards.forEach((card, index) => {
        console.log(`Card ${index}: Display ID=${card.id}, Database ID=${card.databaseId}, Title="${card.title}"`);
      });
      
      setCards(transformedCards);
    } catch (err) {
      console.error('Error loading content:', err);
      setError('Failed to load content. Please try again.');
      
      // Try to migrate localStorage data as fallback
      try {
        const migrationResult = await ContentService.migrateFromLocalStorage();
        if (migrationResult.success) {
          loadContent(); // Reload after migration
        }
      } catch (migrationErr) {
        console.error('Migration failed:', migrationErr);
      }
    } finally {
      setIsLoading(false);
    }
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


  const addCardFromForm = async () => {
    console.log('🚀 Starting content creation with data:', newData);
    
    if (!newData.title || !newData.product) {
      console.log('❌ Validation failed: Missing title or product');
      return;
    }
    
    try {
      setIsCreating(true);
      setError("");
      
      console.log('📝 Calling ContentService.createContentWithStructuredData...');
      
      // Create content with structured data using enhanced method
      const result = await ContentService.createContentWithStructuredData({
        title: newData.title,
        status: mapStageToDbStatus(newData.stage),
        platform: newData.format,
        product: newData.product,
        priority: newData.priority,
        deadline: newData.deadline,
        notesHtml: newData.notesHtml,
        assignedTo: newData.assignedTo,
        date: newData.date, // Add missing date field
        checklist: newData.checklist, // Add missing checklist field
        ideaRows: newData.ideaRows,
        attachments: newData.attachments,
        referenceLinks: newData.referenceLinks,
      });
      
      console.log('✅ Content created successfully:', result);
      console.log('🔄 Reloading content list...');
      
      // Reload content list
      await loadContent();
      
      console.log('✅ Content list reloaded successfully');
      
      // Reset form and close modal
      setNewOpen(false);
      setNewData({
        title: "",
        stage: STAGES[0],
        date: "",
        product: "",
        format: FORMATS[0],
        notesHtml: "",
        assignedTo: "",
        priority: "Medium",
        deadline: "",
        attachments: [],
        checklist: [],
        referenceLinks: [],
        ideaRows: [],
      });
      
    } catch (err) {
      console.error('Error creating content:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(`Failed to create content: ${err.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteContent = async (contentId, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(contentId);
      setError("");
      
      await ContentService.deleteContent(contentId);
      
      // Reload content list
      await loadContent();
      
    } catch (err) {
      console.error('Error deleting content:', err);
      setError('Failed to delete content. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const sidebarItemCls = (active) =>
    `cursor-pointer hover:text-primary px-3 py-2 rounded-lg transition-all duration-200 ${
      active ? "bg-primary/10 text-primary font-semibold border border-primary/20" : "text-muted-foreground hover:bg-muted/50"
    }`;

  const matchesSearch = (c) =>
    searchTerm.trim() === "" ||
    c.id.toString().includes(searchTerm.toLowerCase()) ||
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.format.toLowerCase().includes(searchTerm.toLowerCase());

  const filteredCards = useMemo(
    () =>
      cards.filter((c) => {
        const byStage = stageFilter === "All" || c.stage === stageFilter;
        const byFormat = formatFilter === "All" || c.format === formatFilter;
        const bySearch = matchesSearch(c);
        return byStage && byFormat && bySearch;
      }),
    [cards, stageFilter, formatFilter, searchTerm]
  );

  const stageCounts = useMemo(() => {
    const map = Object.fromEntries(STAGES.map((s) => [s, 0]));
    cards.forEach((c) => {
      const byFormat = formatFilter === "All" || c.format === formatFilter;
      if (byFormat && matchesSearch(c)) map[c.stage] = (map[c.stage] || 0) + 1;
    });
    const all = Object.values(map).reduce((a, b) => a + b, 0);
    return { map, all };
  }, [cards, formatFilter, searchTerm]);

  const formatCounts = useMemo(() => {
    const map = Object.fromEntries(FORMATS.map((f) => [f, 0]));
    cards.forEach((c) => {
      const byStage = stageFilter === "All" || c.stage === stageFilter;
      if (byStage && matchesSearch(c)) map[c.format] = (map[c.format] || 0) + 1;
    });
    const all = Object.values(map).reduce((a, b) => a + b, 0);
    return { map, all };
  }, [cards, stageFilter, searchTerm]);

  const sortedCards = useMemo(() => {
    const arr = [...filteredCards];
    arr.sort((a, b) => {
      const A = (a[sortKey] ?? "").toString().toLowerCase();
      const B = (b[sortKey] ?? "").toString().toLowerCase();
      if (A < B) return sortDir === "asc" ? -1 : 1;
      if (A > B) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredCards, sortKey, sortDir]);

  const SortBtn = ({ k, children }) => (
    <button
      onClick={() => {
        if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        else {
          setSortKey(k);
          setSortDir("asc");
        }
      }}
      className="flex items-center gap-1 hover:underline"
    >
      {children}
      {sortKey === k && <span className="text-xs">{sortDir === "asc" ? "▲" : "▼"}</span>}
    </button>
  );

  const formatWithIcon = (f) => ({
    Video: "🎬 Video",
    Static: "🖼️ Static",
    AI: "🤖 AI",
    Animated: "🎞️ Animated",
    "3D": "🧊 3D",
  }[f] || f);

  const AssigneePill = ({ id }) => {
    if (!id) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs border border-border/50">
          <span className="font-medium">Unassigned</span>
        </span>
      );
    }
    
    const user = usersById[id];
    if (!user) {
      return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs border border-border/50">
          <span className="font-medium">Unknown User</span>
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs border border-border/50">
        <img src={user.avatar} alt={user.name} className="h-5 w-5 rounded-full border border-border/20" />
        <span className="font-medium">{user.name}</span>
      </span>
    );
  };

  const StageProgressBar = ({ stage }) => (
    <div
      className="w-full h-2 bg-muted rounded-full overflow-hidden"
      title={`${stageIndex(stage) + 1}/${STAGES.length}`}
    >
      <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${progressPct(stage)}%` }} />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
        <div className="flex">
          {/* Filters Sidebar - Now secondary to content navigation */}
          <aside className="w-64 bg-muted/30 border-r border-border hidden lg:block">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Stage</h3>
                <button
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                  onClick={() => setStageFilter("All")}
                >
                  Reset
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                <li
                  className={sidebarItemCls(stageFilter === "All")}
                  onClick={() => setStageFilter("All")}
                >
                  All ({stageCounts.all})
                </li>
                {STAGES.map((s) => (
                  <li
                    key={s}
                    className={sidebarItemCls(stageFilter === s)}
                    onClick={() => setStageFilter(s)}
                  >
                    {s} ({stageCounts.map[s] || 0})
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Content Format</h3>
                <button
                  className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                  onClick={() => setFormatFilter("All")}
                >
                  Reset
                </button>
              </div>
              <ul className="space-y-1 text-sm">
                <li
                  className={sidebarItemCls(formatFilter === "All")}
                  onClick={() => setFormatFilter("All")}
                >
                  All ({formatCounts.all})
                </li>
                {FORMATS.map((f) => (
                  <li
                    key={f}
                    className={sidebarItemCls(formatFilter === f)}
                    onClick={() => setFormatFilter(f)}
                  >
                    {f} ({formatCounts.map[f] || 0})
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Modern Header Section */}
            <div className="border-b border-border pb-6">
              {/* Desktop Layout */}
              <div className="hidden md:flex items-center justify-between mb-6">
                {/* Left: Title & Description */}
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-bold text-foreground font-poppins">Content Planning</h1>
                  <p className="text-muted-foreground mt-1">Plan, organize, and track your content creation workflow</p>
                </div>

                {/* Center: Stats & Filters */}
                <div className="flex flex-col items-center gap-2 px-8 text-center">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{filteredCards.length}</span> items
                    {(stageFilter !== "All" || formatFilter !== "All") && " (filtered)"}
                  </div>
                  {(stageFilter !== "All" || formatFilter !== "All") && (
                    <button
                      className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors"
                      onClick={() => {
                        setStageFilter("All");
                        setFormatFilter("All");
                        setSearchTerm("");
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Button 
                    onClick={() => setNewOpen(true)} 
                    className="btn-animated shadow-sm"
                    disabled={isLoading}
                  >
                    + New Idea
                  </Button>
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden space-y-4 mb-6">
                {/* Top Row: Title & Stats */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-2xl font-bold text-foreground font-poppins">Content Planning</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Plan and track your content workflow</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
                    <span><span className="font-medium">{filteredCards.length}</span> items</span>
                    {(stageFilter !== "All" || formatFilter !== "All") && (
                      <button
                        className="text-xs text-primary hover:text-primary/80 hover:underline"
                        onClick={() => {
                          setStageFilter("All");
                          setFormatFilter("All");
                          setSearchTerm("");
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Action Button */}
                <div className="flex justify-start">
                  <Button 
                    onClick={() => setNewOpen(true)} 
                    className="btn-animated shadow-sm"
                    disabled={isLoading}
                  >
                    + New Idea
                  </Button>
                </div>
              </div>

              {/* Search & View Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by ID, Title, or Format..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 shadow-sm"
                  />
                </div>
                <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "cards" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                Card View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === "table" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                Table View
              </button>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading content...</span>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              {sortedCards.map((card) => {
                const dl = deadlineInfo(card.deadline);
                return (
                  <Card
                    key={card.databaseId}
                    onClick={() => {
                      // Store the card data in localStorage for ContentDetail to access
                      // Use databaseId as id for ContentDetail compatibility
                      const contentForDetail = { ...card, id: card.databaseId };
                      console.log('🖱️ Card clicked:', {
                        displayId: card.id,
                        databaseId: card.databaseId,
                        title: card.title,
                        contentForDetail: contentForDetail
                      });
                      localStorage.setItem('currentContent', JSON.stringify(contentForDetail));
                      console.log('💾 Stored in localStorage:', localStorage.getItem('currentContent'));
                      navigate(`/${generateSlug(card.title)}`);
                    }}
                    className="enhanced-card hover:shadow-elegant transition-all duration-300 cursor-pointer border-border/50 backdrop-blur-sm animate-fade-in"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${dl.cls.includes('red') ? 'bg-destructive/10 text-destructive border border-destructive/20' : dl.cls.includes('yellow') ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'}`}>
                          {dl.label}
                        </span>
                        <AssigneePill id={card.assignedTo} />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-md border border-primary/20">
                          {card.stage}
                        </div>
                        <span className="text-xs text-muted-foreground">{card.date}</span>
                      </div>
                      <h2 className="text-lg font-semibold text-foreground line-clamp-2">{card.title}</h2>
                      <StageProgressBar stage={card.stage} />
                      <div className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-border/50">
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">ID:</span> {card.id}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Product:</span> {card.product}
                        </p>
                        <p className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Format:</span> 
                          <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-md text-xs">
                            {card.format}
                          </span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="overflow-auto bg-card rounded-xl shadow-soft border border-border/50">
              <table className="w-full text-sm">
                <thead className="text-left border-b bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-foreground">
                      <SortBtn k="id">ID</SortBtn>
                    </th>
                    <th className="px-6 py-4 font-semibold text-foreground">
                      <SortBtn k="title">Title</SortBtn>
                    </th>
                    <th className="px-6 py-4 font-semibold text-foreground">Stage</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Deadline</th>
                    <th className="px-6 py-4 font-semibold text-foreground">
                      <SortBtn k="product">Product</SortBtn>
                    </th>
                    <th className="px-6 py-4 font-semibold text-foreground">
                      <SortBtn k="format">Format</SortBtn>
                    </th>
                    <th className="px-6 py-4 font-semibold text-foreground">Assignee</th>
                    <th className="px-6 py-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCards.map((row) => {
                    const dl = deadlineInfo(row.deadline);
                    return (
                      <tr key={row.databaseId} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium">{row.id}</td>
                        <td className="px-6 py-4">
                          <button className="hover:text-primary hover:underline transition-colors font-medium" onClick={() => {
                            // Use databaseId as id for ContentDetail compatibility
                            const contentForDetail = { ...row, id: row.databaseId };
                            localStorage.setItem('currentContent', JSON.stringify(contentForDetail));
                            navigate(`/${generateSlug(row.title)}`);
                          }}>
                            {row.title}
                          </button>
                        </td>
                        <td className="px-6 py-4">{row.stage}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${dl.cls.includes('red') ? 'bg-destructive/10 text-destructive border border-destructive/20' : dl.cls.includes('yellow') ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-success/10 text-success border border-success/20'}`}>{dl.label}</span>
                        </td>
                        <td className="px-6 py-4">{row.product}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs">
                            {row.format}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <AssigneePill id={row.assignedTo} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="outline" onClick={() => {
                              // Use databaseId as id for ContentDetail compatibility
                              const contentForDetail = { ...row, id: row.databaseId };
                              localStorage.setItem('currentContent', JSON.stringify(contentForDetail));
                              navigate(`/${generateSlug(row.title)}`);
                            }} className="shadow-sm">
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              onClick={() => deleteContent(row.databaseId, row.title)}
                              disabled={deletingId === row.databaseId}
                              className="shadow-sm"
                            >
                              {deletingId === row.databaseId ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </main>
        </div>

        {/* New Idea Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-border/50 shadow-elegant bg-card">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-xl font-semibold text-foreground">✨ New Idea</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                placeholder="e.g., Surprise Him – Eye Photo Necklace"
                value={newData.title}
                onChange={(e) => setNewData({ ...newData, title: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="new-date">Date</Label>
              <Input
                id="new-date"
                type="date"
                value={newData.date}
                onChange={(e) => setNewData({ ...newData, date: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Stage</Label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={newData.stage}
                onChange={(e) => setNewData({ ...newData, stage: e.target.value })}
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label>Format</Label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={newData.format}
                onChange={(e) => setNewData({ ...newData, format: e.target.value })}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="new-product">Product</Label>
              <Input
                id="new-product"
                placeholder="e.g., Photo Necklace"
                value={newData.product}
                onChange={(e) => setNewData({ ...newData, product: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Priority</Label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={newData.priority}
                onChange={(e) => setNewData({ ...newData, priority: e.target.value })}
              >
                <option value="High">🔥 High</option>
                <option value="Medium">⚖️ Medium</option>
                <option value="Low">🕊️ Low</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Assigned To</Label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 bg-card focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                value={newData.assignedTo}
                onChange={(e) => setNewData({ ...newData, assignedTo: e.target.value })}
                disabled={isLoadingUsers}
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} {user.email ? `(${user.email})` : ''}
                  </option>
                ))}
              </select>
              {isLoadingUsers && (
                <p className="text-xs text-muted-foreground">Loading users...</p>
              )}
            </div>

            {/* Reference Links in New Idea */}
            <div className="space-y-1 md:col-span-2">
              <Label>Reference Links (Notion/Drive)</Label>
              <Input
                placeholder="https://... (press Enter to add)"
                onKeyDown={(e) => {
                  const v = (e.currentTarget as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    try {
                      new URL(v);
                      setNewData({
                        ...newData,
                        referenceLinks: [...(newData.referenceLinks || []), v],
                      });
                      (e.currentTarget as HTMLInputElement).value = "";
                    } catch (error) {
                      console.error('Invalid URL:', error);
                    }
                  }
                }}
              />
              <ul className="mt-2 space-y-1">
                {(newData.referenceLinks || []).map((link, i) => (
                  <li key={i} className="text-sm text-muted-foreground truncate bg-muted/30 px-2 py-1 rounded border border-border/50">
                    {link}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button variant="secondary" onClick={() => setNewOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button 
              onClick={addCardFromForm} 
              disabled={!newData.title || !newData.product || isCreating} 
              className="btn-animated"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
  );
}