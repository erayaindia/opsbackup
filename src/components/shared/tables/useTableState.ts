import { useState, useEffect, useMemo } from 'react';

export interface TableState<T> {
  // Pagination
  currentPage: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (items: number) => void;

  // Sorting
  sortField: string;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: string) => void;
  getSortIcon: (field: string) => React.ReactNode;

  // Filtering & Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filters: Record<string, any>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;

  // Processed data
  filteredData: T[];
  paginatedData: T[];

  // Pagination info
  totalPages: number;
  startIndex: number;
  endIndex: number;
}

interface UseTableStateOptions<T> {
  data: T[];
  defaultSortField?: string;
  defaultSortDirection?: 'asc' | 'desc';
  defaultItemsPerPage?: number;
  searchFields?: (keyof T)[];
  filterConfig?: {
    [key: string]: {
      field: keyof T;
      transform?: (value: any) => any;
    };
  };
}

export function useTableState<T extends Record<string, any>>(
  options: UseTableStateOptions<T>
): TableState<T> {
  const {
    data = [],
    defaultSortField = '',
    defaultSortDirection = 'asc',
    defaultItemsPerPage = 25,
    searchFields = [],
    filterConfig = {}
  } = options;

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDirection);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});

  // Sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string): React.ReactNode => {
    if (sortField !== field) {
      return null; // Will be handled by the component that uses this
    }
    return sortDirection; // Return direction for component to render icon
  };

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  // Data processing
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Search filter
    if (searchTerm && searchFields.length > 0) {
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value &&
            String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Custom filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (filterValue && filterValue !== 'all' && filterConfig[key]) {
        const config = filterConfig[key];
        filtered = filtered.filter(item => {
          const itemValue = config.transform
            ? config.transform(item[config.field])
            : item[config.field];

          if (Array.isArray(filterValue)) {
            return filterValue.includes(itemValue);
          }
          return itemValue === filterValue;
        });
      }
    });

    // Sort data
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortField];
        let bValue: any = b[sortField];

        // Handle different data types
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, searchFields, filters, filterConfig, sortField, sortDirection]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(startIndex + itemsPerPage - 1, filteredData.length);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // Update items per page and reset to first page
  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return {
    // Pagination
    currentPage,
    itemsPerPage,
    setCurrentPage,
    setItemsPerPage: handleItemsPerPageChange,

    // Sorting
    sortField,
    sortDirection,
    handleSort,
    getSortIcon,

    // Filtering & Search
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,

    // Processed data
    filteredData,
    paginatedData,

    // Pagination info
    totalPages,
    startIndex,
    endIndex
  };
}