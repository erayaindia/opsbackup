import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { Settings2 } from "lucide-react";

export interface ColumnVisibility {
  polaroids: boolean;
  engrValue: boolean;
  sku: boolean;
  packer: boolean;
}

interface ColumnVisibilityProps {
  visibility: ColumnVisibility;
  onVisibilityChange: (visibility: ColumnVisibility) => void;
}

const defaultVisibility: ColumnVisibility = {
  polaroids: true,
  engrValue: true,
  sku: true,
  packer: true
};

export function ColumnVisibilityControl({ visibility, onVisibilityChange }: ColumnVisibilityProps) {
  const toggleColumn = (column: keyof ColumnVisibility) => {
    const newVisibility = {
      ...visibility,
      [column]: !visibility[column]
    };
    onVisibilityChange(newVisibility);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Settings2 className="w-4 h-4 mr-2" />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuCheckboxItem
          checked={visibility.polaroids}
          onCheckedChange={() => toggleColumn('polaroids')}
        >
          Polaroids
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.engrValue}
          onCheckedChange={() => toggleColumn('engrValue')}
        >
          Engr. Value
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.sku}
          onCheckedChange={() => toggleColumn('sku')}
        >
          SKU
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={visibility.packer}
          onCheckedChange={() => toggleColumn('packer')}
        >
          Packer
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useColumnVisibility(): [ColumnVisibility, (visibility: ColumnVisibility) => void] {
  const [visibility, setVisibility] = useState<ColumnVisibility>(() => {
    try {
      const saved = localStorage.getItem('ordersTable.columns');
      return saved ? JSON.parse(saved) : defaultVisibility;
    } catch {
      return defaultVisibility;
    }
  });
  
  const updateVisibility = (newVisibility: ColumnVisibility) => {
    setVisibility(newVisibility);
    localStorage.setItem('ordersTable.columns', JSON.stringify(newVisibility));
  };
  
  return [visibility, updateVisibility];
}