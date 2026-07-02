import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TrustBar } from "@/components/TrustBar";
import { Categories } from "@/components/Categories";
import { BrandCarousel } from "@/components/BrandCarousel";
import { ServicesPromo } from "@/components/ServicesPromo";
import { PopularProducts } from "@/components/PopularProducts";
import { WeeklyTrendingProducts } from "@/components/WeeklyTrendingProducts";
import { UsedPhones } from "@/components/UsedPhones";
import { Stats } from "@/components/Stats";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useAdmin } from "@/contexts/AdminContext";
import { useEffect, useState, useCallback } from "react";
import { fetchGalleryAssets, GalleryImage } from "@/services/assetService";

const Index = () => {
  const { galleryImages: adminGalleryImages } = useAdmin();
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  const loadGalleryImages = useCallback(async () => {
    try {
      const response = await fetchGalleryAssets();
      if (response.images && response.images.length > 0) {
        setGalleryImages(response.images);
      }
    } catch (err) {
      console.error("Failed to load gallery images:", err);
    }
  }, []);

  useEffect(() => { loadGalleryImages(); }, [loadGalleryImages]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_galleryImages" || e.key === "mc_asset_update") {
        loadGalleryImages();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadGalleryImages]);

  useEffect(() => {
    const handleAssetUpdate = () => loadGalleryImages();
    window.addEventListener("mc_asset_update", handleAssetUpdate);
    return () => window.removeEventListener("mc_asset_update", handleAssetUpdate);
  }, [loadGalleryImages]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="overflow-x-hidden w-full max-w-full">

        {/* 1. Hero — split layout (large left + 2 mini right) */}
        <Hero />

        {/* 2. Trust Bar — Free Delivery · Secure Payment · Warranty · Support */}
        <TrustBar />

        {/* 3. Category Strip — circular icon scroll */}
        <Categories />

        {/* 4. Weekly Trending Products */}
        <WeeklyTrendingProducts />

        {/* 5. Shop by Brand */}
        <section className="py-10 bg-white border-b border-border">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">Explore</p>
              <h2 className="text-2xl font-bold text-foreground">Shop by Brand</h2>
            </div>
            <BrandCarousel />
          </div>
        </section>

        {/* 6. Services Promo */}
        <ServicesPromo />

        {/* 7. Popular / Featured Products */}
        <PopularProducts />

        {/* 8. Used Phones */}
        <UsedPhones />

        {/* 9. Stats */}
        <Stats />

        {/* 10. Gallery — marquee scroll */}
        {galleryImages.length > 0 ? (
          <section className="py-12 bg-white border-t border-border">
            <div className="container mx-auto px-4 mb-8">
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1 text-center">Our Store</p>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
                From Our Store
              </h2>
            </div>
            <div className="relative overflow-hidden group">
              <div className="flex animate-scroll group-hover:[animation-play-state:paused] gap-4">
                {[...galleryImages, ...galleryImages].map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="flex-shrink-0 w-64 h-64 rounded-2xl overflow-hidden shadow-soft border border-border"
                  >
                    <img
                      src={image.url}
                      alt={image.title || "Gallery"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : adminGalleryImages.length > 0 ? (
          <section className="py-12 bg-white border-t border-border">
            <div className="container mx-auto px-4 mb-8">
              <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1 text-center">Recent</p>
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
                Recent Gallery
              </h2>
            </div>
            <div className="relative overflow-hidden group">
              <div className="flex animate-scroll group-hover:[animation-play-state:paused] gap-4">
                {[...adminGalleryImages, ...adminGalleryImages].map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="flex-shrink-0 w-64 h-64 rounded-2xl overflow-hidden shadow-soft border border-border"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
