/**
 * Brand and Category Image Syncing Utilities
 * Ensures brand logos and category icons are loaded from a single source
 */

import api from "@/lib/api";

// Cache for brand data (single source of truth)
let brandCache: Map<string, BrandData> = new Map();
let categoryCache: Map<string, CategoryData> = new Map();
let brandCacheTime = 0;
let categoryCacheTime = 0;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface BrandData {
  id: string;
  name: string;
  slug: string;
  image: string;
  enabled: boolean;
}

export interface CategoryData {
  id: string;
  name: string;
  displayName: string;
  icon?: string;
  image?: string;
}

/**
 * Fetch all brands from API and cache them
 */
export async function loadBrandsWithCache(): Promise<BrandData[]> {
  const now = Date.now();

  // Return cached brands if still fresh
  if (brandCache.size > 0 && now - brandCacheTime < CACHE_DURATION) {
    return Array.from(brandCache.values());
  }

  try {
    const brands = await api("/admin/resources/brand");
    brandCache.clear();

    if (Array.isArray(brands)) {
      brands.forEach((brand: any) => {
        const normalized: BrandData = {
          id: brand.id,
          name: brand.data?.name || brand.title || "",
          slug: brand.data?.slug || "",
          image: brand.data?.image || brand.data?.logo || brand.imageUrl || "",
          enabled: brand.enabled !== false,
        };
        if (normalized.slug) {
          brandCache.set(normalized.slug.toLowerCase(), normalized);
        }
      });
    }

    brandCacheTime = now;
    return Array.from(brandCache.values());
  } catch (error) {
    console.error("Failed to load brands:", error);
    return [];
  }
}

/**
 * Get brand image by slug (uses cache)
 */
export async function getBrandImage(brandSlug: string): Promise<string | null> {
  const slug = brandSlug?.toLowerCase() || "";
  if (!slug) return null;

  // Check cache first
  if (brandCache.has(slug)) {
    return brandCache.get(slug)?.image || null;
  }

  // Load and cache if not found
  const brands = await loadBrandsWithCache();
  return brandCache.get(slug)?.image || null;
}

/**
 * Get brand by slug (uses cache)
 */
export async function getBrandBySlug(brandSlug: string): Promise<BrandData | null> {
  const slug = brandSlug?.toLowerCase() || "";
  if (!slug) return null;

  // Check cache first
  if (brandCache.has(slug)) {
    return brandCache.get(slug) || null;
  }

  // Load and cache if not found
  await loadBrandsWithCache();
  return brandCache.get(slug) || null;
}

/**
 * Invalidate brand cache (call when brands are updated)
 */
export function invalidateBrandCache() {
  brandCache.clear();
  brandCacheTime = 0;
  // Broadcast update event to all tabs
  window.dispatchEvent(new CustomEvent("mc_brand_update"));
}

/**
 * Fetch all categories from API and cache them
 */
export async function loadCategoriesWithCache(): Promise<CategoryData[]> {
  const now = Date.now();

  // Return cached categories if still fresh
  if (categoryCache.size > 0 && now - categoryCacheTime < CACHE_DURATION) {
    return Array.from(categoryCache.values());
  }

  try {
    const categories = await api("/categories");
    categoryCache.clear();

    if (Array.isArray(categories)) {
      categories.forEach((cat: any) => {
        const normalized: CategoryData = {
          id: cat.id,
          name: cat.name,
          displayName: cat.displayName || cat.name,
          icon: cat.icon,
          image: cat.image,
        };
        categoryCache.set(cat.name.toLowerCase(), normalized);
      });
    }

    categoryCacheTime = now;
    return Array.from(categoryCache.values());
  } catch (error) {
    console.error("Failed to load categories:", error);
    return [];
  }
}

/**
 * Get category icon by name (uses cache)
 */
export async function getCategoryIcon(categoryName: string): Promise<string | null> {
  const name = categoryName?.toLowerCase() || "";
  if (!name) return null;

  // Check cache first
  if (categoryCache.has(name)) {
    return categoryCache.get(name)?.icon || null;
  }

  // Load and cache if not found
  const categories = await loadCategoriesWithCache();
  return categoryCache.get(name)?.icon || null;
}

/**
 * Get category by name (uses cache)
 */
export async function getCategoryByName(categoryName: string): Promise<CategoryData | null> {
  const name = categoryName?.toLowerCase() || "";
  if (!name) return null;

  // Check cache first
  if (categoryCache.has(name)) {
    return categoryCache.get(name) || null;
  }

  // Load and cache if not found
  await loadCategoriesWithCache();
  return categoryCache.get(name) || null;
}

/**
 * Invalidate category cache (call when categories are updated)
 */
export function invalidateCategoryCache() {
  categoryCache.clear();
  categoryCacheTime = 0;
  // Broadcast update event to all tabs
  window.dispatchEvent(new CustomEvent("mc_category_update"));
}

/**
 * Listen for brand updates from other tabs/components
 */
export function onBrandUpdate(callback: () => void) {
  const handleUpdate = () => {
    invalidateBrandCache();
    callback();
  };

  window.addEventListener("mc_brand_update", handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener("mc_brand_update", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

/**
 * Listen for category updates from other tabs/components
 */
export function onCategoryUpdate(callback: () => void) {
  const handleUpdate = () => {
    invalidateCategoryCache();
    callback();
  };

  window.addEventListener("mc_category_update", handleUpdate);
  window.addEventListener("storage", handleUpdate);

  return () => {
    window.removeEventListener("mc_category_update", handleUpdate);
    window.removeEventListener("storage", handleUpdate);
  };
}

/**
 * Preload all brands and categories (for better performance)
 */
export async function preloadBrandAndCategoryData() {
  await Promise.all([loadBrandsWithCache(), loadCategoriesWithCache()]);
}
