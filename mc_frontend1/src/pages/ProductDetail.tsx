import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Share2,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  ShoppingCart,
  Percent,
  Tag,
  ShieldCheck,
  Headphones,
  Wrench,
  Cpu,
  Camera,
  Smartphone,
  BatteryCharging,
  Star,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import api from "@/lib/api";
import { useLocation } from "react-router-dom";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { useProducts } from "@/contexts/ProductContext";
import {
  groupProductsByName,
  getFamilyColors,
  type ProductVariant,
} from "@/utils/productVariants";
import { useAuth } from "@/contexts/AuthContext";
import { isValidPhoneNumber, toNormalizedPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";

interface Product {
  id: string;
  familyId?: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating?: number;
  ratingsCount?: number;
  image: string;
  images: string[];
  category: string;
  highlights: string[] | Record<string, string>;
  colors?: {
    name: string;
    hex?: string;
    dotImage?: string;
    image?: string;
    images?: string[];
    storageVariants?: {
      storage: string;
      originalPrice?: number;
      sellingPrice?: number;
      price?: number;
      discount?: number;
      inStock?: boolean;
      stock?: boolean | number;
    }[];
  }[];
  colorVariants: {
    name: string;
    hex?: string;
    dotImage?: string;
    image?: string;
    images?: string[];
    storageVariants?: {
      storage: string;
      originalPrice?: number;
      sellingPrice?: number;
      price?: number;
      discount?: number;
      inStock?: boolean;
      stock?: boolean | number;
    }[];
  }[];
  stock: number;
  description?: string;
  colorName?: string;
  colorHex?: string;
  storageOption?: string;
}

export default function ProductDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { addOrderNotification } = useRepairBooking();
  const { user } = useAuth();
  const { products: allProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  // The active variant id (may differ from route `id` when we swap variants
  // locally without navigation).
  const [activeVariantId, setActiveVariantId] = useState<string | null>(id ?? null);
  const [familyVariants, setFamilyVariants] = useState<
    { id: string; variantId?: string; color: string; storage: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const skipNextFetchRef = useRef(false);
  const normalizeValue = (value?: string | null) =>
    String(value || "").toLowerCase().trim();
  const getProductColor = (item?: Partial<Product> | null) =>
    normalizeValue(
      item?.colorName ||
        item?.colors?.[0]?.name ||
        item?.colorVariants?.[0]?.name ||
        item?.color ||
        "",
    );
  const getProductStorage = (item?: Partial<Product> | null) =>
    normalizeValue(item?.storageOption || item?.storage || "");
  const familyProducts = useMemo(
    () =>
      allProducts.filter(
        (item) =>
          normalizeValue(item.familyId) === normalizeValue(product?.familyId),
      ),
    [allProducts, product?.familyId],
  );

  const getVariantId = (variant?: { id?: string; variantId?: string } | null) =>
    variant?.id || variant?.variantId || "";

  // Navigation functions for images
  const goToPreviousImage = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? productImages.length - 1 : prev - 1,
    );
  };

  const goToNextImage = () => {
    setSelectedImageIndex((prev) =>
      prev === productImages.length - 1 ? 0 : prev + 1,
    );
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      goToNextImage();
    } else if (distance < -minSwipeDistance) {
      goToPreviousImage();
    }
  };
  useEffect(() => {
    const fetchProduct = async () => {
      // If a variant swap just updated local state and URL silently,
      // skip the next fetch to avoid overwriting the local product.
      if (skipNextFetchRef.current) {
        skipNextFetchRef.current = false;
        return;
      }

      try {
        setLoading(true);
        const response = (await api(`/products/${id}`)) as { product: Product };
        setProduct(response.product);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        // Do not clear `product` on fetch error to avoid unmounting the page
        // and causing a flash. Keep previous product data if present.
      } finally {
        setLoading(false);
      }
    };

    if (!id) return;
    if (product?.id === id) return;

    fetchProduct();
    setSelectedImageIndex(0);
  }, [id, product]);

  useEffect(() => {
    const fetchFamilyVariants = async () => {
      if (!product?.familyId) {
        setFamilyVariants([]);
        return;
      }

      try {
        const response = (await api(`/products/family/${product.familyId}`)) as {
          variants: { id: string; variantId?: string; color: string; storage: string }[];
        };
        setFamilyVariants(response.variants || []);
      } catch (err) {
        console.error("Failed to fetch family variants:", err);
        setFamilyVariants([]);
      }
    };

    fetchFamilyVariants();
  }, [product?.familyId]);

  useEffect(() => {
    if (!product) return;

    console.debug("[ProductDetail] current product", {
      id: product.id,
      familyId: product.familyId,
      rawColor: (product as any).color,
      rawStorage: (product as any).storage,
      normalizedColor: getProductColor(product),
      normalizedStorage: getProductStorage(product),
    });

    if (product.familyId) {
      console.debug("[ProductDetail] family products", familyProducts.map((item) => ({
        id: item.id,
        familyId: item.familyId,
        color: getProductColor(item),
        storage: getProductStorage(item),
        name: item.name,
      })));
      console.debug("[ProductDetail] family api variants", familyVariants);
    }
  }, [product, familyProducts, familyVariants]);

  const productGroups = useMemo(
    () => groupProductsByName(allProducts),
    [allProducts],
  );

  const currentGroup = useMemo(() => {
    if (!product) return null;

    const fromGlobal = productGroups.find(
      (group) =>
        group.groupId === product.id ||
        group.variants.some((variant) => variant.variantId === product.id),
    );
    if (fromGlobal) return fromGlobal;

    const grouped = groupProductsByName([product as any]);
    return grouped[0] || null;
  }, [product, productGroups]);

  const currentVariant = useMemo(() => {
    if (!currentGroup) return null;

    const exactMatch = currentGroup.variants.find(
      (variant) => variant.variantId === activeVariantId || variant.variantId === product?.id,
    );
    if (exactMatch) return exactMatch;

    const preferredColor = getProductColor(product);
    const preferredStorage = getProductStorage(product);

    return (
      currentGroup.variants.find(
        (variant) =>
          normalizeValue(variant.color) === normalizeValue(preferredColor) &&
          normalizeValue(variant.storage) === normalizeValue(preferredStorage),
      ) ||
      currentGroup.variants.find(
        (variant) => normalizeValue(variant.color) === normalizeValue(preferredColor),
      ) ||
      currentGroup.variants[0] ||
      null
    );
  }, [currentGroup, product, activeVariantId]);

  const normalizedCurrentColor = useMemo(() => {
    return (
      currentVariant?.color ||
      product?.colorName?.trim() ||
      product?.colors?.[0]?.name?.trim() ||
      product?.colorVariants?.[0]?.name?.trim() ||
      currentGroup?.colorOptions[0]?.name ||
      ""
    );
  }, [currentVariant, product, currentGroup]);

  const currentColor = useMemo(() => {
    return normalizedCurrentColor;
  }, [normalizedCurrentColor]);

  const currentStorage = useMemo(() => {
    return (
      currentVariant?.storage ||
      product?.storageOption?.trim() ||
      currentGroup?.storageOptions[0] ||
      ""
    );
  }, [currentVariant, product, currentGroup]);

  const familyScopedVariants = useMemo(() => {
    if (!product?.familyId || !currentColor) return [];
    return familyProducts.filter(
      (item) => getProductColor(item) === normalizeValue(currentColor),
    );
  }, [familyProducts, currentColor, product?.familyId]);

  const familyColorOptions = useMemo(() => {
    if (!product?.familyId) return [];
    return getFamilyColors(familyProducts, product.familyId);
  }, [familyProducts, product?.familyId]);

  const hasExactVariant = (color: string, storage: string) =>
    Boolean(
      familyProducts.find(
        (variant) =>
          getProductColor(variant) === normalizeValue(color) &&
          getProductStorage(variant) === normalizeValue(storage),
      ),
    ) ||
    Boolean(
      currentGroup?.variants.find(
        (variant) =>
          normalizeValue(variant.color) === normalizeValue(color) &&
          normalizeValue(variant.storage) === normalizeValue(storage),
      ),
    );

  const findVariantForColor = (color: string) => {
    const colorScopedVariants = familyProducts.filter(
      (variant) => getProductColor(variant) === normalizeValue(color),
    );

    const exact =
      colorScopedVariants.find(
        (variant) => getProductStorage(variant) === normalizeValue(currentStorage),
      ) ||
      colorScopedVariants[0] ||
      null;

    if (exact) {
      return {
        variantId: exact.id,
        color: getProductColor(exact) || color,
        storage: getProductStorage(exact) || currentStorage,
        price: exact.price,
        originalPrice: exact.originalPrice,
        discount: exact.discount,
        stock: exact.stock,
        images: exact.images || [],
        image: exact.images?.[0] || exact.image || "",
        product: exact,
      } as ProductVariant;
    }

    return (
      currentGroup?.variants.find(
        (variant) =>
          normalizeValue(variant.color) === normalizeValue(color) &&
          normalizeValue(variant.storage) === normalizeValue(currentStorage),
      ) ||
      currentGroup?.variants.find(
        (variant) => normalizeValue(variant.color) === normalizeValue(color),
      ) ||
      null
    );
  };

  const findVariantForStorage = (storage: string) => {
    const colorScopedVariants = familyProducts.filter(
      (variant) => getProductColor(variant) === normalizeValue(currentColor),
    );

    const exact =
      colorScopedVariants.find(
        (variant) => getProductStorage(variant) === normalizeValue(storage),
      ) || colorScopedVariants[0] || null;

    if (exact) {
      return {
        variantId: exact.id,
        color: getProductColor(exact) || currentColor,
        storage: getProductStorage(exact) || storage,
        price: exact.price,
        originalPrice: exact.originalPrice,
        discount: exact.discount,
        stock: exact.stock,
        images: exact.images || [],
        image: exact.images?.[0] || exact.image || "",
        product: exact,
      } as ProductVariant;
    }

    return (
      currentGroup?.variants.find(
        (variant) =>
          normalizeValue(variant.color) === normalizeValue(currentColor) &&
          normalizeValue(variant.storage) === normalizeValue(storage),
      ) ||
      null
    );
  };

  const availableStorages = useMemo(() => {
    const fromFamily = familyProducts
      .filter((variant) => getProductColor(variant) === normalizeValue(currentColor))
      .map((variant) => getProductStorage(variant) || variant.storageOption || variant.storage)
      .filter(Boolean);

    if (fromFamily.length > 0) {
      return Array.from(new Set(fromFamily));
    }

    if (!currentGroup) return [];

    return Array.from(
      new Set(
        currentGroup.variants
          .filter((variant) => !currentColor || variant.color === currentColor)
          .map((variant) => variant.storage)
          .filter(Boolean),
      ),
    );
  }, [currentGroup, familyProducts, currentColor]);

  const availableColors = useMemo(() => {
    if (familyColorOptions.length > 0) return familyColorOptions;
    if (!currentGroup) return [];
    return currentGroup.colorOptions;
  }, [currentGroup, familyColorOptions]);

  const similarProducts = useMemo(() => {
    if (!currentGroup) return [];
    // Show products of the same brand (excluding current product)
    return productGroups
      .filter(
        (group) =>
          group.groupId !== currentGroup.groupId &&
          String(group.brand).toLowerCase() ===
            String(currentGroup.brand).toLowerCase(),
      )
      .slice(0, 4);
  }, [currentGroup, productGroups]);

  const categoryProducts = useMemo(() => {
    if (!currentGroup) return [];
    // Show products of the same category (excluding current product and same brand)
    return productGroups
      .filter(
        (group) =>
          group.groupId !== currentGroup.groupId &&
          String(group.category).toLowerCase() ===
            String(currentGroup.category).toLowerCase() &&
          String(group.brand).toLowerCase() !==
            String(currentGroup.brand).toLowerCase(),
      )
      .slice(0, 4);
  }, [currentGroup, productGroups]);

  const swapVariant = (nextVariant: ProductVariant | null) => {
    if (!nextVariant || !nextVariant.product) return;

    console.log("swapVariant", {
      currentProductId: product?.id,
      currentProductName: product?.name,
      nextVariantId: nextVariant.variantId,
      nextVariantStorage: nextVariant.storage,
      nextVariantColor: nextVariant.color,
      nextVariantProductName: nextVariant.product?.name,
      nextVariantPrice: nextVariant.price,
    });

    const nextUrl = `/product/${type || (nextVariant.product.category === "MOBILE" ? "new" : "accessory")}/${nextVariant.variantId}`;
    const currentUrl = window.location.pathname;

    // Merge next product into previous state so we never render `undefined` or
    // temporarily clear fields. Preserve UI until new data is applied.
    setProduct((prev) => (prev ? { ...prev, ...nextVariant.product } : nextVariant.product));
    setSelectedImageIndex(0);

    // Mark to skip the immediate fetch triggered by the route effect so our
    // local update is not overwritten.
    skipNextFetchRef.current = true;
    setActiveVariantId(nextVariant.variantId || null);

    if (currentUrl !== nextUrl) {
      // Update URL silently without triggering navigation.
      try {
        window.history.replaceState({}, "", nextUrl);
      } catch (e) {
        console.warn("replaceState failed", e);
      }
    }
  };

  const fallbackProductImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";

  const normalizeImage = (src?: string) => {
    const trimmed = (src || "").trim();
    return trimmed ? trimmed : fallbackProductImage;
  };

  const getCurrentImage = () => {
    if (!productImages.length) return fallbackProductImage;

    const selected = productImages[selectedImageIndex] || productImages[0];
    return normalizeImage(selected);
  };

  const getProductImages = () => {
    if (!product) return [];

    const variantImages = (currentVariant?.images || [])
      .map((img) => String(img || "").trim())
      .filter(Boolean);

    if (variantImages.length > 0) {
      return variantImages;
    }

    const base = (product.images || [])
      .map((img) => String(img || "").trim())
      .filter(Boolean);

    return base.length > 0 ? base : [normalizeImage(product.image)];
  };

  const handleAddToCart = () => {
    if (!product) return;

    addToCart({
      id: currentVariant?.variantId || displayProduct.id,
      productId: currentVariant?.variantId || displayProduct.id,
      name: displayName,
      price: currentVariant?.price ?? displayProduct.price,
      image: getCurrentImage(),
      variantId: currentVariant?.variantId || displayProduct.id,
      selectedColor: currentColor,
      selectedStorage: currentStorage,
    });
    navigate("/cart");
  };

  const handleBookToOrder = () => {
    if (!product) return;
    const userPhone = user?.phone || "";
    if (!isValidPhoneNumber(userPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const currentPrice = currentVariant?.price ?? product.price;

    if (
      !window.confirm(
        `Book ${displayName} for ₹${Math.round(currentPrice).toLocaleString("en-IN")}?`,
      )
    ) {
      return;
    }

    addToCart(
      {
        id: currentVariant?.variantId || displayProduct.id,
        productId: currentVariant?.variantId || displayProduct.id,
        name: displayName,
        price: currentPrice,
        image: getCurrentImage(),
        brand: displayProduct.brand,
        category: displayProduct.category,
        variantId: currentVariant?.variantId || displayProduct.id,
        selectedColor: currentColor,
        selectedStorage: currentStorage,
      },
      1,
    );
    navigate("/cart", {
      state: { autoBookNow: true, from: location.pathname },
    });
    return;

    addOrderNotification({
      name: user?.fullName || "Customer",
      mobileNumber: toNormalizedPhoneNumber(userPhone),
      message: `Booking started: ${displayName} | Color: ${currentColor} | Storage: ${currentStorage} | ₹${Math.round(currentPrice).toLocaleString("en-IN")}`,
      productId: currentVariant?.variantId || displayProduct.id,
      productName: displayName,
      color: currentColor,
      storage: currentStorage,
      variantId: currentVariant?.variantId || displayProduct.id,
      price: currentPrice,
    });
    addToCart(
      {
        id: currentVariant?.variantId || displayProduct.id,
        productId: currentVariant?.variantId || displayProduct.id,
        name: displayName,
        price: currentPrice,
        image: getCurrentImage(),
        brand: displayProduct.brand,
        category: displayProduct.category,
        variantId: currentVariant?.variantId || displayProduct.id,
        selectedColor: currentColor,
        selectedStorage: currentStorage,
      },
      1,
    );
    navigate("/cart", {
      state: { autoBookNow: true, from: location.pathname },
    });
  };

  const displayProduct = currentVariant?.product ?? product;
  const displayName = useMemo(() => {
    const baseName = (displayProduct?.name || product?.name || "").trim();
    if (!baseName) return "";

    const normalizedBase = baseName.replace(/(\s*\([^)]*\)\s*)+$/g, "").trim();
    const variantParts = [currentStorage, currentColor].filter((part) => {
      const cleaned = part?.trim();
      return Boolean(cleaned) && cleaned !== "Standard";
    });

    const alreadyIncludesVariant = variantParts.every((part) =>
      normalizedBase.toLowerCase().includes(part.toLowerCase()),
    );

    if (alreadyIncludesVariant) {
      return baseName;
    }

    if (variantParts.length === 0) {
      return baseName;
    }

    return `${normalizedBase} (${variantParts.join(" / ")})`;
  }, [currentColor, currentStorage, displayProduct?.name, product?.name]);
  const productImages = getProductImages();
  const currentPrice = currentVariant?.price ?? displayProduct?.price ?? 0;
  const finalPrice = Math.round(currentPrice);
  const originalPrice =
    currentVariant?.originalPrice ?? displayProduct?.originalPrice ?? currentPrice;
  const discountPercentage =
    currentVariant?.discount ??
    displayProduct?.discount ??
    (originalPrice > finalPrice
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0);

  const hasDiscount = discountPercentage > 0;
  const displayStock = displayProduct?.stock ?? 0;
  const isAvailable = Boolean(currentVariant?.stock ?? displayStock > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 md:pt-40 pb-16 bg-white">
          <div className="container mx-auto max-w-[1440px] px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12">
              <div className="aspect-[4/5] bg-slate-100 rounded-[32px] animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-10 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-8 bg-slate-100 rounded animate-pulse"></div>
                <div className="h-6 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main className="pt-32 md:pt-40 pb-16 bg-white">
          <div className="container mx-auto max-w-[1440px] px-6 lg:px-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Product Not Found
            </h1>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatINR = (value: number) => `₹${value.toLocaleString("en-IN")}`;
  const thumbnailImages = productImages.slice(0, 6);
  const reviewCountLabel = (product.reviewsCount ?? product.ratingsCount) || 0;

  const handleShareClick = async () => {
    const url = window.location.href;
    const title = displayName;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // ignore cancellation
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (error) {
      console.error(error);
      toast.error("Unable to copy link");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hover:text-primary transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link
              to="/products"
              className="hover:text-primary transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{displayName}</span>
          </motion.div>

          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-10">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex gap-4">
                <div className="flex flex-col gap-3">
                  {productImages.slice(0, 6).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`cursor-pointer w-16 h-16 rounded-xl overflow-hidden border-2 bg-white transition-all ${
                        selectedImageIndex === index
                          ? "border-primary shadow-lg"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${displayName} view ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>

                <div className="flex-1 relative">
                  <div
                    className="group bg-white rounded-3xl overflow-hidden aspect-[4/5] border border-border"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  >
                    <motion.img
                      key={selectedImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={getCurrentImage()}
                      alt={displayName}
                      className="w-full h-full object-contain p-6 transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>

                  {productImages.length > 1 && (
                    <>
                      <button
                        onClick={goToPreviousImage}
                        className="cursor-pointer absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-white transition-all md:left-4"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={goToNextImage}
                        className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 shadow-lg border border-border flex items-center justify-center text-foreground hover:bg-white transition-all md:right-4"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  <button className="cursor-pointer absolute top-4 right-4 w-10 h-10 rounded-full border border-border bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:border-primary transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
                  {displayName}
                </h1>
                <p className="text-sm text-muted-foreground">{displayProduct.brand}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {typeof product.rating === "number" && (
                  <span className="inline-flex items-center gap-1 rounded bg-green-600 px-2 py-1 text-xs font-bold text-white">
                    {product.rating.toFixed(1)}
                    <Star className="w-3 h-3 fill-white text-white" />
                  </span>
                )}
                {typeof (product.reviewsCount ?? product.ratingsCount) === "number" && (
                  <span className="text-sm text-muted-foreground">
                    {(product.reviewsCount ?? product.ratingsCount)!.toLocaleString("en-IN")} Ratings & Reviews
                  </span>
                )}
              </div>

              <div>
                <Badge variant={isAvailable ? "default" : "destructive"}>
                  {isAvailable ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>

              <div className="space-y-3">
                {availableStorages.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Storage Variants
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {availableStorages.map((storage) => {
                        const nextVariant = findVariantForStorage(storage);
                        const isStorageAvailable = Boolean(nextVariant);
                        const storagePrice = nextVariant?.price || product.price;
                        const storageOriginal = nextVariant?.originalPrice || product.originalPrice;
                        const storageDiscount =
                          nextVariant?.discount ||
                          (storageOriginal && storagePrice
                            ? Math.round(((storageOriginal - storagePrice) / storageOriginal) * 100)
                            : 0);

                        return (
                          <button
                            key={storage}
                            type="button"
                            disabled={!isStorageAvailable}
                            onClick={() => {
                              if (!isStorageAvailable) return;
                              swapVariant(nextVariant);
                            }}
                            className={`inline-flex shrink-0 flex-col items-start rounded-2xl border px-4 py-3 text-left transition-all ${
                              currentStorage === storage
                                ? "border-foreground bg-white shadow-sm"
                                : "border-border bg-white/80"
                            } ${
                              !isStorageAvailable
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            <span className="text-sm font-semibold text-foreground">
                              {storage}
                            </span>
                            <span className="mt-2 text-base font-bold text-foreground">
                              {formatINR(Math.round(storagePrice))}
                            </span>
                            {storageOriginal && storageOriginal > storagePrice && (
                              <span className="text-xs text-muted-foreground line-through">
                                {formatINR(Math.round(storageOriginal))}
                              </span>
                            )}
                            {storageDiscount > 0 && (
                              <span className="mt-1 text-xs font-semibold text-green-600">
                                {storageDiscount}% off
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {availableColors.length > 0 && (
                  <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      Colors - {currentColor}
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-1">
                      {availableColors.map((color) => {
                        const nextVariant = findVariantForColor(color.name);
                        const isColorAvailable = Boolean(nextVariant);

                        return (
                          <button
                            key={color.name}
                            type="button"
                            disabled={!isColorAvailable}
                            onClick={() => {
                              if (!isColorAvailable) return;
                              swapVariant(nextVariant);
                            }}
                            className={`inline-flex shrink-0 w-24 flex-col items-center gap-2 rounded-2xl border bg-white px-3 py-3 transition-all ${
                              currentColor === color.name
                                ? "border-foreground shadow-sm"
                                : "border-border"
                            } ${
                              !isColorAvailable
                                ? "cursor-not-allowed opacity-50"
                                : ""
                            }`}
                          >
                            {color.dotImage ? (
                              <img
                                src={color.dotImage}
                                alt=""
                                className="h-14 w-14 rounded-full object-cover border border-border"
                              />
                            ) : (
                              <span
                                className="h-14 w-14 rounded-full border border-border"
                                style={{ backgroundColor: color.hex || "#d1d5db" }}
                              />
                            )}
                            <span className="text-sm font-semibold text-foreground">
                              {color.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold text-foreground">{formatINR(finalPrice)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-muted-foreground line-through">
                      {formatINR(originalPrice)}
                    </span>
                    <span className="text-sm font-semibold text-green-600">
                      {discountPercentage}% off
                    </span>
                  </>
                )}
              </div>

              {displayProduct.description && (
                <div
                  className="prose prose-sm max-w-none text-sm leading-6 text-muted-foreground prose-p:my-2 prose-br:leading-4 prose-strong:text-foreground prose-ul:my-2 prose-ol:my-2 prose-li:my-1"
                  dangerouslySetInnerHTML={{ __html: displayProduct.description }}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 bg-white">
                  <ShieldCheck className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    100% Genuine Product
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 bg-white">
                  <Headphones className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    Usage Assistance
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border px-3 py-3 bg-white">
                  <Wrench className="w-5 h-5 text-foreground" />
                  <span className="text-sm font-semibold text-foreground">
                    After Purchase Service
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-foreground mb-4">Highlights</h2>
                <div className="space-y-4">
                  {Array.isArray(displayProduct.highlights) &&
                    displayProduct.highlights.map((highlight, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          {highlight.toLowerCase().includes("processor") && (
                            <Cpu className="w-6 h-6 text-primary" />
                          )}
                          {highlight.toLowerCase().includes("camera") && (
                            <Camera className="w-6 h-6 text-primary" />
                          )}
                          {highlight.toLowerCase().includes("display") && (
                            <Smartphone className="w-6 h-6 text-primary" />
                          )}
                          {highlight.toLowerCase().includes("battery") && (
                            <BatteryCharging className="w-6 h-6 text-primary" />
                          )}
                          {!highlight.toLowerCase().includes("processor") &&
                            !highlight.toLowerCase().includes("camera") &&
                            !highlight.toLowerCase().includes("display") &&
                            !highlight.toLowerCase().includes("battery") && (
                              <Smartphone className="w-6 h-6 text-primary" />
                            )}
                        </div>
                        <p className="text-sm font-medium text-foreground leading-6">
                          {highlight}
                        </p>
                      </div>
                    ))}

                  {!Array.isArray(displayProduct.highlights) &&
                    (() => {
                      const keyOrder: Array<{
                        key: string;
                        title: string;
                        icon: JSX.Element;
                      }> = [
                        {
                          key: "processor",
                          title: "Processor details",
                          icon: <Cpu className="w-6 h-6 text-primary" />,
                        },
                        {
                          key: "rearCamera",
                          title: "Rear Camera specs",
                          icon: <Camera className="w-6 h-6 text-primary" />,
                        },
                        {
                          key: "frontCamera",
                          title: "Front Camera",
                          icon: <Camera className="w-6 h-6 text-primary" />,
                        },
                        {
                          key: "display",
                          title: "Display type & size",
                          icon: <Smartphone className="w-6 h-6 text-primary" />,
                        },
                        {
                          key: "battery",
                          title: "Battery capacity",
                          icon: <BatteryCharging className="w-6 h-6 text-primary" />,
                        },
                      ];

                      const highlightsObj =
                        (displayProduct.highlights as Record<string, string>) || {};

                      return keyOrder.map((item) => {
                        const val = highlightsObj[item.key];
                        if (!val) return null;

                        return (
                          <div key={item.key} className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">
                                {item.title}
                              </p>
                              <p className="text-sm text-muted-foreground leading-6 mt-1">
                                {val}
                              </p>
                            </div>
                          </div>
                        );
                      });
                    })()}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="w-full rounded-full bg-white hover:bg-white border-border cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBookToOrder}
                  className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
                >
                  Book To Order
                </Button>
              </div>
            </motion.div>
          </div>

          {similarProducts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-foreground mb-4">
                More from {currentGroup?.brand}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {similarProducts.map((item) => (
                  <button
                    key={item.groupId}
                    type="button"
                    onClick={() => {
                      navigate(
                        `/product/${String(item.category).toLowerCase() === "mobile" ? "new" : "accessory"}/${item.groupId}`,
                      );
                    }}
                    className="cursor-pointer text-left border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-28 object-contain bg-white rounded-lg mb-2"
                    />
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{item.minPrice.toLocaleString("en-IN")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {categoryProducts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-bold text-foreground mb-4">
                More from {currentGroup?.category}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {categoryProducts.map((item) => (
                  <button
                    key={item.groupId}
                    type="button"
                    onClick={() => {
                      navigate(
                        `/product/${String(item.category).toLowerCase() === "mobile" ? "new" : "accessory"}/${item.groupId}`,
                      );
                    }}
                    className="text-left border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-28 object-contain bg-white rounded-lg mb-2"
                    />
                    <p className="text-sm font-semibold text-foreground line-clamp-2">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ₹{item.minPrice.toLocaleString("en-IN")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
