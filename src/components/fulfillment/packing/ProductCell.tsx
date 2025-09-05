import { PackingOrder } from "@/lib/fulfillment/packingManager";

interface ProductCellProps {
  order: PackingOrder;
  onClick: (src: string, alt: string) => void;
}

export function ProductCell({ order, onClick }: ProductCellProps) {
  const hasImage = order.mainPhoto && order.mainPhoto !== 'Missing photo';
  
  return (
    <div className="flex items-center gap-3">
      {/* Thumbnail */}
      <button
        onClick={() => hasImage && onClick(order.mainPhoto!, `${order.productName} main photo`)}
        className="relative w-12 h-12 rounded-lg overflow-hidden ring-1 ring-[var(--line)] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 hover:scale-105"
        aria-label="Open image preview"
        disabled={!hasImage}
      >
        {hasImage ? (
          <img 
            src={order.mainPhoto} 
            alt={`${order.productName} main photo`} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-[var(--line)] flex items-center justify-center">
            <span className="text-[var(--muted)] text-xs">No Image</span>
          </div>
        )}
      </button>
      
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <div 
          className="font-medium text-[var(--ink)] truncate whitespace-nowrap overflow-hidden" 
          title={order.productName}
        >
          {order.productName}
        </div>
        
        {/* Meta Pills */}
        <div className="flex items-center gap-1 mt-1">
          {order.variant && (
            <span className="text-xs rounded-full px-2 py-[2px] bg-[var(--line)] text-[var(--muted)]">
              {order.variant}
            </span>
          )}
          {order.sku && (
            <span className="text-xs rounded-full px-2 py-[2px] bg-[var(--line)] text-[var(--muted)]">
              {order.sku}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}