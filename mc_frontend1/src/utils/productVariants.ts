import { Product, ProductColorVariant } from "@/contexts/ProductContext";

export interface ProductVariant {
  variantId: string;
  color: string;
  colorHex?: string;
  dotImage?: string;
  storage: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  stock: number;
  images: string[];
  image: string;
  product: Product;
}

export interface ProductGroup {
  groupId: string;
  familyId?: string;
  name: string;
  brand: string;
  category: string;
  description?: string;
  image: string;
  minPrice: number;
  maxPrice: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  variants: ProductVariant[];
  colorOptions: { name: string; hex?: string; dotImage?: string }[];
  storageOptions: string[];
}

const fallbackImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";

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

const cleanImages = (images?: string[]) =>
  (images || []).map((img) => String(img || "").trim()).filter(Boolean);

const normalizeValue = (value?: string | null) =>
  String(value || "").toLowerCase().trim();

const getVariantImage = (product: Product, color?: ProductColorVariant) => {
  const colorImages = cleanImages(color?.images);
  if (colorImages[0]) return colorImages[0];
  if (color?.image?.trim()) return color.image.trim();
  if (product.image?.trim()) return product.image.trim();
  const productImages = cleanImages(product.images);
  return productImages[0] || fallbackImage;
};

const hasNestedColorVariants = (product: Product) =>
  Array.isArray(product.colors || product.colorVariants) &&
  (product.colors || product.colorVariants).some(
    (color) =>
      Array.isArray(color.storageVariants) && color.storageVariants.length > 0,
  );

const extractStorage = (product: Product) => {
  if (product.storageOption?.trim()) return product.storageOption.trim();

  const textBlob = [
    product.name,
    product.description || "",
    Array.isArray(product.highlights)
      ? product.highlights.join(" ")
      : Object.values(product.highlights || {}).join(" "),
  ].join(" ");

  const matches = textBlob.match(
    /(?:^|[\s(/])((?:\d+\s*\+\s*\d+)(?:\s*(?:gb|gib|tb|tib))?|\d+\s*(?:gb|gib|tb|tib))(?:$|[\s)/])/gi,
  );

  if (!matches || matches.length === 0) return "Standard";

  const normalized = Array.from(
    new Set(
      matches
        .map((value) => value.replace(/^[\s(/]+|[\s)/]+$/g, ""))
        .map((value) => value.replace(/\s+/g, "").toUpperCase())
        .map((value) =>
          value.replace(/GIB$/i, "GB").replace(/TIB$/i, "TB"),
        ),
    ),
  );

  return normalized.join(" + ");
};

const extractColor = (product: Product) => {
  const direct =
    product.colorName?.trim() ||
    product.colors?.[0]?.name?.trim() ||
    product.colorVariants?.[0]?.name?.trim();
  if (direct) return direct;

  const lower = product.name.toLowerCase();
  const found = KNOWN_COLORS.find((color) => lower.includes(color));
  if (found) return titleCase(found);
  return "Standard";
};

const calculateDiscount = (originalPrice?: number, sellingPrice?: number) => {
  if (!originalPrice || !sellingPrice || originalPrice <= sellingPrice) return 0;
  return Math.round(((originalPrice - sellingPrice) / originalPrice) * 100);
};

const variantFromNestedProduct = (product: Product): ProductVariant[] =>
  (product.colors || product.colorVariants).flatMap((color) => {
    const colorImages = cleanImages(color.images);
    const images =
      colorImages.length > 0
        ? colorImages
        : cleanImages(product.images).length > 0
          ? cleanImages(product.images)
          : [getVariantImage(product, color)];

    return (color.storageVariants || []).map((storage, index) => {
      const sellingPrice = Number(storage.sellingPrice ?? storage.price ?? 0);
      const originalPrice =
        storage.originalPrice === undefined
          ? undefined
          : Number(storage.originalPrice);
      const stockValue =
        typeof (storage.inStock ?? storage.stock) === "boolean"
          ? storage.inStock ?? storage.stock
            ? 1
            : 0
          : Number(storage.stock ?? (storage.inStock === false ? 0 : 1));

      return {
        variantId: String(product.id),
        color: color.name,
        colorHex: color.hex,
        dotImage: color.dotImage || color.image,
        storage: storage.storage,
        price: sellingPrice || Number(product.price) || 0,
        originalPrice,
        discount:
          storage.discount ?? calculateDiscount(originalPrice, sellingPrice),
        stock: stockValue,
        images,
        image: images[0] || fallbackImage,
        product,
      };
    });
  });

const variantFromLegacyProduct = (product: Product): ProductVariant => {
  const color = product.colorVariants?.[0];
  const images = cleanImages(product.images);
  const image = getVariantImage(product, color);
  return {
    variantId: String(product.id),
    color: extractColor(product),
    colorHex: product.colorHex || color?.hex,
    dotImage: color?.dotImage || color?.image,
    storage: extractStorage(product),
    price: Number(product.price) || 0,
    originalPrice: product.originalPrice,
    discount: product.discount,
    stock: Number(product.stock) || 0,
    images: images.length > 0 ? images : [image],
    image,
    product,
  };
};

const buildGroup = (items: Product[]): ProductGroup => {
  const [first] = items;
  const variants = items.flatMap((item) =>
    hasNestedColorVariants(item)
      ? variantFromNestedProduct(item)
      : [variantFromLegacyProduct(item)],
  );
  const prices = variants.map((variant) => variant.price).filter((price) => price > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : Number(first.price) || 0;
  const priceVariant =
    variants.find((variant) => variant.price === minPrice) || variants[0];
  const colorMap = new Map<string, { name: string; hex?: string; dotImage?: string }>();

  variants.forEach((variant) => {
    if (!colorMap.has(variant.color)) {
      colorMap.set(variant.color, {
        name: variant.color,
        hex: variant.colorHex,
        dotImage: variant.dotImage,
      });
    }
  });

  return {
    groupId: String(first.id),
    familyId: first.familyId,
    name: first.name,
    brand: first.brand,
    category: first.category,
    description: first.description,
    image: variants[0]?.image || getVariantImage(first),
    minPrice,
    maxPrice: prices.length > 0 ? Math.max(...prices) : Number(first.price) || 0,
    originalPrice: priceVariant?.originalPrice,
    discount:
      priceVariant?.discount ??
      calculateDiscount(priceVariant?.originalPrice, priceVariant?.price),
    rating: first.rating,
    ratingsCount: first.ratingsCount,
    reviewsCount: first.reviewsCount,
    variants,
    colorOptions: Array.from(colorMap.values()),
    storageOptions: Array.from(new Set(variants.map((variant) => variant.storage))),
  };
};

export const groupProductsByName = (products: Product[]): ProductGroup[] => {
  const groups = new Map<string, Product[]>();

  products.forEach((product) => {
    const key = product.familyId?.trim()
      ? `family:${product.familyId}`
      : `${normalizeKey(product.name)}|${product.brand.toLowerCase()}|${product.category.toLowerCase()}`;
    const existing = groups.get(key) || [];
    existing.push(product);
    groups.set(key, existing);
  });

  return Array.from(groups.values()).map(buildGroup);
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

  const byColor = group.variants.find((variant) => variant.color === selectedColor);
  if (byColor) return byColor;

  const byStorage = group.variants.find(
    (variant) => variant.storage === selectedStorage,
  );
  if (byStorage) return byStorage;

  return group.variants[0];
};

export const getVariantsByFamilyAndColor = (
  products: Product[],
  familyId?: string,
  color?: string,
) =>
  products.filter(
    (product) =>
      Boolean(familyId) &&
      normalizeValue(product.familyId) === normalizeValue(familyId) &&
      Boolean(color) &&
      (normalizeValue(product.colorName) === normalizeValue(color) ||
        normalizeValue(product.colors?.[0]?.name) === normalizeValue(color) ||
        normalizeValue(product.colorVariants?.[0]?.name) === normalizeValue(color)),
  );

export const getFamilyColors = (products: Product[], familyId?: string) => {
  const familyProducts = products.filter(
    (product) => normalizeValue(product.familyId) === normalizeValue(familyId),
  );
  const colorMap = new Map<
    string,
    { name: string; hex?: string; dotImage?: string }
  >();

  familyProducts.forEach((product) => {
    const color =
      product.colorName?.trim() ||
      product.colors?.[0]?.name?.trim() ||
      product.colorVariants?.[0]?.name?.trim();
    if (!color || colorMap.has(color)) return;

    colorMap.set(color, {
      name: color,
      hex: product.colorHex || product.colors?.[0]?.hex || product.colorVariants?.[0]?.hex,
      dotImage: product.colors?.[0]?.dotImage || product.colorVariants?.[0]?.dotImage,
    });
  });

  return Array.from(colorMap.values());
};
