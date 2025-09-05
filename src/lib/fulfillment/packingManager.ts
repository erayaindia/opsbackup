import * as XLSX from 'xlsx';

export interface PackingOrder {
  id: string;
  orderNumber: string;
  productName: string;
  variant?: string;
  color?: string;
  mainPhoto?: string;
  polaroids?: string[];
  backEngravingType?: string;
  backEngravingValue?: string;
  status: 'pending' | 'packed' | 'dispute' | 'missing-photo' | 'invalid';
  packer?: string;
  packedAt?: Date;
  customer?: string;
  sku?: string;
  quantity?: number;
  notes?: string;
  mainPhotoStatus?: 'success' | 'invalid' | 'missing';
  polaroidCount?: number;
}

export interface PackingFilters {
  search: string;
  status: string;
  packer: string;
  sku: string;
  variant?: string;
}

export interface PackingSortConfig {
  field: keyof PackingOrder;
  direction: 'asc' | 'desc';
}

export class PackingManager {
  private orders: PackingOrder[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  // Event handling
  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this.listeners.forEach(listener => listener());
  }

  // Storage management
  private saveToStorage() {
    localStorage.setItem('packing-orders', JSON.stringify(this.orders));
    localStorage.setItem('packing-last-updated', new Date().toISOString());
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('packing-orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.orders = parsed.map((order: any) => ({
          ...order,
          packedAt: order.packedAt ? new Date(order.packedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Failed to load packing orders from storage:', error);
    }
  }

  // File parsing
  async parseFile(file: File): Promise<PackingOrder[]> {
    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit');
    }

    let data: any[][];
    
    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text = await file.text();
        data = this.parseCSV(text);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
      }
    } catch (error) {
      throw new Error('Failed to parse file: ' + (error as Error).message);
    }

    if (data.length === 0) {
      throw new Error('File is empty');
    }

    const headers = data[0] as string[];
    const rows = data.slice(1);

    // Auto-detect column mappings
    const columnMap = this.detectColumns(headers);
    
    const orders: PackingOrder[] = rows
      .filter(row => row.some(cell => cell !== undefined && cell !== ''))
      .map((row, index) => {
        const order: Partial<PackingOrder> = {
          id: `order-${Date.now()}-${index}`,
          status: 'pending'
        };

        Object.entries(columnMap).forEach(([field, columnIndex]) => {
          if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            const value = String(row[columnIndex]).trim();
            
            if (field === 'polaroids' && value) {
              // Handle multiple formats: CSV, semicolon, pipe, or JSON array
              order[field] = this.parsePolaroids(value);
            } else if (field === 'quantity') {
              order[field] = parseInt(value) || 1;
            } else if (value) {
              (order as any)[field] = value;
            }
          }
        });

        // Derive Main Photo Status
        order.mainPhotoStatus = this.deriveMainPhotoStatus(order.mainPhoto);
        
        // Derive Polaroid Count
        order.polaroidCount = (order.polaroids || []).length;

        // Validate required fields
        if (!order.orderNumber || !order.productName) {
          order.status = 'invalid';
        } else if (order.mainPhotoStatus === 'missing') {
          order.status = 'missing-photo';
        }

        return order as PackingOrder;
      });

    return orders;
  }

  private parseCSV(text: string): any[][] {
    // Auto-detect delimiter
    const delimiters = [',', ';', '\t'];
    let bestDelimiter = ',';
    let maxColumns = 0;
    
    for (const delimiter of delimiters) {
      const firstLine = text.split('\n')[0];
      const columnCount = firstLine.split(delimiter).length;
      if (columnCount > maxColumns) {
        maxColumns = columnCount;
        bestDelimiter = delimiter;
      }
    }
    
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === bestDelimiter && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      
      return values.map(val => val.replace(/^"|"$/g, ''));
    });
  }

  private parsePolaroids(value: string): string[] {
    try {
      // Try parsing as JSON array first
      const jsonArray = JSON.parse(value);
      if (Array.isArray(jsonArray)) {
        return jsonArray.filter(url => this.isValidUrl(url));
      }
    } catch {
      // Not JSON, try other separators
    }
    
    // Try various separators
    const separators = [',', ';', '|', '\n'];
    let urls: string[] = [];
    
    for (const separator of separators) {
      if (value.includes(separator)) {
        urls = value.split(separator)
          .map(url => url.trim())
          .filter(url => url && this.isValidUrl(url));
        break;
      }
    }
    
    // If no separator found, treat as single URL
    if (urls.length === 0 && this.isValidUrl(value)) {
      urls = [value];
    }
    
    return urls;
  }

  private isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private deriveMainPhotoStatus(mainPhoto?: string): 'success' | 'invalid' | 'missing' {
    if (!mainPhoto || mainPhoto.trim() === '' || mainPhoto.toLowerCase() === 'missing photo') {
      return 'missing';
    }
    
    return this.isValidUrl(mainPhoto) ? 'success' : 'invalid';
  }

  private detectColumns(headers: string[]): Record<string, number> {
    // Normalize headers: trim whitespace and convert to lowercase for matching
    const normalizedHeaders = headers.map(h => String(h || '').trim().toLowerCase());
    
    const patterns = {
      orderNumber: /order.?number|order.?id|order(?!\s*photo)/i,
      productName: /product.?name|product(?!\s*code)|item(?!\s*code)|title/i,
      variant: /variant|variation|option/i,
      color: /color|colour/i,
      mainPhoto: /main.?photo|main.?image|photo(?!.*polaroid)(?!.*additional)|picture(?!.*polaroid)/i,
      polaroids: /polaroid|additional.?photo|extra.?image|secondary.?photo/i,
      backEngravingType: /back.?engraving.?type|engraving.?type/i,
      backEngravingValue: /back.?engraving.?value|back.?engraving(?!.*type)|engraving.?value|engraving(?!.*type)/i,
      customer: /customer|buyer|client.?name/i,
      sku: /sku|product.?code|item.?code/i,
      quantity: /quantity|qty|amount|count/i,
      packer: /packer|assigned.?to|operator|worker/i,
      notes: /notes|comments|remarks|memo/i,
      status: /status|state/i,
      mainPhotoStatus: /main.?photo.?status|photo.?status/i,
      polaroidCount: /polaroid.?count|additional.?photo.?count/i
    };

    const columnMap: Record<string, number> = {};

    Object.entries(patterns).forEach(([field, pattern]) => {
      const index = normalizedHeaders.findIndex(header => pattern.test(header));
      columnMap[field] = index;
    });

    return columnMap;
  }

  // Order management
  setOrders(orders: PackingOrder[]) {
    this.orders = orders;
    this.saveToStorage();
    this.emit();
  }

  addOrders(newOrders: PackingOrder[]) {
    this.orders = [...this.orders, ...newOrders];
    this.saveToStorage();
    this.emit();
  }

  updateOrder(id: string, updates: Partial<PackingOrder>) {
    const index = this.orders.findIndex(order => order.id === id);
    if (index !== -1) {
      this.orders[index] = { ...this.orders[index], ...updates };
      this.saveToStorage();
      this.emit();
    }
  }

  updateOrderStatus(id: string, status: PackingOrder['status'], packer?: string) {
    const updates: Partial<PackingOrder> = { status };
    
    if (status === 'packed') {
      updates.packedAt = new Date();
      if (packer) updates.packer = packer;
    }
    
    this.updateOrder(id, updates);
    
    // Emit changes for real-time updates
    this.emit();
  }

  bulkUpdateStatus(ids: string[], status: PackingOrder['status'], packer?: string) {
    ids.forEach(id => this.updateOrderStatus(id, status, packer));
  }

  deleteOrder(id: string) {
    this.orders = this.orders.filter(order => order.id !== id);
    this.saveToStorage();
    this.emit();
  }

  clearAllOrders() {
    this.orders = [];
    this.saveToStorage();
    this.emit();
  }

  // Data access with filtering and sorting
  getOrders(
    filters: Partial<PackingFilters> = {},
    sort?: PackingSortConfig,
    page = 1,
    pageSize = 50
  ) {
    let filtered = this.orders;

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(search) ||
        order.productName.toLowerCase().includes(search) ||
        order.variant?.toLowerCase().includes(search) ||
        order.customer?.toLowerCase().includes(search) ||
        order.sku?.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.packer && filters.packer !== 'all') {
      filtered = filtered.filter(order => order.packer === filters.packer);
    }

    if (filters.sku && filters.sku !== 'all') {
      filtered = filtered.filter(order => order.sku === filters.sku);
    }

    if (filters.variant && filters.variant !== 'all') {
      filtered = filtered.filter(order => order.variant === filters.variant);
    }

    // Apply sorting
    if (sort) {
      filtered.sort((a, b) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];
        
        if (aVal === undefined && bVal === undefined) return 0;
        if (aVal === undefined) return 1;
        if (bVal === undefined) return -1;
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply pagination
    const start = (page - 1) * pageSize;
    const paginatedOrders = filtered.slice(start, start + pageSize);

    return {
      orders: paginatedOrders,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
      currentPage: page,
      pageSize
    };
  }

  getAllOrders() {
    return this.orders;
  }

  getUniqueValues(field: keyof PackingOrder): string[] {
    const values = this.orders
      .map(order => order[field])
      .filter(value => value !== undefined && value !== '')
      .map(value => String(value));
    
    return [...new Set(values)].sort();
  }

  // Export functionality
  exportToCSV(orders: PackingOrder[]): string {
    if (orders.length === 0) return '';

    const headers = [
      'Order Number',
      'Product Name',
      'Variant',
      'Color',
      'Status',
      'Packer',
      'Customer',
      'SKU',
      'Quantity',
      'Main Photo',
      'Main Photo Status',
      'Polaroids',
      'Polaroid Count',
      'Back Engraving Type',
      'Back Engraving Value',
      'Packed At',
      'Notes'
    ];

    const rows = orders.map(order => [
      order.orderNumber,
      order.productName,
      order.variant || '',
      order.color || '',
      order.status,
      order.packer || '',
      order.customer || '',
      order.sku || '',
      order.quantity || '',
      order.mainPhoto || '',
      order.mainPhotoStatus || '',
      order.polaroids?.join('; ') || '',
      order.polaroidCount || 0,
      order.backEngravingType || '',
      order.backEngravingValue || '',
      order.packedAt?.toISOString() || '',
      order.notes || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    return csvContent;
  }

  // Generate filename for export
  getExportFilename(prefix = 'orders'): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
    return `${prefix}_filtered_${date}_${time}.csv`;
  }

  // Statistics
  getStats() {
    const total = this.orders.length;
    const pending = this.orders.filter(o => o.status === 'pending').length;
    const packed = this.orders.filter(o => o.status === 'packed').length;
    const disputes = this.orders.filter(o => o.status === 'dispute').length;
    const invalid = this.orders.filter(o => o.status === 'invalid').length;
    const missingPhoto = this.orders.filter(o => o.status === 'missing-photo').length;

    return {
      total,
      pending,
      packed,
      disputes,
      invalid,
      missingPhoto,
      packedPercentage: total > 0 ? Math.round((packed / total) * 100) : 0
    };
  }

  // Get filtered count for display
  getFilteredStats(filteredOrders: PackingOrder[]) {
    const total = filteredOrders.length;
    const pending = filteredOrders.filter(o => o.status === 'pending').length;
    const packed = filteredOrders.filter(o => o.status === 'packed').length;
    const disputes = filteredOrders.filter(o => o.status === 'dispute').length;
    const invalid = filteredOrders.filter(o => o.status === 'invalid').length;
    const missingPhoto = filteredOrders.filter(o => o.status === 'missing-photo').length;

    return {
      total,
      pending,
      packed,
      disputes,
      invalid,
      missingPhoto,
      packedPercentage: total > 0 ? Math.round((packed / total) * 100) : 0
    };
  }
}

// Singleton instance
export const packingManager = new PackingManager();