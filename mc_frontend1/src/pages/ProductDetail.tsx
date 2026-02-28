import { useState, useEffect, useMemo } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { motion } from "framer-motion";
import {
  Share2,
  ChevronRight,
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
import { groupProductsByName, pickVariant } from "@/utils/productVariants";
import { useAuth } from "@/contexts/AuthContext";
import { isValidPhoneNumber, toNormalizedPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";

interface Product {
  id: string;
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
  colorVariants: { name: string; hex: string; image: string }[];
  stock: number;
  description?: string;
}

export default function ProductDetail() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { addOrderNotification } = useRepairBooking();
  const { user } = useAuth();
  const { products: allProducts } = useProducts();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedStorage, setSelectedStorage] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = (await api(`/products/${id}`)) as { product: Product };
        setProduct(response.product);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const productGroups = useMemo(
    () => groupProductsByName(allProducts),
    [allProducts],
  );

  const currentGroup = useMemo(() => {
    if (!id) return null;
    const fromGlobal = productGroups.find(
      (group) =>
        group.groupId === id ||
        group.variants.some((variant) => variant.variantId === id),
    );
    if (fromGlobal) return fromGlobal;
    if (product) {
      const grouped = groupProductsByName([product as any]);
      return grouped[0] || null;
    }
    return null;
  }, [id, productGroups, product]);

  const activeVariant = useMemo(() => {
    if (!currentGroup) return null;
    return pickVariant(currentGroup, selectedColor, selectedStorage);
  }, [currentGroup, selectedColor, selectedStorage]);

  const availableStorages = useMemo(() => {
    if (!currentGroup) return [];
    return Array.from(
      new Set(currentGroup.variants.map((variant) => variant.storage)),
    );
  }, [currentGroup]);

  const availableColors = useMemo(() => {
    if (!currentGroup) return [];
    const scoped = selectedStorage
      ? currentGroup.variants.filter(
          (variant) => variant.storage === selectedStorage,
        )
      : currentGroup.variants;
    return Array.from(new Set(scoped.map((variant) => variant.color)));
  }, [currentGroup, selectedStorage]);

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

  useEffect(() => {
    if (availableStorages.length === 0) return;
    if (!availableStorages.includes(selectedStorage)) {
      setSelectedStorage(availableStorages[0]);
    }
  }, [availableStorages, selectedStorage]);

  useEffect(() => {
    if (availableColors.length === 0) return;
    if (!availableColors.includes(selectedColor)) {
      setSelectedColor(availableColors[0]);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    if (!currentGroup || currentGroup.variants.length === 0) return;
    const queryColor = searchParams.get("color") || "";
    const queryStorage = searchParams.get("storage") || "";
    const initialVariant =
      pickVariant(currentGroup, queryColor, queryStorage) ||
      currentGroup.variants[0];
    setSelectedColor(initialVariant.color);
    setSelectedStorage(initialVariant.storage);
    setSelectedImageIndex(0);
  }, [currentGroup, searchParams]);

  useEffect(() => {
    if (!selectedColor && !selectedStorage) return;
    const next = new URLSearchParams(searchParams);
    if (selectedColor) next.set("color", selectedColor);
    if (selectedStorage) next.set("storage", selectedStorage);
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedColor, selectedStorage, searchParams, setSearchParams]);

  const handleAddToCart = () => {
    if (product && activeVariant) {
      addToCart({
        id: activeVariant.variantId,
        name: product.name,
        price: activeVariant.price,
        image: activeVariant.image || getCurrentImage(),
        variantId: activeVariant.variantId,
        selectedColor: activeVariant.color,
        selectedStorage: activeVariant.storage,
      });
      navigate("/cart");
    }
  };

  const fallbackProductImage =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";

  const normalizeImage = (src?: string) => {
    const trimmed = (src || "").trim();
    return trimmed ? trimmed : fallbackProductImage;
  };

  const handleBookToOrder = () => {
    if (!product || !activeVariant) return;
    const userPhone = user?.phone || "";
    if (!isValidPhoneNumber(userPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    addOrderNotification({
      name: user?.fullName || "Customer",
      mobileNumber: toNormalizedPhoneNumber(userPhone),
      message: `Booking started: ${product.name} | Color: ${activeVariant.color} | Storage: ${activeVariant.storage} | ₹${Math.round(activeVariant.price).toLocaleString("en-IN")}`,
      productId: activeVariant.variantId,
      productName: product.name,
      color: activeVariant.color,
      storage: activeVariant.storage,
      variantId: activeVariant.variantId,
      price: activeVariant.price,
    });
    addToCart(
      {
        id: activeVariant.variantId,
        name: product.name,
        price: activeVariant.price,
        image: activeVariant.image || getCurrentImage(),
        brand: product.brand,
        category: product.category,
        variantId: activeVariant.variantId,
        selectedColor: activeVariant.color,
        selectedStorage: activeVariant.storage,
      },
      1,
    );
    navigate("/cart", {
      state: { autoBookNow: true, from: location.pathname },
    });
  };

  const getCurrentImage = () => {
    if (!product) return fallbackProductImage;
    if (activeVariant?.image?.trim()) {
      return normalizeImage(activeVariant.image);
    }

    const selectedFromList = product.images?.[selectedImageIndex];
    return normalizeImage(selectedFromList || product.image);
  };

  const getProductImages = () => {
    if (!product) return [];
    const base = (product.images || []).filter(
      (img) => (img || "").trim() !== "",
    );
    if (activeVariant?.image?.trim()) {
      return [activeVariant.image, ...base];
    }

    return base.length > 0 ? base : [normalizeImage(product.image)];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              <div className="aspect-[4/5] bg-secondary rounded-3xl animate-pulse"></div>
              <div className="space-y-4">
                <div className="h-8 bg-secondary rounded animate-pulse"></div>
                <div className="h-6 bg-secondary rounded animate-pulse"></div>
                <div className="h-4 bg-secondary rounded animate-pulse"></div>
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
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-32 md:pt-40 pb-16">
          <div className="container mx-auto px-4 text-center">
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

  const productImages = getProductImages();
  // Compute final price based on `price` and `discount` (use Math.round and Indian formatting)
  /* New Logic: price is Selling Price, originalPrice is MRP */
  const finalPrice = Math.round(activeVariant?.price ?? product.price);
  const originalPrice = activeVariant?.product.originalPrice
    ? Math.round(activeVariant.product.originalPrice)
    : finalPrice;
  const discountPercentage =
    product.discount ||
    (originalPrice > finalPrice
      ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
      : 0);

  const hasDiscount = discountPercentage > 0;

  const formatINR = (value: number) => `\u20B9${value.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-secondary">
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
            <span className="text-foreground">
              {currentGroup?.name || product.name}
            </span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Image Gallery */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-6"
            >
              <div className="flex gap-4">
                {/* Thumbnails */}
                <div className="flex flex-col gap-3">
                  {productImages.slice(0, 6).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-white transition-all ${
                        selectedImageIndex === index
                          ? "border-primary shadow-lg"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${index + 1}`}
                        className="w-full h-full object-contain p-1"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Image */}
                <div className="flex-1 relative">
                  <div className="bg-white rounded-3xl overflow-hidden aspect-[4/5] border border-border">
                    <motion.img
                      key={selectedImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      src={getCurrentImage()}
                      alt={product.name}
                      className="w-full h-full object-contain p-6"
                    />
                  </div>

                  <button className="absolute top-4 right-4 w-10 h-10 rounded-full border border-border bg-white shadow-sm flex items-center justify-center text-muted-foreground hover:border-primary transition-all">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Delivery Info / Buttons moved here */}
              <div className="flex gap-3">
                <Button
                  onClick={handleAddToCart}
                  variant="outline"
                  className="flex-1 rounded-full bg-white hover:bg-white border-border"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  onClick={handleBookToOrder}
                  className="flex-1 rounded-full bg-foreground text-background hover:bg-foreground/90"
                >
                  Book To Order
                </Button>
              </div>
            </motion.div>

            {/* Right - Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Title & Rating */}
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {currentGroup?.name || product.name}
                </h1>
                <p className="text-muted-foreground mb-2">{product.brand}</p>
                <div className="flex items-center gap-3">
                  {typeof product.rating === "number" && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold bg-green-600 text-white px-2 py-1 rounded">
                      {product.rating.toFixed(1)}
                      <Star className="w-3 h-3 fill-white text-white" />
                    </span>
                  )}
                  {typeof product.ratingsCount === "number" && (
                    <span className="text-sm text-muted-foreground">
                      {product.ratingsCount.toLocaleString("en-IN")} Ratings &
                      Reviews
                    </span>
                  )}
                </div>
                {product.stock === 0 && (
                  <Badge variant="destructive" className="mt-2">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  {/* Final price (bold + primary) */}
                  <span className="text-2xl font-bold text-foreground">
                    {formatINR(finalPrice)}
                  </span>

                  {/* If discount present show original price with strikethrough */}
                  {hasDiscount && (
                    <>
                      <span className="text-lg text-muted-foreground line-through">
                        {formatINR(originalPrice)}
                      </span>
                      <span className="text-sm text-green-600 font-bold">
                        {discountPercentage}% off
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Storage + Colors */}
              {availableStorages.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Storage - {selectedStorage || availableStorages[0]}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableStorages.map((storage) => (
                      <button
                        key={storage}
                        type="button"
                        onClick={() => {
                          setSelectedStorage(storage);
                          setSelectedImageIndex(0);
                        }}
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold ${
                          selectedStorage === storage
                            ? "border-foreground text-foreground"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">
                    Colors - {selectedColor || availableColors[0]}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {availableColors.map((color) => {
                      const colorVariant = pickVariant(
                        currentGroup!,
                        color,
                        selectedStorage,
                      );
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color);
                            setSelectedImageIndex(0);
                          }}
                          className={`w-28 rounded-xl border-2 overflow-hidden transition-all ${
                            selectedColor === color
                              ? "border-foreground shadow-sm"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="bg-white p-3">
                            <img
                              src={
                                colorVariant?.image?.trim()
                                  ? colorVariant.image
                                  : product.image?.trim()
                                    ? product.image
                                    : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"
                              }
                              alt={color}
                              className="w-full h-20 object-contain"
                            />
                          </div>
                          <div className="text-xs font-semibold text-foreground py-2">
                            {color}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Trust Icons */}
              <div className="grid grid-cols-3 gap-6 pt-2">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    100% Genuine <br /> Product
                  </p>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Headphones className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    Usage <br /> Assistance
                  </p>
                </div>

                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Wrench className="w-6 h-6 text-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    After Purchase <br /> Service
                  </p>
                </div>
              </div>

              {/* Highlights */}
              {(Array.isArray(product.highlights)
                ? product.highlights.length > 0
                : Object.values(product.highlights || {}).some((v) => !!v)) && (
                <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      Highlights
                    </h3>

                    <div className="space-y-4">
                      {/* If highlights is an array (legacy) render as before */}
                      {Array.isArray(product.highlights) &&
                        product.highlights.map((highlight, index) => (
                          <div key={index} className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              {highlight
                                .toLowerCase()
                                .includes("processor") && (
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
                                !highlight
                                  .toLowerCase()
                                  .includes("battery") && (
                                  <Smartphone className="w-6 h-6 text-primary" />
                                )}
                            </div>
                            <p className="text-foreground font-medium">
                              {highlight}
                            </p>
                          </div>
                        ))}

                      {/* If highlights is an object (new MOBILE behavior) render only non-empty entries */}
                      {!Array.isArray(product.highlights) &&
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
                              icon: (
                                <Smartphone className="w-6 h-6 text-primary" />
                              ),
                            },
                            {
                              key: "battery",
                              title: "Battery capacity",
                              icon: (
                                <BatteryCharging className="w-6 h-6 text-primary" />
                              ),
                            },
                          ];

                          const highlightsObj =
                            (product.highlights as Record<string, string>) ||
                            {};

                          return keyOrder.map((item) => {
                            const val = highlightsObj[item.key];
                            if (!val) return null;

                            return (
                              <div
                                key={item.key}
                                className="flex items-start gap-4"
                              >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                  {item.icon}
                                </div>
                                <div>
                                  <p className="text-foreground font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {val}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                    </div>
                  </div>
                </div>
              )}
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
