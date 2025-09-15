# Invoice Management System

A comprehensive invoice management system built with React, TypeScript, Tailwind CSS, shadcn/ui, TanStack Table, and TanStack Query.

## 🚀 Features

### Core Functionality
- **Invoice Table**: Responsive table with server-side pagination, sorting, and filtering
- **Advanced Filters**: Status, type, ITC eligibility, GST type, date ranges, and text search
- **Bulk Actions**: Approve, mark paid, void, delete, and export multiple invoices
- **Quick View**: Drawer with detailed invoice information and inline file preview
- **Status Management**: Workflow-based status management (draft → pending → approved → paid)
- **Payment Tracking**: Partial and full payment tracking with automatic status updates

### UI/UX Features
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Keyboard Navigation**: ⌘/Ctrl+K for search, Enter for quick view, P for payments
- **Saved Views**: Predefined filters (Overdue, This Month, GST Review)
- **Column Chooser**: Show/hide columns dynamically
- **Visual Indicators**: Overdue highlighting, payment status dots, colored badges
- **Accessibility**: Full ARIA support, screen reader friendly

### Data Management
- **Mock API**: Complete mock service with realistic data
- **TanStack Query**: Optimistic updates, caching, and error handling
- **Real-time Updates**: Automatic refresh after mutations
- **Data Validation**: Zod schemas for type safety and validation

## 📁 Project Structure

```
src/
├── components/
│   ├── invoices/
│   │   ├── columns.tsx              # Table column definitions
│   │   ├── data-table.tsx           # Main data table component
│   │   ├── toolbar.tsx              # Filters, search, and bulk actions
│   │   ├── quick-view.tsx           # Invoice detail drawer
│   │   ├── approve-dialog.tsx       # Approval confirmation
│   │   ├── payment-dialog.tsx       # Payment form
│   │   ├── edit-dialog.tsx          # Edit invoice form
│   │   └── file-preview-dialog.tsx  # PDF/file preview
│   └── ui/                          # shadcn/ui components
├── pages/
│   └── finance/
│       └── Invoices.tsx             # Main invoices page
├── hooks/
│   └── useInvoices.ts               # TanStack Query hooks
├── lib/
│   ├── api/
│   │   └── invoices-client.ts       # API client (mock/real)
│   └── mocks/
│       └── invoices.ts              # Mock data service
├── types/
│   └── invoice.types.ts             # TypeScript types and schemas
└── utils/
    └── invoice-utils.ts             # Utility functions
```

## 🛠 Setup Instructions

### 1. Install Dependencies

```bash
npm install @tanstack/react-query @tanstack/react-table
npm install @hookform/resolvers react-hook-form zod
npm install date-fns
npm install sonner  # For toast notifications
```

### 2. Configure TanStack Query

Add QueryClient provider to your app root:

```tsx
// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
    </QueryClientProvider>
  );
}
```

### 3. Add Route

```tsx
// Add to your routing configuration
<Route path="account/invoices" element={
  <PermissionGuard requiredModule="finance">
    <Invoices />
  </PermissionGuard>
} />
```

### 4. Environment Variables

No environment variables required for mock mode. For production:

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🎨 Tailwind Configuration

Ensure your `tailwind.config.js` includes the invoice-specific colors:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Status colors
        slate: { /* ... */ },
        amber: { /* ... */ },
        blue: { /* ... */ },
        violet: { /* ... */ },
        green: { /* ... */ },
        gray: { /* ... */ },
        // Type colors
        orange: { /* ... */ },
        purple: { /* ... */ },
      }
    }
  }
}
```

## 📊 Database Schema

### Single Table Design (MVP)

```sql
CREATE TYPE invoice_status AS ENUM (
  'draft', 'pending_approval', 'approved', 'part_paid', 'paid', 'void'
);

CREATE TYPE invoice_type AS ENUM (
  'stock', 'expense', 'service', 'capex'
);

CREATE TABLE invoices (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Invoice details
  invoice_number TEXT NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  type invoice_type NOT NULL,

  -- Vendor details (snapshot, no joins)
  vendor_name TEXT NOT NULL,
  vendor_gstin TEXT NOT NULL,
  vendor_contact TEXT,

  -- Dates
  bill_date DATE NOT NULL,
  due_date DATE NOT NULL,

  -- Details
  reason TEXT NOT NULL,
  notes_internal TEXT,

  -- Currency
  currency TEXT NOT NULL DEFAULT 'INR',
  exchange_rate NUMERIC(12,6) DEFAULT 1,

  -- Money (before tax)
  subtotal NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  freight_amount NUMERIC(12,2) DEFAULT 0,
  other_charges NUMERIC(12,2) DEFAULT 0,
  taxable_value NUMERIC(12,2) NOT NULL,

  -- GST (India)
  cgst NUMERIC(12,2) DEFAULT 0,
  sgst NUMERIC(12,2) DEFAULT 0,
  igst NUMERIC(12,2) DEFAULT 0,
  gst_scheme TEXT,
  place_of_supply TEXT,
  itc_eligible BOOLEAN DEFAULT true,

  -- Adjustments & Totals
  tcs NUMERIC(12,2) DEFAULT 0,
  tds NUMERIC(12,2) DEFAULT 0,
  round_off NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  amount_due NUMERIC(12,2) GENERATED ALWAYS AS (grand_total - amount_paid) STORED,

  -- File attachments
  file_url TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  ocr_text TEXT,
  parsed_json JSONB,

  -- Audit
  created_by UUID NOT NULL,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT positive_amounts CHECK (
    subtotal >= 0 AND discount_amount >= 0 AND freight_amount >= 0 AND
    other_charges >= 0 AND taxable_value >= 0 AND cgst >= 0 AND
    sgst >= 0 AND igst >= 0 AND tcs >= 0 AND tds >= 0 AND
    grand_total >= 0 AND amount_paid >= 0
  ),
  CONSTRAINT gst_exclusivity CHECK (
    (igst > 0 AND cgst = 0 AND sgst = 0) OR
    (igst = 0 AND cgst >= 0 AND sgst >= 0)
  ),
  CONSTRAINT unique_vendor_invoice UNIQUE (vendor_gstin, invoice_number)
);

-- Indexes
CREATE INDEX idx_invoices_status_due_date ON invoices (status, due_date);
CREATE INDEX idx_invoices_bill_date ON invoices (bill_date);
CREATE INDEX idx_invoices_vendor_name ON invoices (vendor_name);
CREATE INDEX idx_invoices_search ON invoices USING GIN (
  to_tsvector('simple', invoice_number || ' ' || vendor_name || ' ' || reason || ' ' || COALESCE(ocr_text, ''))
);

-- Triggers
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();
```

## 🔐 RLS Policies (Supabase)

```sql
-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Admin: Full access
CREATE POLICY "admin_full_access" ON invoices
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Finance: Read + Update (approve/pay/edit) + Insert
CREATE POLICY "finance_read_write" ON invoices
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'finance')
  );

CREATE POLICY "finance_insert" ON invoices
  FOR INSERT WITH CHECK (
    auth.jwt() ->> 'role' IN ('admin', 'finance')
  );

CREATE POLICY "finance_update" ON invoices
  FOR UPDATE USING (
    auth.jwt() ->> 'role' IN ('admin', 'finance')
  );

-- Operations: Read only
CREATE POLICY "ops_read_only" ON invoices
  FOR SELECT USING (
    auth.jwt() ->> 'role' IN ('admin', 'finance', 'ops')
  );
```

## 🔄 API Endpoints

### REST API Structure

```
GET    /api/invoices              # List with pagination, filters, search
POST   /api/invoices              # Create new invoice
GET    /api/invoices/:id          # Get single invoice
PATCH  /api/invoices/:id          # Update invoice
DELETE /api/invoices/:id          # Delete invoice
PATCH  /api/invoices/:id/approve  # Approve invoice
PATCH  /api/invoices/:id/pay      # Mark payment
PATCH  /api/invoices/:id/void     # Void invoice
GET    /api/invoices/summary      # Get summary statistics
```

### Query Parameters

```typescript
// GET /api/invoices
interface QueryParams {
  page?: number;           // Page number (1-based)
  pageSize?: number;       // Items per page
  sort?: string;           // Sort field
  order?: 'asc' | 'desc';  // Sort direction

  // Filters
  status?: string[];       // Multiple statuses
  type?: string;           // Invoice type
  vendor?: string;         // Vendor name filter
  search?: string;         // Global search
  bill_date_from?: string; // ISO date
  bill_date_to?: string;   // ISO date
  due_date_from?: string;  // ISO date
  due_date_to?: string;    // ISO date
  itc_eligible?: boolean;  // ITC filter
  gst_type?: 'IGST' | 'CGST_SGST';
  only_due?: boolean;      // Only outstanding amounts
}
```

## 🧪 Testing

### Mock Data

The system includes comprehensive mock data with:

- 50 realistic invoices
- All status types (draft, pending, approved, part_paid, paid, void)
- All invoice types (stock, expense, service, capex)
- Both IGST and CGST+SGST scenarios
- ITC eligible and non-eligible invoices
- Overdue and current invoices
- Partial payments
- File attachments

### Usage

```tsx
// Switch between mock and real API
// In src/lib/api/invoices-client.ts
const USE_MOCK = true; // Change to false for real API
```

## 🎯 Keyboard Shortcuts

- `⌘/Ctrl + K`: Focus search input
- `Enter`: Open quick view for selected row
- `P`: Open payment dialog (when invoice is selected and eligible)
- `A`: Approve selected invoice (when eligible)
- `Escape`: Close modals/drawers

## 🎨 Status Colors

```css
/* Status badge colors */
.draft { @apply bg-slate-50 text-slate-700 border-slate-200; }
.pending_approval { @apply bg-amber-50 text-amber-700 border-amber-200; }
.approved { @apply bg-blue-50 text-blue-700 border-blue-200; }
.part_paid { @apply bg-violet-50 text-violet-700 border-violet-200; }
.paid { @apply bg-green-50 text-green-700 border-green-200; }
.void { @apply bg-gray-50 text-gray-700 border-gray-200; }

/* Type badge colors */
.stock { @apply bg-blue-50 text-blue-700 border-blue-200; }
.expense { @apply bg-orange-50 text-orange-700 border-orange-200; }
.service { @apply bg-purple-50 text-purple-700 border-purple-200; }
.capex { @apply bg-green-50 text-green-700 border-green-200; }
```

## 🔧 Customization

### Adding New Filters

1. Update `InvoiceFilters` type in `invoice.types.ts`
2. Add filter UI in `toolbar.tsx`
3. Update `applyFilters` function in `invoices.ts`
4. Add backend support in API routes

### Adding New Columns

1. Add to `hiddenColumns` array in `columns.tsx`
2. Update column chooser to include new column
3. Ensure data is available in mock/API

### Custom Actions

1. Add new mutation hook in `useInvoices.ts`
2. Add action button in column actions dropdown
3. Create new dialog/modal component
4. Update API client and mock service

## 🚀 Performance Optimizations

- **Virtual Scrolling**: For large datasets (not implemented in MVP)
- **Debounced Search**: Search input has 300ms debounce
- **Optimistic Updates**: UI updates immediately, reverts on error
- **Query Caching**: 5-minute stale time for invoice lists
- **Lazy Loading**: Modals and drawers load content on demand
- **Memoization**: Column definitions and handlers are memoized

## 📱 Responsive Design

- **Mobile**: Stacked layout, condensed columns, touch-friendly
- **Tablet**: Balanced layout with collapsible filters
- **Desktop**: Full-featured layout with all columns visible

## 🔒 Security

- **Input Validation**: All forms use Zod schemas
- **XSS Prevention**: All user input is properly escaped
- **CSRF Protection**: API calls include CSRF tokens
- **File Upload**: Restricted file types and size limits
- **RLS**: Database-level security policies

## 🚀 Deployment

### Frontend
```bash
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend (Supabase)
1. Run SQL migrations in Supabase dashboard
2. Configure storage bucket for file uploads
3. Set up RLS policies
4. Configure environment variables

## 📈 Future Enhancements

### Phase 2 Features
- **OCR Integration**: Automatic data extraction from uploaded invoices
- **Approval Workflows**: Multi-step approval chains
- **Payment Integration**: Connect with accounting systems
- **Notifications**: Email/SMS alerts for due dates
- **Reporting**: Advanced analytics and reporting
- **Audit Trail**: Complete change history
- **Bulk Import**: CSV/Excel import functionality
- **Templates**: Invoice templates and auto-fill

### Technical Improvements
- **Virtual Scrolling**: Handle thousands of invoices
- **Offline Support**: PWA with offline capabilities
- **Real-time Updates**: WebSocket connections
- **Advanced Search**: Elasticsearch integration
- **File Processing**: Background OCR and data extraction
- **Caching**: Redis for improved performance

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed
2. **Type Errors**: Check TypeScript configuration
3. **Style Issues**: Verify Tailwind CSS setup
4. **Query Errors**: Check TanStack Query configuration

### Debug Mode

Enable debug logging:
```tsx
const queryClient = new QueryClient({
  logger: {
    log: console.log,
    warn: console.warn,
    error: console.error,
  },
});
```

## 📚 Resources

- [TanStack Table Documentation](https://tanstack.com/table/v8)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

This invoice management system provides a solid foundation for handling invoice workflows with room for extensive customization and scaling.