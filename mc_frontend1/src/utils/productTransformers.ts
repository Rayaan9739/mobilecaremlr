/**
 * Data transformation utilities for migrating between old and new product structures
 */

export interface OldProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
  reviewCount?: number;
  description?: string;
  highlights?: string[] | Record<string, string>;
  colors?: any[];
  colorVariants?: any[];
  images: string[];
  colorName?: string;
  colorHex?: string;
  storageOption?: string;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isNew?: boolean;
  isNewArrival?: boolean;
  isWeeklyTrending?: boolean;
  isUsed?: boolean;
}

export interface NewProductHighlight {
  featureIcon: string;
  featureText: string;
}

export interface NewProductColor {
  id: string;
  name: string;
  hex: string;
  dotImage?: string;
  images: string[];
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  inStock?: boolean;
}

export interface NewProductStorage {
  id: string;
  storage: string;
  colorVariants: NewProductColor[];
}

export interface NewProductFlags {
  isWeeklyTrending?: boolean;
  isMostPopular?: boolean;
  isPremiumUsed?: boolean;
  isBestSelling?: boolean;
  isFlagship?: boolean;
}

export interface NewProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  rating?: number;
  ratingsCount?: number;
  reviewCount?: number;
  description?: string;
  highlights: NewProductHighlight[];
  storageVariants: NewProductStorage[];
  flags: NewProductFlags;
}

/**
 * Convert old product structure to new product structure
 * Handles backward compatibility with existing data
 */
export function transformOldProductToNew(oldProduct: OldProduct): NewProduct {
  // Parse highlights
  let highlights: NewProductHighlight[] = [];
  if (Array.isArray(oldProduct.highlights)) {
    if (oldProduct.highlights.length > 0 && typeof oldProduct.highlights[0] === "object") {
      highlights = oldProduct.highlights as NewProductHighlight[];
    } else if (oldProduct.highlights.length > 0 && typeof oldProduct.highlights[0] === "string") {
      // Convert old string array to new format
      highlights = (oldProduct.highlights as string[]).map((text, idx) => ({
        featureIcon: `feature-${idx}`,
        featureText: text,
      }));
    }
  } else if (oldProduct.highlights && typeof oldProduct.highlights === "object") {
    // Convert old object format to new array format
    highlights = Object.entries(oldProduct.highlights).map(([icon, text]) => ({
      featureIcon: icon,
      featureText: String(text),
    }));
  }

  // Parse storage and color variants
  const storageVariants: NewProductStorage[] = [];

  // If product has colorVariants or colors, extract them
  const colorData = oldProduct.colorVariants || oldProduct.colors || [];
  if (colorData.length > 0 && colorData[0]?.storageVariants) {
    // Already has nested structure
    colorData.forEach((color: any, colorIdx: number) => {
      if (color.storageVariants && Array.isArray(color.storageVariants)) {
        color.storageVariants.forEach((storage: any, storageIdx: number) => {
          const storageKey = storage.storage || `Storage ${storageIdx + 1}`;
          let existingStorage = storageVariants.find((s) => s.storage === storageKey);

          if (!existingStorage) {
            existingStorage = {
              id: `storage-${storageIdx}`,
              storage: storageKey,
              colorVariants: [],
            };
            storageVariants.push(existingStorage);
          }

          existingStorage.colorVariants.push({
            id: `color-${colorIdx}`,
            name: color.name || `Color ${colorIdx + 1}`,
            hex: color.hex || "#000000",
            dotImage: color.dotImage,
            images: color.images || (color.image ? [color.image] : []),
            price: storage.price || storage.sellingPrice || oldProduct.price || 0,
            originalPrice: storage.originalPrice || oldProduct.originalPrice,
            discount: storage.discount || oldProduct.discount,
            stock: typeof storage.stock === "number" ? storage.stock : storage.stock ? 1 : 0,
            inStock: storage.inStock !== false,
          });
        });
      }
    });
  }

  // Fallback: Create single storage with color variants
  if (storageVariants.length === 0 && colorData.length > 0) {
    const colors: NewProductColor[] = colorData.map((color: any, idx: number) => ({
      id: `color-${idx}`,
      name: color.name || `Color ${idx + 1}`,
      hex: color.hex || "#000000",
      dotImage: color.dotImage,
      images: color.images || (color.image ? [color.image] : []),
      price: oldProduct.price,
      originalPrice: oldProduct.originalPrice,
      discount: oldProduct.discount,
      stock: oldProduct.price && oldProduct.price > 0 ? 1 : 0,
      inStock: true,
    }));

    storageVariants.push({
      id: "storage-default",
      storage: oldProduct.storageOption || "Default",
      colorVariants: colors,
    });
  }

  // Ultimate fallback: single storage, single color
  if (storageVariants.length === 0) {
    storageVariants.push({
      id: "storage-1",
      storage: oldProduct.storageOption || "Default",
      colorVariants: [
        {
          id: "color-1",
          name: oldProduct.colorName || "Default",
          hex: oldProduct.colorHex || "#000000",
          images: oldProduct.images || [],
          price: oldProduct.price,
          originalPrice: oldProduct.originalPrice,
          discount: oldProduct.discount,
          stock: 0,
          inStock: false,
        },
      ],
    });
  }

  // Parse flags
  const flags: NewProductFlags = {
    isWeeklyTrending: oldProduct.isWeeklyTrending || false,
    isMostPopular: oldProduct.isFeatured || false,
    isPremiumUsed: oldProduct.isUsed || false,
    isBestSelling: oldProduct.isBestSeller || false,
    isFlagship: oldProduct.isNew || false,
  };

  return {
    id: oldProduct.id,
    name: oldProduct.name,
    brand: oldProduct.brand,
    category: "MOBILE", // Default category
    rating: oldProduct.rating,
    ratingsCount: oldProduct.ratingsCount,
    reviewCount: oldProduct.reviewCount,
    description: oldProduct.description || "",
    highlights,
    storageVariants,
    flags,
  };
}

/**
 * Get the best image URL from a product (checks multiple sources)
 */
export function getBestImageUrl(product: any): string {
  return (
    product.image ||
    product.images?.[0] ||
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"
  );
}

/**
 * Get minimum price from product variants
 */
export function getMinPrice(product: any): number {
  if (product.price) return product.price;

  if (product.storageVariants?.length > 0) {
    const prices: number[] = [];
    product.storageVariants.forEach((storage: any) => {
      storage.colorVariants?.forEach((color: any) => {
        if (color.price) prices.push(color.price);
      });
    });
    if (prices.length > 0) return Math.min(...prices);
  }

  return 0;
}

/**
 * Get maximum price from product variants
 */
export function getMaxPrice(product: any): number {
  if (product.storageVariants?.length > 0) {
    const prices: number[] = [];
    product.storageVariants.forEach((storage: any) => {
      storage.colorVariants?.forEach((color: any) => {
        if (color.price) prices.push(color.price);
      });
    });
    if (prices.length > 0) return Math.max(...prices);
  }

  return product.price || 0;
}

/**
 * Extract all color variants from a product (flat list)
 */
export function getAllColorVariants(product: any): NewProductColor[] {
  const colors: NewProductColor[] = [];

  if (product.storageVariants?.length > 0) {
    product.storageVariants.forEach((storage: any) => {
      storage.colorVariants?.forEach((color: any) => {
        if (!colors.find((c) => c.name === color.name)) {
          colors.push(color);
        }
      });
    });
  }

  return colors;
}

/**
 * Extract all storage options from a product
 */
export function getAllStorageOptions(product: any): string[] {
  if (!product.storageVariants) return [];
  return product.storageVariants.map((s: any) => s.storage);
}
