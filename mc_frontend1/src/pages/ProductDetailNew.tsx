import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BadgePercent,
  BatteryCharging,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Camera,
  Cpu,
  Droplets,
  Layers3,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Smartphone,
  Sparkles,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useCart } from "@/contexts/CartContext";
import { useProducts } from "@/contexts/ProductContext";
import { toast } from "sonner";

type VariantColor = { id: string; name: string; hex: string; dotImage?: string; images: string[] };
type VariantStorage = { id: string; storage: string; price: number; originalPrice?: number; discount?: number; stock: number };
type HighlightItem = { icon?: string; text: string };
type Product = {
  id: string;
  name: string;
  familyId?: string;
  brand: string;
  category: string;
  image?: string;
  images?: string[];
  price?: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
  reviewsCount?: number;
  ram?: string | number;
  description?: string;
  highlights?: string[] | Record<string, any>;
  storageOption?: string;
  colors?: Array<{ id?: string; name: string; hex?: string; dotImage?: string; images?: string[]; price?: number; originalPrice?: number; discount?: number; stock?: number }>;
  storageVariants?: Array<{ id: string; storage: string; colorVariants: Array<{ id: string; name: string; hex: string; dotImage?: string; images: string[]; price: number; originalPrice?: number; discount?: number; stock: number }> }>;
  colorVariants?: Array<{ id?: string; name: string; hex?: string; dotImage?: string; images?: string[]; price?: number; originalPrice?: number; discount?: number; stock?: number }>;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=1400&fit=crop";

const highlightIconComponents: Record<string, JSX.Element> = {
  Camera: <Camera className="h-4 w-4" />,
  BatteryCharging: <BatteryCharging className="h-4 w-4" />,
  Cpu: <Cpu className="h-4 w-4" />,
  Layers3: <Layers3 className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Droplets: <Droplets className="h-4 w-4" />,
  ShieldCheck: <ShieldCheck className="h-4 w-4" />,
  BadgePercent: <BadgePercent className="h-4 w-4" />,
  Sparkles: <Sparkles className="h-4 w-4" />,
  Smartphone: <Smartphone className="h-4 w-4" />,
  CheckCircle2: <CheckCircle2 className="h-4 w-4" />,
  ShoppingBag: <ShoppingBag className="h-4 w-4" />,
  Star: <Star className="h-4 w-4" />,
};

const highlightIconMap: Array<{ match: RegExp; icon: string }> = [
  { match: /camera|photo|picture|selfie/i, icon: "Camera" },
  { match: /battery|power|charge/i, icon: "BatteryCharging" },
  { match: /processor|chip|cpu|performance|fast/i, icon: "Cpu" },
  { match: /storage|rom|memory|space/i, icon: "Layers3" },
  { match: /ram|speed|multitask/i, icon: "Zap" },
  { match: /water|dust|ip/i, icon: "Droplets" },
  { match: /security|safe|protect|shield/i, icon: "ShieldCheck" },
  { match: /offer|discount|exchange|deal/i, icon: "BadgePercent" },
  { match: /premium|pro|elite|flagship/i, icon: "Sparkles" },
  { match: /display|screen|size|inch/i, icon: "Smartphone" },
  { match: /sound|speaker|audio/i, icon: "CheckCircle2" },
  { match: /shopping|cart|buy/i, icon: "ShoppingBag" },
  { match: /rating|star|review/i, icon: "Star" },
];

function resolveHighlightIcon(value?: string) {
  const text = String(value || "").trim();
  if (!text) return "Sparkles";
  return highlightIconMap.find((item) => item.match.test(text))?.icon || "Sparkles";
}

const metricItems = [
  { label: "Display Size", value: '6.7" Super Retina', icon: <WandSparkles className="h-5 w-5" /> },
  { label: "Processor", value: "A18 Bionic-like", icon: <Cpu className="h-5 w-5" /> },
  { label: "Camera", value: "48MP Pro Camera", icon: <Camera className="h-5 w-5" /> },
  { label: "Battery", value: "All-day battery", icon: <BatteryCharging className="h-5 w-5" /> },
  { label: "RAM", value: "8GB", icon: <Users className="h-5 w-5" /> },
  { label: "Storage", value: "Up to 1TB", icon: <Layers3 className="h-5 w-5" /> },
];

function formatINR(value?: number) {
  return `₹${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function getDisplayProductName(name?: string) {
  const raw = String(name || "").trim();
  if (!raw) return "";
  return raw
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/\s*[-?|].*$/, "")
    .trim();
}

function normalizeText(value?: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCategory(value?: string) {
  return value ? value.toString().trim().toLowerCase().replace(/[\s-_]+/g, "") : "";
}

type VariantStatus = "available" | "out_of_stock" | "not_available";

function getVariantRecord(
  variants: Product[],
  product: Product | null,
  color?: string,
  storage?: string,
) {
  if (!product) return null;
  return (
    variants.find((variant) => {
      const sameFamily =
        product.familyId && variant.familyId && variant.familyId === product.familyId;
      const sameBase =
        normalizeText(getBaseName(variant)) === normalizeText(getBaseName(product)) ||
        normalizeText(variant.name) === normalizeText(product.name);
      return (
        (sameFamily || sameBase) &&
        normalizeText(variant.colorName || variant.colors?.[0]?.name || variant.colorVariants?.[0]?.name) ===
          normalizeText(color) &&
        normalizeText(variant.storageOption) === normalizeText(storage)
      );
    }) || null
  );
}

function getVariantStatus(
  variants: Product[],
  product: Product | null,
  color?: string,
  storage?: string,
): VariantStatus {
  const variant = getVariantRecord(variants, product, color, storage);
  if (!variant) return "not_available";
  if (Number(variant.stock) <= 0) return "out_of_stock";
  return "available";
}

function getBaseName(product?: Product | null) {
  const familyId = String(product?.familyId || "").trim();
  if (familyId) return familyId;
  return getDisplayProductName(product?.name) || String(product?.name || "").trim();
}

function parseRamValue(product?: Product | null) {
  const ramValue = String(product?.ram ?? (product as any)?.specs?.ram ?? "").trim();
  const directMatch = ramValue.match(/(\d+)\s*(?:gb)?/i);
  if (directMatch) return Number(directMatch[1]);

  const nameMatch = String(product?.name || "").match(/(?:^|[\s(])(\d+)\s*GB(?:\s*\+|\s|\))/i);
  if (nameMatch) return Number(nameMatch[1]);

  return null;
}

function formatStorageLabel(value?: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  const match = compact.match(/^(\d+)(gb|tb)?$/i);
  if (match) {
    return `${match[1]}${(match[2] || "GB").toUpperCase()}`;
  }
  const plusMatch = compact.match(/^(\d+)\+(\d+)(gb|tb)?$/i);
  if (plusMatch) {
    return `${plusMatch[1]} + ${plusMatch[2]}${(plusMatch[3] || "GB").toUpperCase()}`;
  }
  return raw.replace(/gib$/i, "GB").replace(/tib$/i, "TB").toUpperCase();
}

function formatProductTitle(product?: Product | null, storage?: string) {
  if (!product) return "";
  const baseName = getDisplayProductName(product.name) || product.name || "";
  const formattedStorage = formatStorageLabel(storage);
  if (!formattedStorage) return baseName;
  const ram = parseRamValue(product);
  if (!ram) return `${baseName} (${formattedStorage})`;
  return `${baseName} (${ram}GB + ${formattedStorage})`;
}

function extractFeatureHighlights(value: Product["highlights"]): HighlightItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return { text: item.trim() };
        if (item && typeof item === "object") {
          return {
            icon: String((item as any).featureIcon || "").trim(),
            text: String((item as any).featureText || (item as any).text || "").trim(),
          };
        }
        return { text: "" };
      })
      .filter((item) => item.text);
  }
  const featureHighlights = value.featureHighlights;
  if (Array.isArray(featureHighlights)) {
    return featureHighlights
      .map((item) => {
        if (typeof item === "string") return { text: item.trim() };
        if (item && typeof item === "object") {
          return {
            icon: String((item as any).featureIcon || "").trim(),
            text: String((item as any).featureText || (item as any).text || "").trim(),
          };
        }
        return { text: "" };
      })
      .filter((item) => item.text);
  }
  return Object.values(value)
    .map((item) => (typeof item === "string" ? { text: item.trim() } : { text: "" }))
    .filter((item) => item.text);
}

function extractHighlightData(value: Product["highlights"]) {
  const highlights = extractFeatureHighlights(value);
  const exchangeOffer =
    value && !Array.isArray(value) && typeof value === "object"
      ? value.exchangeOffer
      : null;

  return {
    highlights,
    exchangeOffer:
      exchangeOffer?.enabled
        ? {
            title: String(exchangeOffer.title || "Exchange Offer"),
            details: String(exchangeOffer.details || "Exchange offer available at checkout."),
          }
        : null,
  };
}

function normalizeVariantColors(product?: Product | null): VariantColor[] {
  const seen = new Map<string, VariantColor>();

  const addColor = (color: any, fallbackId: string) => {
    if (!color) return;
    const id = String(color.id || fallbackId || color.name || "").trim();
    if (!id || seen.has(id)) return;
    seen.set(id, {
      id,
      name: String(color.name || id).trim(),
      hex: String(color.hex || "#d1d5db"),
      dotImage: color.dotImage,
      images: Array.isArray(color.images) ? color.images.filter(Boolean) : [],
    });
  };

  (product?.storageVariants || []).forEach((storage) => {
    (storage.colorVariants || []).forEach((color, index) => {
      addColor(color, `${storage.id || "storage"}:${index}`);
    });
  });

  (product?.colors || []).forEach((color, index) => addColor(color, `color-${index}`));
  (product?.colorVariants || []).forEach((color, index) => addColor(color, `legacy-color-${index}`));

  return Array.from(seen.values());
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-white/70 ${className}`} />;
}

export default function ProductDetailNew() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { products, fetchProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");
  const [selectedColorId, setSelectedColorId] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [openOfferIndex, setOpenOfferIndex] = useState<number | null>(0);
  const [selectedBundleIds, setSelectedBundleIds] = useState<string[]>([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showAllHighlights, setShowAllHighlights] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);
  const [canToggleDescription, setCanToggleDescription] = useState(false);
  const offerState = location.state as
    | { offerNote?: string; offerTitle?: string; offerPrice?: number }
    | null;

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const response = (await api(`/products/${id}`)) as { product?: Product } & Product;
        const productData = response.product || response;
        setProduct(productData);
      } catch (error) {
        console.error("Failed to load product", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadProduct();
  }, [id]);

  useEffect(() => {
    const descriptionNode = descriptionRef.current;
    if (!descriptionNode) {
      setCanToggleDescription(false);
      return;
    }

    setCanToggleDescription(descriptionNode.scrollHeight > descriptionNode.clientHeight + 1);
  }, [product?.description]);

  const storageVariants: VariantStorage[] = useMemo(() => {
    const seen = new Map<string, VariantStorage>();
    products.forEach((variant) => {
      if (!product) return;
      const sameFamily =
        product.familyId && variant.familyId && variant.familyId === product.familyId;
      const sameBase =
        normalizeText(getBaseName(variant)) === normalizeText(getBaseName(product)) ||
        normalizeText(variant.name) === normalizeText(product.name);
      if (!(sameFamily || sameBase)) return;
      const storage = String(variant.storageOption || "").trim();
      if (!storage || seen.has(storage)) return;
      seen.set(storage, {
        id: variant.id,
        storage,
        price: Number(variant.price) || 0,
        originalPrice: variant.originalPrice,
        discount: variant.discount,
        stock: Number(variant.stock) || 0,
      });
    });
    if (!seen.size && product?.storageOption) {
      seen.set(product.storageOption, {
        id: product.id,
        storage: product.storageOption,
        price: Number(product.price) || 0,
        originalPrice: product.originalPrice,
        discount: product.discount,
        stock: Number(product.stock) || 0,
      });
    }
    return Array.from(seen.values());
  }, [product, products]);

  const familyVariants = useMemo(() => {
    if (!product) return [];
    return products.filter((variant) => {
      const sameFamily =
        product.familyId && variant.familyId && variant.familyId === product.familyId;
      const sameBase =
        normalizeText(getBaseName(variant)) === normalizeText(getBaseName(product)) ||
        normalizeText(variant.name) === normalizeText(product.name);
      return sameFamily || sameBase;
    });
  }, [product, products]);

  const colorVariants: VariantColor[] = useMemo(() => {
    const seen = new Map<string, VariantColor>();
    products.forEach((variant) => {
      if (!product) return;
      const sameFamily =
        product.familyId && variant.familyId && variant.familyId === product.familyId;
      const sameBase =
        normalizeText(getBaseName(variant)) === normalizeText(getBaseName(product)) ||
        normalizeText(variant.name) === normalizeText(product.name);
      if (!(sameFamily || sameBase)) return;
      if (
        storageVariants.length > 0 &&
        !storageVariants.some((storage) => normalizeText(storage.storage) === normalizeText(variant.storageOption))
      ) {
        return;
      }
      const colorName = String(variant.colorName || variant.colors?.[0]?.name || variant.colorVariants?.[0]?.name || "").trim();
      if (!colorName || seen.has(colorName)) return;
      const normalized = normalizeVariantColors(variant)[0];
      seen.set(colorName, {
        id: variant.id,
        name: normalized?.name || colorName,
        hex: normalized?.hex || variant.colorHex || "#d1d5db",
        dotImage: normalized?.dotImage,
        images: normalized?.images?.length ? normalized.images : (variant.images || []),
      });
    });
    if (!seen.size) {
      normalizeVariantColors(product).forEach((color) => seen.set(color.name, color));
    }
    return Array.from(seen.values());
  }, [product, products, storageVariants.length]);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [products.length, fetchProducts]);

  useEffect(() => {
    if (!selectedStorageId && product) {
      setSelectedStorageId(storageVariants[0]?.id || product.storageOption || "");
    }
  }, [product, selectedStorageId, storageVariants]);

  const activeStorage = useMemo(
    () => storageVariants.find((storage) => storage.id === selectedStorageId) || storageVariants[0],
    [storageVariants, selectedStorageId],
  );

  const activeColor = useMemo(
    () =>
      colorVariants.find((color) => color.id === selectedColorId) ||
      colorVariants[0],
    [colorVariants, selectedColorId],
  );

  const selectedVariantRecord = useMemo(
    () =>
      selectedVariant ||
      getVariantRecord(
        familyVariants,
        product,
        activeColor?.name || "",
        activeStorage?.storage || product?.storageOption,
      ) || product,
    [selectedVariant, familyVariants, product, activeStorage?.storage, activeColor?.name],
  );

  useEffect(() => {
    if (!colorVariants.length) return;
    const hasSelectedColor = colorVariants.some((color) => color.id === selectedColorId);
    if (!hasSelectedColor) {
      setSelectedColorId(colorVariants[0]?.id || "");
    }
  }, [colorVariants, selectedColorId]);

  const galleryImages = useMemo(() => {
    const images =
      selectedVariantRecord?.images?.filter(Boolean) ||
      activeColor?.images?.filter(Boolean) ||
      product?.images?.filter(Boolean) ||
      [];
    return images.length ? images : [product?.image || fallbackImage];
  }, [selectedVariantRecord, activeColor, product]);

  const showNextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const showPreviousImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    if (!isImageViewerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setIsImageViewerOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageViewerOpen, galleryImages.length]);

  const sellingPrice = selectedVariantRecord?.price ?? activeColor?.price ?? product?.price ?? 0;
  const currentPrice = offerState?.offerPrice ?? sellingPrice;
  const originalPrice =
    offerState?.offerPrice != null
      ? sellingPrice
      : selectedVariantRecord?.originalPrice ?? activeColor?.originalPrice ?? product?.originalPrice ?? 0;
  const discount =
    offerState?.offerPrice != null
      ? originalPrice > currentPrice
        ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
        : 0
      : selectedVariantRecord?.discount ?? activeColor?.discount ?? product?.discount ?? (originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0);
  const rating = product?.rating ?? 4.5;

  const { highlights: selectedHighlights, exchangeOffer } = useMemo(() => {
    return extractHighlightData(product?.highlights);
  }, [product]);

  const storageChoices = useMemo(() => {
    const seen = new Map<string, { id: string; storage: string; stock: number; price: number }>();
    familyVariants.forEach((variant) => {
      const storage = String(variant.storageOption || "").trim();
      if (!storage || seen.has(storage)) return;
      seen.set(storage, {
        id: variant.id,
        storage,
        stock: Number(variant.stock) || 0,
        price: Number(variant.price) || 0,
      });
    });
    return Array.from(seen.values());
  }, [familyVariants]);

  useEffect(() => {
    if (!product) return;
    const nextVariant =
      getVariantRecord(
        familyVariants,
        product,
        activeColor?.name || colorVariants[0]?.name || "",
        activeStorage?.storage || storageChoices[0]?.storage || product.storageOption,
      ) || product;
    setSelectedVariant(nextVariant);
  }, [
    product,
    familyVariants,
    activeColor?.name,
    activeStorage?.storage,
    colorVariants,
    storageChoices,
  ]);

  const hasStorageVariants = storageChoices.length > 0;
  const hasAnyColorVariants = colorVariants.length > 0;

  const displayName = useMemo(
    () => formatProductTitle(product, activeStorage?.storage),
    [product, activeStorage?.storage],
  );

  const selectedStorageLabel = activeStorage?.storage || storageChoices[0]?.storage || product?.storageOption || "";
  const visibleColorVariants = colorVariants;
  const reviewPercent = Math.round((rating / 5) * 100);

  const handleAddToCart = () => {
    if (!selectedVariantRecord || Number(selectedVariantRecord.stock) <= 0) return;
    addToCart({
      id: selectedVariantRecord.id,
      name: `${selectedVariantRecord.brand} ${displayName || selectedVariantRecord.name}`,
      price: currentPrice,
      image: galleryImages[0],
      selectedColor: activeColor?.name,
      selectedStorage: activeStorage?.storage,
    });
    toast.success("Added to cart");
  };

  const similarProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter(
        (item) =>
          item.id !== product.id &&
          normalizeText(item.brand) === normalizeText(product.brand) &&
          normalizeCategory(item.category) === normalizeCategory(product.category),
      )
      .sort((a, b) => {
        const salesA = Number(a.totalSales || 0);
        const salesB = Number(b.totalSales || 0);
        if (salesA !== salesB) return salesB - salesA;
        return String(a.name).localeCompare(String(b.name));
      })
      .slice(0, 5);
  }, [products, product]);

  const frequentlyBought = useMemo(() => {
    if (!product) return [];
    const accessoryKeywords = [
      "charger",
      "adapter",
      "power adapter",
      "cable",
      "neckband",
      "earbud",
      "earbuds",
      "headphone",
      "headphones",
      "case",
      "cover",
      "screen protector",
      "tempered glass",
      "power bank",
      "back cover",
      "case",
    ];

    const scored = products
      .filter((item) => item.id !== product.id)
      .map((item) => {
        const name = normalizeText(item.name);
        const category = normalizeText(item.category);
        const isAccessory =
          category.includes("access") ||
          accessoryKeywords.some((keyword) => name.includes(keyword) || category.includes(keyword));
        const isPhone = category.includes("mobile") || category.includes("phone") || name.includes("iphone") || name.includes("galaxy");
        const isCover = name.includes("cover") || name.includes("case") || name.includes("back cover") || name.includes("silicone case");
        const isSameBrand = normalizeText(item.brand) === normalizeText(product.brand);
        const isSameFamily = Boolean(product.familyId && item.familyId && item.familyId === product.familyId);
        const isAdapterFlow =
          /adapter|charger|power/i.test(String(product.name || "")) ||
          /adapter|charger|power/i.test(String(product.category || ""));
        const score =
          (isAccessory ? 100 : 0) +
          (isAdapterFlow && isPhone ? 40 : 0) +
          (isAdapterFlow && isCover ? 35 : 0) +
          (isSameBrand ? 25 : 0) +
          (isSameFamily ? 15 : 0) +
          Number(item.totalSales || 0) / 10;

        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || String(a.item.name).localeCompare(String(b.item.name)))
      .map(({ item }) => item);

    return scored.slice(0, 5);
  }, [products, product]);

  useEffect(() => {
    setSelectedBundleIds(frequentlyBought.map((item) => String(item.id)));
  }, [frequentlyBought, product?.id]);

  const selectedBundleItems = useMemo(
    () => frequentlyBought.filter((item) => selectedBundleIds.includes(String(item.id))),
    [frequentlyBought, selectedBundleIds],
  );

  const selectedBundleTotal = useMemo(
    () => selectedBundleItems.reduce((total, item) => total + Number(item.price || 0), 0),
    [selectedBundleItems],
  );

  const handleAddBundleToCart = () => {
    selectedBundleItems.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: Number(item.price || 0),
        image: item.image || item.images?.[0] || fallbackImage,
        brand: item.brand,
        category: item.category,
      });
    });
    if (selectedBundleItems.length > 0) {
      toast.success(`${selectedBundleItems.length} item(s) added to cart`);
    }
  };

  const youMightLike = useMemo(() => {
    if (!product) return [];
    const used = new Set([product.id, ...similarProducts.map((p) => p.id), ...frequentlyBought.map((p) => p.id)]);
    const selectedBrand = normalizeText(product.brand);
    const targetCategory = normalizeCategory(product.category);

    const seenBases = new Set<string>();
    // Pre-populate seenBases with the current product's base and other shown products' bases
    seenBases.add(normalizeText(getBaseName(product)));
    similarProducts.forEach((p) => seenBases.add(normalizeText(getBaseName(p))));
    frequentlyBought.forEach((p) => seenBases.add(normalizeText(getBaseName(p))));

    return products
      .filter(
        (item) =>
          !used.has(item.id) &&
          normalizeText(item.brand) !== selectedBrand &&
          normalizeCategory(item.category) === targetCategory
      )
      .filter((item) => {
        const base = normalizeText(getBaseName(item));
        if (seenBases.has(base)) return false;
        seenBases.add(base);
        return true;
      })
      .sort((a, b) => {
        const stockA = Number(a.stock || 0);
        const stockB = Number(b.stock || 0);
        if (stockA !== stockB) return stockB - stockA;
        return String(a.name).localeCompare(String(b.name));
      })
      .slice(0, 5);
  }, [products, product, similarProducts, frequentlyBought]);

  const handleBuyNow = () => {
    if (!selectedVariantRecord || Number(selectedVariantRecord.stock) <= 0) return;
    handleAddToCart();
    navigate("/cart");
  };

  if (loading || !product) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-28 md:pt-36 pb-12">
          <div className="container mx-auto max-w-[1440px] px-2">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <SkeletonBlock className="h-[580px]" />
              <div className="space-y-5">
                <SkeletonBlock className="h-10 w-2/3" />
                <SkeletonBlock className="h-6 w-1/2" />
                <SkeletonBlock className="h-36" />
                <SkeletonBlock className="h-44" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary text-slate-900">
      <Header />
      <main className="pt-44 md:pt-40 lg:pt-44 pb-24">
        <div className="container mx-auto max-w-[1440px] px-3 sm:px-4">
          <div className="mb-3 flex items-center gap-2 overflow-hidden rounded-md border border-border bg-white px-3 py-2 text-sm text-muted-foreground shadow-soft">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-foreground transition hover:border-primary hover:text-primary"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <span className="shrink-0">{product.brand}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="truncate text-foreground">{displayName || product.name}</span>
          </div>

          <div id="ProductDetailSection" className="ProductDetailSection grid grid-cols-1 gap-3 lg:grid-cols-[41%_59%] lg:items-start">
            <section className="ProductDetailMedia space-y-3 lg:self-start">
              <div className="ProductStickyPurchase space-y-3">
                <div className="ProductImageShell grid overflow-hidden rounded-md border border-border bg-white shadow-soft lg:grid-cols-[82px_1fr]">
                  <div className="ProductImageThumbs hidden border-r border-border bg-white lg:flex flex-col">
                    {galleryImages.slice(0, 5).map((image, index) => (
                      <button
                        key={image + index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`h-20 shrink-0 border-b border-border bg-white p-2 transition ${selectedImageIndex === index ? "border-l-4 border-l-primary" : "hover:bg-accent/35"}`}
                      >
                        <img src={image} alt={`Preview ${index + 1}`} className="h-full w-full object-contain p-1" loading="lazy" />
                      </button>
                    ))}
                  </div>

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setIsImageViewerOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setIsImageViewerOpen(true);
                      }
                    }}
                    className="ProductImageCard group relative flex min-h-[420px] items-center justify-center overflow-hidden bg-white text-left sm:min-h-[520px]"
                    aria-label="Open product image fullscreen"
                  >
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={galleryImages[selectedImageIndex] || galleryImages[0]}
                        src={galleryImages[selectedImageIndex] || galleryImages[0]}
                        alt={product.name}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.28 }}
                        className="h-full w-full object-contain p-5 sm:p-8 lg:p-10"
                      />
                    </AnimatePresence>
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 text-xs">
                      <Badge className="rounded bg-primary px-2.5 py-1 text-primary-foreground shadow-sm">
                        Assured
                      </Badge>
                      <Badge className="rounded bg-emerald-600 px-2.5 py-1 text-white shadow-sm">
                        {Number(selectedVariantRecord?.stock) > 0 ? "In Stock" : "Out of Stock"}
                      </Badge>
                    </div>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 lg:hidden">
                      {galleryImages.map((_, index) => (
                        <button
                          type="button"
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`h-2 rounded-full transition-all ${selectedImageIndex === index ? "w-7 bg-primary" : "w-2 bg-slate-300"}`}
                          aria-label={`Select image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {galleryImages.map((image, index) => (
                    <button
                      type="button"
                      key={image + index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white p-1 transition ${selectedImageIndex === index ? "border-primary shadow-soft" : "border-border"}`}
                    >
                      <img src={image} alt={`Thumbnail ${index + 1}`} className="h-full w-full max-w-full object-contain p-1" />
                    </button>
                  ))}
                </div>

                <div className="ProductActionBar fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-white/95 p-3 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      onClick={handleBuyNow}
                      size="lg"
                      disabled={Number(selectedVariantRecord?.stock) <= 0}
                      className="h-12 w-full rounded-md bg-primary text-primary-foreground shadow-none transition hover:bg-[#0096c7] lg:h-14 disabled:cursor-not-allowed disabled:bg-primary/40"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Buy Now
                    </Button>
                    <Button
                      onClick={handleAddToCart}
                      size="lg"
                      variant="outline"
                      disabled={Number(selectedVariantRecord?.stock) <= 0}
                      className="h-12 w-full rounded-md border-[#ff9f00] bg-[#ff9f00] text-white transition hover:bg-[#f59b00] hover:text-white lg:h-14 disabled:cursor-not-allowed disabled:border-slate-300 disabled:bg-slate-400 disabled:text-white"
                    >
                      <PackageCheck className="mr-2 h-5 w-5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>

              <div className="hidden rounded-md border border-border bg-white p-4 shadow-soft lg:block">
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-primary">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Genuine product</p>
                      <p className="text-xs leading-5 text-muted-foreground">Checked by Mobile Care before delivery.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-primary">
                      <RefreshCw className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Exchange support</p>
                      <p className="text-xs leading-5 text-muted-foreground">Get help with exchange and setup in store.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-primary">
                      <PackageCheck className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Pickup or delivery</p>
                      <p className="text-xs leading-5 text-muted-foreground">Choose the option that works best at checkout.</p>
                    </div>
                  </div>
                </div>
              </div>

            </section>

            <section className="ProductDetailInfo overflow-hidden rounded-md border border-border bg-white shadow-soft">
              <div className="border-b border-border p-4 sm:p-5">
                <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
                <h1 className="mt-1 text-xl font-semibold leading-snug text-foreground sm:text-2xl lg:text-[28px] break-words">
                  {displayName || product.name}
                </h1>
                {offerState?.offerNote ? (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <span className="font-semibold">Offer note: </span>
                    {offerState.offerNote}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {typeof product.rating === "number" && (
                    <span className="rounded bg-green-600 px-2 py-1 text-sm font-semibold text-white whitespace-nowrap">
                      {product.rating.toFixed(1)} ★
                    </span>
                  )}
                  {typeof (product.reviewsCount ?? product.ratingsCount) === "number" && (
                    <span className="text-sm text-muted-foreground break-words">
                      {(product.reviewsCount ?? product.ratingsCount)!.toLocaleString("en-IN")} Ratings & Reviews
                    </span>
                  )}
                </div>
              </div>

              <div className="border-b border-border p-4 sm:p-5">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="text-3xl font-semibold text-foreground lg:text-4xl break-words">{formatINR(currentPrice)}</div>
                  {originalPrice > currentPrice && (
                    <>
                      <div className="pb-1 text-base line-through text-muted-foreground whitespace-nowrap">{formatINR(originalPrice)}</div>
                      <div className="pb-1 text-base font-semibold text-green-600 whitespace-nowrap">{discount}% off</div>
                    </>
                  )}
                </div>
                <p className="mt-2 text-sm font-medium text-green-600">Inclusive of all taxes</p>
              </div>

              {visibleColorVariants.length > 0 ? (
                <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[120px_1fr] sm:p-5">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Color
                    <span className="mt-1 block text-foreground">{activeColor?.name || visibleColorVariants[0]?.name || "Select"}</span>
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {visibleColorVariants.map((color) => {
                      const selected = activeColor?.id === color.id;
                      const previewImage = color.dotImage || color.images?.[0] || galleryImages[0] || fallbackImage;
                      const status = getVariantStatus(
                        familyVariants,
                        product,
                        color.name,
                        activeStorage?.storage || storageChoices[0]?.storage || product.storageOption,
                      );
                      const isUnavailable = status === "not_available";
                      const isOutOfStock = status === "out_of_stock";
                      return (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => {
                            if (isUnavailable) {
                              toast.error("This variant combination is not available.");
                              return;
                            }
                            setSelectedColorId(color.id);
                            const matchedVariant = getVariantRecord(
                              familyVariants,
                              product,
                              color.name,
                              activeStorage?.storage || storageChoices[0]?.storage || product.storageOption,
                            );
                            if (matchedVariant) {
                              setSelectedVariant(matchedVariant);
                            }
                          }}
                          className={`w-24 min-w-[90px] shrink-0 rounded-md bg-white p-2 text-left transition ${
                            isUnavailable
                              ? "border border-border opacity-50 cursor-not-allowed"
                              : selected
                                ? "border-2 border-primary shadow-soft"
                                : "border border-border hover:border-primary"
                          }`}
                        >
                          <img src={previewImage} alt={color.name} className="h-14 w-full rounded object-cover" />
                          <div className="mt-2 text-sm font-semibold text-foreground">{color.name}</div>
                          <div className={`mt-1 text-xs font-medium ${isUnavailable ? "text-gray-500" : isOutOfStock ? "text-red-500" : "text-emerald-600"}`}>
                            {isUnavailable ? "Not Available" : isOutOfStock ? "Out of Stock" : "In Stock"}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="border-b border-border bg-accent/25 px-4 py-3 text-sm text-muted-foreground sm:px-5">
                  No color variants are attached to this product yet.
                </div>
              )}

              {(hasStorageVariants || Boolean(product?.storageOption)) && (
                <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-[120px_1fr] sm:p-5">
                  <h2 className="text-sm font-semibold text-muted-foreground">
                    Storage
                    <span className="mt-1 block text-foreground">{selectedStorageLabel || "Select"}</span>
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {storageChoices.map((storage) => {
                      const selected = activeStorage?.storage === storage.storage;
                      const status = getVariantStatus(
                        familyVariants,
                        product,
                        activeColor?.name || colorVariants[0]?.name || "",
                        storage.storage,
                      );
                      const isUnavailable = status === "not_available";
                      const isOutOfStock = status === "out_of_stock";
                      const nextVariant = getVariantRecord(
                        familyVariants,
                        product,
                        activeColor?.name || colorVariants[0]?.name || "",
                        storage.storage,
                      );
                      const storagePrice = nextVariant?.price ?? currentPrice;
                      return (
                        <button
                          key={storage.id}
                          type="button"
                          onClick={() => {
                            if (isUnavailable) {
                              toast.error("This variant combination is not available.");
                              return;
                            }
                            setSelectedStorageId(storage.id);
                            const firstMatch = getVariantRecord(
                              familyVariants,
                              product,
                              activeColor?.name || colorVariants[0]?.name || "",
                              storage.storage,
                            );
                            if (firstMatch) {
                              setSelectedVariant(firstMatch);
                            }
                          }}
                          className={`min-w-[112px] flex-shrink-0 rounded-md bg-white p-3 text-left transition ${
                            isUnavailable
                              ? "border border-border opacity-50 cursor-not-allowed"
                              : selected
                                ? "border-2 border-primary shadow-soft"
                                : "border border-border hover:border-primary"
                          }`}
                        >
                          <div className="font-semibold text-foreground">{formatStorageLabel(storage.storage)}</div>
                          <div className={`mt-1 text-sm font-semibold ${isOutOfStock ? "text-red-500" : "text-muted-foreground"}`}>
                            {isUnavailable ? "Not Available" : isOutOfStock ? "Out of Stock" : formatINR(storagePrice)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hasStorageVariants && hasAnyColorVariants && (
                <div className="border-b border-border bg-accent/35 px-4 py-3 text-sm text-primary sm:px-5">
                  This product has color variants, but no storage variants were configured.
                </div>
              )}

              {product.description && (
                <div className="border-b border-border p-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line sm:p-5">
                  <h2 className="mb-2 text-base font-semibold text-foreground">Description</h2>
                  <div ref={descriptionRef} className={showFullDescription ? "" : "line-clamp-3"}>
                    {product.description}
                  </div>
                  {canToggleDescription && (
                    <button
                      type="button"
                      onClick={() => setShowFullDescription((prev) => !prev)}
                      className="mt-2 text-sm font-medium text-primary"
                    >
                      {showFullDescription ? "Show Less" : "Show More"}
                    </button>
                  )}
                </div>
              )}

              <div className="grid gap-3 p-4 sm:grid-cols-[120px_1fr] sm:p-5">
                <h2 className="text-sm font-semibold text-muted-foreground">Highlights</h2>
                <div className="space-y-3">
                {selectedHighlights.length > 0 ? (
                  <>
                    {selectedHighlights.slice(0, showAllHighlights ? selectedHighlights.length : 5).map((item, index) => (
                    <div key={`${item.text}-${index}`} className="flex items-start gap-3 break-words">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-foreground">
                        {highlightIconComponents[item.icon || resolveHighlightIcon(item.text)]}
                      </span>
                      <span className="pt-1.5 text-sm text-foreground">{item.text}</span>
                    </div>
                    ))}
                    {!showAllHighlights && selectedHighlights.length > 5 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllHighlights(true)}
                        className="text-sm font-medium text-primary"
                      >
                        + View All Highlights
                      </button>
                    ) : null}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">No highlights available.</div>
                )}
                </div>
              </div>

              {exchangeOffer && (
                <div className="m-4 rounded-md border border-amber-100 bg-amber-50 p-4 sm:m-5">
                  <div className="text-sm font-semibold text-amber-900">{exchangeOffer.title}</div>
                  <div className="mt-1 text-sm text-amber-800">{exchangeOffer.details}</div>
                </div>
              )}

            </section>

        </div>
        <div className="mt-4 space-y-6 overflow-x-hidden">
          {similarProducts.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">Similar Products</h2>
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {similarProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/product/new/${item.id}`)}
                    className="w-[180px] sm:w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                    aria-label={`Open ${item.name}`}
                  >
                    <img
                      src={item.image || item.images?.[0] || fallbackImage}
                      alt={item.name}
                      className="h-64 w-full rounded-xl object-contain"
                    />
                    <div className="mt-3 text-base font-medium text-slate-900 line-clamp-2">
                      {item.name}
                    </div>
                    <div className="mt-1 text-xl font-semibold text-blue-600">
                      {formatINR(item.price)}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Frequently Bought Together</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px]">
              <div className="divide-y divide-slate-200">
                {[
                  {
                    id: String(product.id),
                    name: `${product.brand} • This product`,
                    price: currentPrice,
                    image: galleryImages[0] || product.image || fallbackImage,
                    selected: true,
                  },
                  ...frequentlyBought.slice(0, 4).map((item) => ({
                    id: String(item.id),
                    name: item.name,
                    price: Number(item.price || 0),
                    image: item.image || item.images?.[0] || fallbackImage,
                    selected: selectedBundleIds.includes(String(item.id)),
                    brand: item.brand,
                    category: item.category,
                  })),
                ].map((item, index) => (
                  <div
                    key={item.id}
                    className={`grid grid-cols-[52px_minmax(0,1fr)_28px] items-center gap-2.5 px-3 py-3 sm:grid-cols-[72px_1fr_40px] sm:gap-4 sm:px-4 sm:py-4 ${index === 0 ? "bg-slate-50" : "bg-white"}`}
                  >
                    <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg border border-slate-200 object-contain sm:h-16 sm:w-16 sm:rounded-xl" />
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">{index === 0 ? product.brand : (item.brand || "")}</div>
                      <div className="truncate text-sm font-medium text-slate-900">{item.name}</div>
                      <div className="mt-1 text-sm font-semibold text-blue-600">{formatINR(item.price)}</div>
                    </div>
                    <div className="flex justify-end">
                      <input
                        type="checkbox"
                        checked={index === 0 ? true : selectedBundleIds.includes(item.id)}
                        disabled={index === 0}
                        onChange={(e) => {
                          if (index === 0) return;
                          setSelectedBundleIds((prev) =>
                            e.target.checked ? [...prev, item.id] : prev.filter((id) => id !== item.id),
                          );
                        }}
                        className="h-[18px] w-[18px] accent-blue-600 sm:h-5 sm:w-5"
                        aria-label={`Select ${item.name}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2.5 border-t border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
                <div className="text-sm text-slate-600">
                  5 products
                  <span className="ml-2 font-semibold text-slate-900">
                    Total: {formatINR(currentPrice + selectedBundleTotal)}
                  </span>
                </div>
                <Button
                  type="button"
                  onClick={handleAddBundleToCart}
                  className="rounded-full bg-blue-600 px-6 text-white hover:bg-blue-700"
                  disabled={selectedBundleItems.length === 0}
                >
                  Add Selected Items to Cart
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Products You Might Like</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {youMightLike.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/product/new/${item.id}`)}
                  className="w-[180px] sm:w-72 shrink-0 rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
                  aria-label={`Open ${item.name}`}
                >
                  <img
                    src={item.image || item.images?.[0] || fallbackImage}
                    alt={item.name}
                    className="h-64 w-full rounded-xl object-contain"
                  />
                  <div className="mt-3 text-base font-medium text-slate-900 line-clamp-2">{item.name}</div>
                  <div className="mt-1 text-xl font-semibold text-blue-600">{formatINR(item.price)}</div>
                </button>
              ))}
            </div>
          </section>
        </div>
        </div>
      </main>
      {isImageViewerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md overflow-hidden"
          role="dialog"
          aria-modal="true"
          onClick={() => setIsImageViewerOpen(false)}
          onTouchStart={(e) => {
            touchEndXRef.current = null;
            touchStartXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchMove={(e) => {
            touchEndXRef.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={() => {
            const startX = touchStartXRef.current;
            const endX = touchEndXRef.current;
            touchStartXRef.current = null;
            touchEndXRef.current = null;
            if (startX == null || endX == null) return;
            const delta = startX - endX;
            if (Math.abs(delta) < 50) return;
            if (delta > 0) {
              showNextImage();
            } else {
              showPreviousImage();
            }
          }}
        >
          <button
            type="button"
            onClick={() => setIsImageViewerOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
          >
            Close
          </button>
          <motion.img
            key={galleryImages[selectedImageIndex] || galleryImages[0]}
            src={galleryImages[selectedImageIndex] || galleryImages[0]}
            alt={product.name}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="max-h-[90vh] max-w-[92vw] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
      <Footer />
    </div>
  );
}


