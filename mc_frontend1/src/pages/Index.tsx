import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { BrandCarousel } from "@/components/BrandCarousel";
import { ServicesPromo } from "@/components/ServicesPromo";
import { PopularProducts } from "@/components/PopularProducts";
import { WeeklyTrendingProducts } from "@/components/WeeklyTrendingProducts";
import { UsedPhones } from "@/components/UsedPhones";
import { Gallery } from "@/components/Gallery";
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

  // Fetch gallery images from public API on mount
  useEffect(() => {
    loadGalleryImages();
  }, [loadGalleryImages]);

  // Listen for storage changes to refresh after admin upload
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_galleryImages" || e.key === "mc_asset_update") {
        loadGalleryImages();
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadGalleryImages]);

  // Also listen for custom event (for same-tab updates)
  useEffect(() => {
    const handleAssetUpdate = () => loadGalleryImages();
    window.addEventListener("mc_asset_update", handleAssetUpdate);
    return () =>
      window.removeEventListener("mc_asset_update", handleAssetUpdate);
  }, [loadGalleryImages]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="overflow-x-hidden w-full max-w-full">
        <Hero />
        <WeeklyTrendingProducts />
        <div className="pt-24">
          <Categories />
        </div>
        <section className="py-10 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="mb-6 flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                Shop by Brand
              </h2>
              <div className="hidden h-px max-w-[120px] flex-1 bg-border md:block" />
            </div>
            <BrandCarousel />
          </div>
        </section>
        <ServicesPromo />
        <PopularProducts />
        <UsedPhones />
        <Stats />

        {galleryImages.length > 0 ? (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
                Our Store
              </h2>
            </div>
            <div className="relative overflow-hidden group">
              <div className="flex animate-scroll group-hover:[animation-play-state:paused] gap-4">
                {[...galleryImages, ...galleryImages].map((image, index) => (
                  <div
                    key={`${image.id}-${index}`}
                    className="flex-shrink-0 w-64 h-64 rounded-lg overflow-hidden shadow-lg"
                  >
                    <img
                      src={image.url}
                      alt={image.title || "Gallery"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : adminGalleryImages.length > 0 ? (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">
                Recent Gallery
              </h2>
            </div>
            <div className="relative overflow-hidden group">
              <div className="flex animate-scroll group-hover:[animation-play-state:paused] gap-4">
                {[...adminGalleryImages, ...adminGalleryImages].map(
                  (image, index) => (
                    <div
                      key={`${image.id}-${index}`}
                      className="flex-shrink-0 w-64 h-64 rounded-lg overflow-hidden shadow-lg"
                    >
                      <img
                        src={image.url}
                        alt={image.alt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ),
                )}
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
