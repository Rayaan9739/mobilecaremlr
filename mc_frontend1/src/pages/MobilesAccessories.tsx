import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Smartphone,
  Headphones,
  Battery,
  Cable,
  HardDrive,
  Camera,
  Watch,
  Gamepad2,
  Speaker,
  Star,
  Plug,
  Package,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobilesHero } from "@/components/MobilesHero";
import { useCart } from "@/contexts/CartContext";
import { BrandCarousel } from "@/components/BrandCarousel";
import { BannerCarousel } from "@/components/BannerCarousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import api from "@/lib/api";

import { Product } from "@/contexts/ProductContext";
import { groupProductsByName, ProductGroup } from "@/utils/productVariants";

interface ProductsResponse {
  products: Product[];
}

// categories that should appear in both mobiles and accessories views
const trendingCategories = [
  { name: "Mobile Phones", category: "MOBILE", icon: Smartphone, count: 0 },
  { name: "Used Phones", category: "USED_PHONES", icon: Smartphone, count: 0 },
  { name: "Smart Watches", category: "SMART_WATCH", icon: Watch, count: 0 },
  { name: "Speakers", category: "SPEAKERS", icon: Speaker, count: 0 },
  { name: "Storage", category: "STORAGE", icon: HardDrive, count: 0 },
  { name: "Accessories", category: "ACCESSORIES", icon: Package, count: 0 },
  {
    name: "Adaptors & Converters",
    category: "ADAPTORS_CONVERTERS",
    icon: Plug,
    count: 0,
  },
  { name: "Chargers", category: "CHARGERS", icon: Battery, count: 0 },
  { name: "Cables", category: "CABLES", icon: Cable, count: 0 },
  { name: "Camera", category: "CAMERA", icon: Camera, count: 0 },
  { name: "Gaming", category: "GAMING", icon: Gamepad2, count: 0 },
  { name: "Headphones", category: "HEADPHONES", icon: Headphones, count: 0 },
];

const budgetRanges = [
  { label: "Under ₹10,000", min: 0, max: 10000, color: "bg-blue-500" },
  { label: "₹10,000 - ₹20,000", min: 10000, max: 20000, color: "bg-green-500" },
  {
    label: "₹20,000 - ₹30,000",
    min: 20000,
    max: 30000,
    color: "bg-yellow-500",
  },
  {
    label: "₹30,000 - ₹50,000",
    min: 30000,
    max: 50000,
    color: "bg-orange-500",
  },
  { label: "₹50,000 - ₹70,000", min: 50000, max: 70000, color: "bg-red-500" },
  { label: "Above ₹70,000", min: 70000, max: Infinity, color: "bg-purple-500" },
];

const featuredCategories = [
  {
    name: "Sports & Outdoors",
    image:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=300&h=200&fit=crop",
  },
  {
    name: "Smart Watches",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
  },
  {
    name: "Audio",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
  },
  {
    name: "Photography",
    image:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop",
  },
];

const categoryToSlug = (category: string) =>
  category.toLowerCase().replace(/[\s-]+/g, "_");

export default function MobilesAccessories() {
  const navigate = useNavigate();
  // scroll position state for category carousel
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  // selected budget label used for highlighting
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [visibleCounts, setVisibleCounts] = useState({
    bestSelling: 4,
    flagship: 4,
    midRange: 4,
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // fetch only the mobile products (default landing data)
        const mobileResponse = await api<ProductsResponse>(
          "/products?category=MOBILE",
        );
        setProducts(mobileResponse.products || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const scrollCategories = (direction: "left" | "right") => {
    const container = document.getElementById("categories-container");
    if (container) {
      const scrollAmount = 300;
      const newPosition =
        direction === "left"
          ? Math.max(0, categoryScrollPosition - scrollAmount)
          : categoryScrollPosition + scrollAmount;

      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setCategoryScrollPosition(newPosition);
    }
  };

  const groupedProducts = useMemo(() => groupProductsByName(products), [products]);
  const bestSellingAll = useMemo(() => groupedProducts, [groupedProducts]);
  const flagshipAll = useMemo(
    () => groupedProducts.filter((p) => p.minPrice > 50000),
    [groupedProducts],
  );
  const midRangeAll = useMemo(
    () => groupedProducts.filter((p) => p.minPrice >= 25000 && p.minPrice <= 70000),
    [groupedProducts],
  );

  const bestSelling = useMemo(
    () => bestSellingAll.slice(0, visibleCounts.bestSelling),
    [bestSellingAll, visibleCounts.bestSelling],
  );
  const flagship = useMemo(
    () => flagshipAll.slice(0, visibleCounts.flagship),
    [flagshipAll, visibleCounts.flagship],
  );
  const midRange = useMemo(
    () => midRangeAll.slice(0, visibleCounts.midRange),
    [midRangeAll, visibleCounts.midRange],
  );

  return (
    <div className="min-h-screen bg-secondary">
      <Header />
      <MobilesHero />

      <main className="pb-16">
        <div className="container mx-auto px-4">
          {/* Banner Carousel */}
          <BannerCarousel />

          {/* Shop by Brand */}
          <section className="mb-12 pt-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-4 mb-6"
            >
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Shop by Brand
              </h2>
              <div className="h-px bg-border flex-1 max-w-[100px] hidden md:block" />
            </motion.div>
            <BrandCarousel />
          </section>

          {/* Trending Categories */}
          <section id="trending-categories" className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-2xl font-bold text-foreground"
              >
                Trending Categories
              </motion.h2>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCategories("left")}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={() => scrollCategories("right")}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            <div className="relative">
              <div
                id="categories-container"
                className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {trendingCategories.map((cat, index) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() =>
                      navigate(`/category/${categoryToSlug(cat.category)}`)
                    }
                    className="min-w-[140px] bg-card rounded-2xl p-6 text-center hover:shadow-elevated transition-all cursor-pointer group snap-start"
                  >
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <cat.icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {cat.name}
                    </h3>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Best Selling Section */}
          {loading ? (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Best Selling Smartphones
                </h2>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-2xl p-4 animate-pulse"
                  >
                    <div className="aspect-square bg-secondary rounded-xl mb-4"></div>
                    <div className="h-4 bg-secondary rounded mb-2"></div>
                    <div className="h-6 bg-secondary rounded"></div>
                  </div>
                ))}
              </div>
            </section>
          ) : bestSelling.length > 0 ? (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold text-foreground"
                >
                  Best Selling Smartphones
                </motion.h2>
                <Button
                  type="button"
                  variant="link"
                  className="text-primary"
                  onClick={() =>
                    setVisibleCounts((prev) => ({
                      ...prev,
                      bestSelling: Math.min(
                        bestSellingAll.length,
                        prev.bestSelling + 8,
                      ),
                    }))
                  }
                >
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
                {bestSelling.map((phone, index) => (
                  <ProductCard
                    key={phone.groupId}
                    phone={phone}
                    index={index}
                    type="new"
                    onClick={() => navigate(`/product/new/${phone.groupId}`)}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Best Selling Smartphones
                </h2>
              </div>
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">
                  No products available at the moment.
                </p>
              </div>
            </section>
          )}

          {/* Shop By Budget */}
          <section className="mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold text-foreground mb-6"
            >
              Shop Mobile By Budget
            </motion.h2>
            <div className="relative -mx-4 px-4 py-8 rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-black backdrop-blur-lg border border-green-500/20 shadow-2xl shadow-green-500/10">
              <div className="flex flex-wrap gap-3 justify-center">
                {budgetRanges.map((range, index) => (
                  <motion.button
                    key={range.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedBudget(range.label);
                      const params = new URLSearchParams();
                      params.append("category", "MOBILE");
                      params.append("minPrice", range.min.toString());
                      if (range.max !== Infinity) {
                        params.append("maxPrice", range.max.toString());
                      } else {
                        params.append("maxPrice", "1000000");
                      }
                      navigate(`/products?${params.toString()}`);
                    }}
                    className={`px-4 py-2 rounded-full border transition-all cursor-pointer hover:border-primary hover:bg-primary/5 ${
                      selectedBudget === range.label
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border"
                    }`}
                  >
                    {range.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </section>

          {/* Featured Categories */}
          <section className="mb-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl font-bold text-foreground mb-6"
            >
              Featured Categories
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {featuredCategories.map((cat, index) => {
                const getNavigationPath = (categoryName: string) => {
                  // Map to special category keys
                  const categoryMap = {
                    Audio: "audio",
                    "Sports & Outdoors": "sports",
                    Photography: "photography",
                    "Smart Watches": "smartwatch",
                  };

                  const specialKey =
                    categoryMap[categoryName as keyof typeof categoryMap];
                  if (specialKey) {
                    return `/products?specialCategory=${specialKey}`;
                  }

                  // Fallback for other categories
                  const categorySlug = categoryName
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/&/g, "");
                  return `/category/${categorySlug}`;
                };

                return (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => navigate(getNavigationPath(cat.name))}
                    className="relative rounded-2xl overflow-hidden group cursor-pointer hover:shadow-elevated transition-all duration-300 hover:scale-[1.02]"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end p-4">
                      <h3 className="text-primary-foreground font-semibold group-hover:text-primary transition-colors">
                        {cat.name}
                      </h3>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* Flagship Phones */}
          {flagship.length > 0 ? (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold text-foreground"
                >
                  Flagship Smartphones
                </motion.h2>
                <Button
                  type="button"
                  variant="link"
                  className="text-primary"
                  onClick={() =>
                    setVisibleCounts((prev) => ({
                      ...prev,
                      flagship: Math.min(
                        flagshipAll.length,
                        prev.flagship + 8,
                      ),
                    }))
                  }
                >
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
                {flagship.map((phone, index) => (
                  <ProductCard
                    key={phone.groupId}
                    phone={phone}
                    index={index}
                    type="new"
                    onClick={() => navigate(`/product/new/${phone.groupId}`)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Mid-Range Phones */}
          {midRange.length > 0 ? (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="text-2xl font-bold text-foreground"
                >
                  Best Mid-Range Smartphones
                </motion.h2>
                <Button
                  type="button"
                  variant="link"
                  className="text-primary"
                  onClick={() =>
                    setVisibleCounts((prev) => ({
                      ...prev,
                      midRange: Math.min(
                        midRangeAll.length,
                        prev.midRange + 8,
                      ),
                    }))
                  }
                >
                  See All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
                {midRange.map((phone, index) => (
                  <ProductCard
                    key={phone.groupId}
                    phone={phone}
                    index={index}
                    type="new"
                    onClick={() => navigate(`/product/new/${phone.groupId}`)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Charger & Adapters Banner */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <Card
              onClick={() => navigate("/accessories")}
              className="bg-gradient-to-r from-primary/10 to-accent overflow-hidden cursor-pointer hover:shadow-elevated transition-all duration-300 hover:scale-[1.02]"
            >
              <CardContent className="p-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Charger & Adapters
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    The Power Behind Your Products, Rechargeable
                  </p>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/accessories");
                    }}
                    className="btn-gradient rounded-full"
                  >
                    Explore → <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="hidden md:block">
                  <img
                    src="https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=200&h=150&fit=crop"
                    alt="Chargers"
                    className="rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function ProductCard({
  phone,
  index,
  type,
  onClick,
}: {
  phone: ProductGroup;
  index: number;
  type?: string;
  onClick?: () => void;
}) {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    const activeVariant = phone.variants[0];
    addToCart({
      id: activeVariant?.variantId || phone.groupId,
      name: phone.name,
      price: activeVariant?.price || phone.minPrice,
      image: activeVariant?.image || phone.image,
      variantId: activeVariant?.variantId,
      selectedColor: activeVariant?.color,
      selectedStorage: activeVariant?.storage,
    });
    navigate("/cart");
  };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="cursor-pointer group h-full"
    >
      <Card className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-elevated h-[220px] sm:h-[240px] flex flex-col w-full overflow-hidden">
        <CardContent className="p-0 flex flex-col h-full">
          <div className="relative overflow-hidden bg-secondary rounded-t-sm sm:rounded-t-xl h-[120px] sm:h-[130px]">
            {phone.rating && (
              <div className="absolute top-0.5 left-0.5 sm:top-3 sm:left-3 z-30 bg-black/60 backdrop-blur-sm text-white text-[6px] sm:text-xs font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                <Star className="w-1.5 h-1.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                {phone.rating}
              </div>
            )}

            <img
              src={phone.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"}
              alt={phone.name}
              onError={(e) => {
                e.currentTarget.src =
                  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop";
              }}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-foreground text-[7px] sm:text-[8px] md:text-sm line-clamp-2 mb-1 min-h-[20px] sm:min-h-0">
                {phone.name}
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
              {phone.discount &&
                phone.originalPrice &&
                phone.originalPrice > phone.minPrice && (
                  <span className="text-muted-foreground text-[6px] sm:text-xs line-through">
                    ₹{Math.round(phone.originalPrice).toLocaleString("en-IN")}
                  </span>
                )}
              <span className="text-foreground font-black text-[9px] sm:text-sm">
                ₹{phone.minPrice.toLocaleString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
