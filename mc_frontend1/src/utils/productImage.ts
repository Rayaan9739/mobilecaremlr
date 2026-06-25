const FALLBACK_PRODUCT_IMAGE =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";

type ImageLike = {
  image?: string;
  images?: string[];
  colors?: Array<{ image?: string; images?: string[] }>;
  colorVariants?: Array<{ image?: string; images?: string[] }>;
};

const firstImage = (value?: string[]) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).find(Boolean)
    : "";

export function resolveProductImage(product?: ImageLike | null) {
  if (!product) return FALLBACK_PRODUCT_IMAGE;

  const direct = String(product.image || "").trim();
  if (direct) return direct;

  const imageFromList = firstImage(product.images);
  if (imageFromList) return imageFromList;

  const colorImage = product.colors?.find((color) => String(color?.image || "").trim())?.image;
  if (colorImage?.trim()) return colorImage.trim();

  const colorVariantImage = product.colorVariants?.find((color) => String(color?.image || "").trim())?.image;
  if (colorVariantImage?.trim()) return colorVariantImage.trim();

  const colorListImage = firstImage(product.colors?.flatMap((color) => color.images || []) || []);
  if (colorListImage) return colorListImage;

  const variantListImage = firstImage(product.colorVariants?.flatMap((color) => color.images || []) || []);
  if (variantListImage) return variantListImage;

  return FALLBACK_PRODUCT_IMAGE;
}

export function getProductFallbackImage() {
  return FALLBACK_PRODUCT_IMAGE;
}
