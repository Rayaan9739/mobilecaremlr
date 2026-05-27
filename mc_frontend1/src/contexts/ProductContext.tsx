import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import api from "@/lib/api";

// Cross-tab and cross-component sync event name
const SYNC_EVENT_NAME = "mc-data-sync";

export interface Category {
  id: string;
  name: string;
  displayName: string;
}

export interface ProductStorageVariant {
  storage: string;
  originalPrice?: number;
  sellingPrice?: number;
  price?: number;
  discount?: number;
  inStock?: boolean;
  stock?: boolean | number;
}

export interface ProductColorVariant {
  name: string;
  hex?: string;
  dotImage?: string;
  image?: string;
  images?: string[];
  storageVariants?: ProductStorageVariant[];
}

export interface Product {
  id: string;
  familyId?: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  status?: 'In Stock' | 'Out of Stock';
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  reviewCount?: number;
  image: string;
  images: string[];
  highlights: string[];
  colors?: ProductColorVariant[];
  colorVariants: ProductColorVariant[];
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isNewArrival?: boolean;
  isWeeklyTrending?: boolean;
  isUsed?: boolean;
  colorName?: string;
  colorHex?: string;
  storageOption?: string;
  baseProductId?: string;
  description?: string;
  specs?: Record<string, unknown>;
  totalSales?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FilterState {
  price: number[];
  brands: string[];
  category: string[];
  launchYear: string[];
  screenSize: string[];
  os: string[];
  ram: string[];
  cores: string[];
  internalMemory: string[];
  connectivity: string[];
  discount: number[];
}

export interface ActiveContext {
  type: 'all' | 'category' | 'specialCategory' | 'brand' | 'budget';
  label: string;
  value?: string;
}

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  uploadImage: (file: File) => Promise<string>;
  categories: Category[];
  fetchCategories: () => Promise<void>;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  clearFilters: () => void;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  activeContext: ActiveContext;
  setActiveContext: React.Dispatch<React.SetStateAction<ActiveContext>>;
  hasManualFilters: boolean;
  setHasManualFilters: React.Dispatch<React.SetStateAction<boolean>>;
  incrementSales: (id: string) => void;
}

const initialFilters: FilterState = {
  price: [],
  brands: [],
  category: [],
  launchYear: [],
  screenSize: [],
  os: [],
  ram: [],
  cores: [],
  internalMemory: [],
  connectivity: [],
  discount: []
};

const initialContext: ActiveContext = {
  type: 'all',
  label: 'All Products'
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeContext, setActiveContext] = useState<ActiveContext>(initialContext);
  const [hasManualFilters, setHasManualFilters] = useState<boolean>(false);

  const clearFilters = () => {
    setFilters(initialFilters);
    setSearchQuery("");
    setActiveContext(initialContext);
    setHasManualFilters(false);
  };

  const incrementSales = (id: string) => {
    setProducts(prev => prev.map(p => 
      p.id === id ? { ...p, totalSales: (p.totalSales || 0) + 1 } : p
    ));
  };

  const fetchCategories = async () => {
    try {
      const response = await api("/categories") as Category[];
      setCategories(response);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api("/products?limit=1000") as { products: Product[] };
      setProducts(response.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      
      const response = await api("/upload", {
        method: "POST",
        body: formData,
      }) as { url: string };
      
      if (!response.url) {
        throw new Error("Upload failed - no URL returned");
      }
      
      return response.url;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Image upload failed");
    }
  };

  const createProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">) => {
    try {
      setError(null);
      
      const productData = {
        ...data,
        description: data.description || "",
        highlights: data.highlights || [],
        colors: data.colors || data.colorVariants || [],
        colorVariants: data.colorVariants || [],
        isBestSeller: data.isBestSeller || false,
        isFeatured: data.isFeatured || false,
        isNew: data.isNew || false,
        isNewArrival: data.isNewArrival || data.isNew || false,
        isWeeklyTrending: data.isWeeklyTrending || false,
        isUsed: data.isUsed || false,
        images: data.images || [],
      };

      await api("/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });

      await fetchProducts();
      
      // Broadcast product created event for cross-tab sync
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, {
        detail: { type: "product-created", timestamp: Date.now(), data: productData }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      throw err;
    }
  };

  const updateProduct = async (id: string, data: Partial<Product>) => {
    try {
      setError(null);
      
      const updateData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });

      await api(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(updateData),
      });

      await fetchProducts();
      
      // Broadcast product updated event for cross-tab sync
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, {
        detail: { type: "product-updated", timestamp: Date.now(), data: { id, ...updateData } }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update product");
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setError(null);
      await api(`/products/${id}`, {
        method: "DELETE",
      });

      await fetchProducts();
      
      // Broadcast product deleted event for cross-tab sync
      window.dispatchEvent(new CustomEvent(SYNC_EVENT_NAME, {
        detail: { type: "product-deleted", timestamp: Date.now(), data: { id } }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Cross-tab synchronization: listen for product changes from other tabs
  useEffect(() => {
    const handleSyncEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: string; timestamp: number; data?: unknown }>;
      if (customEvent.detail) {
        const { type } = customEvent.detail;
        // Refetch products when changes are detected from other tabs
        if (type === 'product-created' || type === 'product-updated' || type === 'product-deleted') {
          fetchProducts();
        }
      }
    };

    window.addEventListener(SYNC_EVENT_NAME, handleSyncEvent);
    
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSyncEvent);
    };
  }, [fetchProducts]);

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        loading,
        error,
        fetchProducts,
        fetchCategories,
        createProduct,
        updateProduct,
        deleteProduct,
        uploadImage,
        filters,
        setFilters,
        clearFilters,
        searchQuery,
        setSearchQuery,
        activeContext,
        setActiveContext,
        hasManualFilters,
        setHasManualFilters,
        incrementSales,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within ProductProvider");
  }
  return context;
}
