import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProductSelectorProps } from "../types";

// Common product names for quick selection
const COMMON_PRODUCTS = [
  "Summer Collection",
  "Winter Boots",
  "Skincare Line",
  "Athletic Wear",
  "Smart Watch",
  "Gift Sets",
  "Makeup Kit",
  "Coffee Blend",
  "Home Decor Collection",
  "Youth Fashion",
  "Beauty Products"
];

/**
 * ProductSelector - Inline product name selector for uploads
 * Shows common products and allows custom input
 */
export const ProductSelector: React.FC<ProductSelectorProps> = ({
  onSelect,
  onCancel
}) => {
  const [customProduct, setCustomProduct] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);

  const handleProductSelect = (productName: string) => {
    onSelect(productName);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customProduct.trim()) {
      onSelect(customProduct.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div 
      className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg p-3"
      onKeyDown={handleKeyDown}
    >
      <div className="text-xs font-medium text-foreground mb-2">
        Select Product for Upload
      </div>

      {!isCustomMode ? (
        <div className="space-y-2">
          {/* Common Products Grid */}
          <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
            {COMMON_PRODUCTS.map((product) => (
              <button
                key={product}
                onClick={() => handleProductSelect(product)}
                className="text-left text-xs px-2 py-1 rounded hover:bg-muted transition-colors truncate"
                title={product}
              >
                {product}
              </button>
            ))}
          </div>

          {/* Custom Product Option */}
          <div className="pt-2 border-t">
            <button
              onClick={() => setIsCustomMode(true)}
              className="text-xs text-primary hover:text-primary/80 font-medium"
            >
              + Add Custom Product
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="space-y-2">
          <Input
            type="text"
            placeholder="Enter product name..."
            value={customProduct}
            onChange={(e) => setCustomProduct(e.target.value)}
            className="text-xs h-8"
            autoFocus
          />
          <div className="flex gap-1">
            <Button 
              type="submit" 
              size="sm" 
              className="text-xs h-6 px-2"
              disabled={!customProduct.trim()}
            >
              Add
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsCustomMode(false)}
              className="text-xs h-6 px-2"
            >
              Back
            </Button>
          </div>
        </form>
      )}

      {/* Cancel Button */}
      <div className="pt-2 border-t mt-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCancel}
          className="text-xs h-6 px-2 text-muted-foreground"
        >
          Cancel Upload
        </Button>
      </div>
    </div>
  );
};