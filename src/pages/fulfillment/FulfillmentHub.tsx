import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Package, 
  AlertTriangle, 
  Camera, 
  Printer, 
  ClipboardList, 
  RotateCcw, 
  Database,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { FulfillmentHeader } from "@/components/fulfillment/FulfillmentHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const fulfillmentTools = [
  {
    name: "Packing",
    slug: "packing",
    icon: Package,
    description: "Upload & preview orders, mark packed, export filtered CSV",
    status: "active"
  },
  {
    name: "Disputes",
    slug: "disputes",
    icon: AlertTriangle,
    description: "Flag/resolve issues and manage customer disputes",
    status: "coming-soon"
  },
  {
    name: "Quality Check",
    slug: "quality-check",
    icon: Camera,
    description: "Photo & engraving verification for quality control",
    status: "coming-soon"
  },
  {
    name: "Label Printing",
    slug: "label-printing",
    icon: Printer,
    description: "Batch label generation and printing management",
    status: "coming-soon"
  },
  {
    name: "Pick Lists",
    slug: "pick-lists",
    icon: ClipboardList,
    description: "SKU-wise pick sheets and inventory picking",
    status: "coming-soon"
  },
  {
    name: "RTO/NDR",
    slug: "rto-ndr",
    icon: RotateCcw,
    description: "Returns & non-delivery management",
    status: "coming-soon"
  },
  {
    name: "Inventory Sync",
    slug: "inventory-sync",
    icon: Database,
    description: "Stock updates and inventory synchronization",
    status: "coming-soon"
  }
];

const kpiData = [
  {
    title: "Today's Orders",
    value: "247",
    icon: TrendingUp,
    trend: "+12%",
    color: "text-primary"
  },
  {
    title: "Pending Fulfillment",
    value: "89",
    icon: Clock,
    trend: "-5%",
    color: "text-warning"
  },
  {
    title: "Disputes",
    value: "3",
    icon: AlertCircle,
    trend: "0%",
    color: "text-destructive"
  },
  {
    title: "Packed Today",
    value: "158",
    icon: CheckCircle,
    trend: "+8%",
    color: "text-success"
  }
];

export default function FulfillmentHub() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [lastOpenedTool, setLastOpenedTool] = useState<string | null>(null);

  useEffect(() => {
    const lastTool = localStorage.getItem("fulfillment-last-tool");
    setLastOpenedTool(lastTool);
  }, []);

  const filteredTools = fulfillmentTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToolClick = (tool: typeof fulfillmentTools[0]) => {
    if (tool.status === "active") {
      localStorage.setItem("fulfillment-last-tool", tool.slug);
      navigate(`/fulfillment/${tool.slug}`);
    }
  };

  const handleResumeLastTool = () => {
    if (lastOpenedTool) {
      navigate(`/fulfillment/${lastOpenedTool}`);
    }
  };

  return (
    <div className="h-full">
      <FulfillmentHeader
        title="Fulfillment"
        showSearch
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search tools by name..."
      />

      <div className="p-6 space-y-6">
        {/* KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiData.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.title} className="enhanced-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {kpi.title}
                      </p>
                      <p className="text-2xl font-bold">{kpi.value}</p>
                      <p className={`text-xs ${kpi.color}`}>
                        {kpi.trend} from yesterday
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${kpi.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Resume Last Tool */}
        {lastOpenedTool && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Resume your work</h3>
                  <p className="text-sm text-muted-foreground">
                    Continue with {fulfillmentTools.find(t => t.slug === lastOpenedTool)?.name}
                  </p>
                </div>
                <Button onClick={handleResumeLastTool} variant="outline">
                  Resume last tool
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTools.map((tool) => {
            const Icon = tool.icon;
            const isActive = tool.status === "active";
            
            return (
              <Card 
                key={tool.slug} 
                className={`enhanced-card transition-all duration-200 ${
                  isActive ? "cursor-pointer hover:shadow-lg hover:-translate-y-1" : "opacity-75"
                }`}
                onClick={() => handleToolClick(tool)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-8 w-8 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    <Badge 
                      variant={isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {isActive ? "Available" : "Coming Soon"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{tool.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-sm leading-relaxed">
                    {tool.description}
                  </CardDescription>
                  <div className="mt-4">
                    <Button 
                      className="w-full" 
                      variant={isActive ? "default" : "secondary"}
                      disabled={!isActive}
                    >
                      {isActive ? "Open" : "Coming Soon"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold">No tools found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}