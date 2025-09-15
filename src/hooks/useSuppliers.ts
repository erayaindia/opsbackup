import { useQuery } from "@tanstack/react-query";
import { getVendors, getVendorById, searchVendors, Vendor, getSuppliers, getSupplierById, searchSuppliers, Supplier } from "@/services/supplierService";

// Export types for both vendors and suppliers (backward compatibility)
export type { Vendor, Supplier };

// Query keys
const QUERY_KEYS = {
  vendors: ["vendors"] as const,
  vendor: (id: string) => ["vendors", id] as const,
  search: (query: string) => ["vendors", "search", query] as const,
  // Backward compatibility
  suppliers: ["vendors"] as const,
  supplier: (id: string) => ["vendors", id] as const,
};

// Get all active vendors
export const useVendorsQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.vendors,
    queryFn: getVendors,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

// Get vendor by ID
export const useVendorQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.vendor(id),
    queryFn: () => getVendorById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Search vendors
export const useSearchVendorsQuery = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchVendors(query),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Backward compatibility - suppliers (using vendor functions)
export const useSuppliersQuery = () => {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers,
    queryFn: getSuppliers,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useSupplierQuery = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: () => getSupplierById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchSuppliersQuery = (query: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.search(query),
    queryFn: () => searchSuppliers(query),
    enabled: query.length > 2, // Only search if query is at least 3 characters
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Main exports (vendors)
export const useVendors = useVendorsQuery;
export const useVendor = useVendorQuery;
export const useSearchVendors = useSearchVendorsQuery;

// Backward compatibility exports (suppliers)
export const useSuppliers = useSuppliersQuery;
export const useSupplier = useSupplierQuery;
export const useSearchSuppliers = useSearchSuppliersQuery;
