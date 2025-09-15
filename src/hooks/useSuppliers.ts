import { useQuery } from "@tanstack/react-query";
import { getSuppliers, getSupplierById, searchSuppliers, Supplier } from "@/services/supplierService";

// Export Supplier type for backward compatibility
export type { Supplier };

// Query keys
const QUERY_KEYS = {
  suppliers: ["suppliers"] as const,
  supplier: (id: string) => ["suppliers", id] as const,
  search: (query: string) => ["suppliers", "search", query] as const,
};

// Get all active suppliers
export const useSuppliersQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: getSuppliers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get supplier by ID
export const useSupplierQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: () => getSupplierById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Search suppliers
export const useSearchSuppliersQuery = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchSuppliers(query),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Backward compatibility export
export const useSuppliers = useSuppliersQuery;
