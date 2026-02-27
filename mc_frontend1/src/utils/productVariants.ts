import { Product } from "@/contexts/ProductContext";

export interface ProductVariant {
  variantId: string;
  color: string;
  storage: string;
  price: number;
  image: string;
  product: Product;
}

export interface ProductGroup {
  groupId: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image: string;
  minPrice: number;
  maxPrice: number;
  rating?: number;
  discount?: number;
  originalPrice?: number;
  variants: ProductVariant[];
  colorOptions: string[];
  storageOptions: string[];
}

const KNOWN_COLORS = [
  "black",
  "white",
  "blue",
  "green",
  "red",
  "yellow",
  "pink",
  "purple",
  "gold",
  "silver",
  "gray",
  "grey",
  "orange",
  "brown",
];

const normalizeKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/\b\d+\s*gb\b/gi, "")
    .replace(/\b(rom|ram|storage)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

const titleCase = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

const extractStorage = (product: Product) => {
  const textBlob = [
    product.name,
    product.description || "",
    Array.isArray(product.highlights)
      ? product.highlights.join(" ")
      : Object.values(product.highlights || {}).join(" "),
  ].join(" ");
  const matches = textBlob.match(/\b\d+\s*gb(?:\s*\+\s*\d+\s*gb)?\b/gi);
  if (!matches || matches.length === 0) return "Standard";
  return matches.map((m) => m.replace(/\s+/g, "")).join(" + ");
};

const extractColor = (product: Product) => {
  const direct = product.colorVariants?.[0]?.name?.trim();
  if (direct) return direct;

  const lower = product.name.toLowerCase();
  const found = KNOWN_COLORS.find((color) => lower.includes(color));
  if (found) return titleCase(found);
  return "Default";
};

const getVariantImage = (product: Product) => {
  const colorImage = product.colorVariants?.find((item) => item.image)?.image;
  if (colorImage && colorImage.trim()) return colorImage.trim();
  if (product.image && product.image.trim()) return product.image.trim();
  const firstImage = product.images?.find((img) => img && img.trim());
  if (firstImage) return firstImage.trim();
  return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";
};

export const groupProductsByName = (products: Product[]): ProductGroup[] => {
  const groups = new Map<string, Product[]>();

  products.forEach((product) => {
    const key = `${normalizeKey(product.name)}|${product.brand.toLowerCase()}|${product.category.toLowerCase()}`;
    const existing = groups.get(key) || [];
    existing.push(product);
    groups.set(key, existing);
  });

  return Array.from(groups.values()).map((items) => {
    const [first] = items;
    const variants: ProductVariant[] = items.map((item) => ({
      variantId: String(item.id),
      color: extractColor(item),
      storage: extractStorage(item),
      price: Number(item.price) || 0,
      image: getVariantImage(item),
      product: item,
    }));

    const prices = variants.map((variant) => variant.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const colorOptions = Array.from(new Set(variants.map((variant) => variant.color)));
    const storageOptions = Array.from(
      new Set(variants.map((variant) => variant.storage)),
    );
    const ratingCandidates = items
      .map((item) => item.rating)
      .filter((rating): rating is number => typeof rating === "number");

    return {
      groupId: String(first.id),
      name: first.name,
      brand: first.brand,
      category: first.category,
      description: first.description,
      image: variants[0]?.image || getVariantImage(first),
      minPrice,
      maxPrice,
      rating:
        ratingCandidates.length > 0
          ? Math.max(...ratingCandidates)
          : undefined,
      discount: first.discount,
      originalPrice: first.originalPrice,
      variants,
      colorOptions,
      storageOptions,
    };
  });
};

export const pickVariant = (
  group: ProductGroup,
  selectedColor?: string,
  selectedStorage?: string,
) => {
  if (!group.variants.length) return null;
  const byBoth = group.variants.find(
    (variant) =>
      variant.color === selectedColor && variant.storage === selectedStorage,
  );
  if (byBoth) return byBoth;

  const byStorage = group.variants.find(
    (variant) => variant.storage === selectedStorage,
  );
  if (byStorage) return byStorage;

  const byColor = group.variants.find((variant) => variant.color === selectedColor);
  if (byColor) return byColor;

  return group.variants[0];
};

