import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { BrandCarousel } from "@/components/BrandCarousel";
import { ServicesPromo } from "@/components/ServicesPromo";
import { PopularProducts } from "@/components/PopularProducts";
import { UsedPhones } from "@/components/UsedPhones";
import { Gallery } from "@/components/Gallery";
import { Stats } from "@/components/Stats";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { useAdmin } from "@/contexts/AdminContext";

const Index = () => {
  const { galleryImages } = useAdmin();

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="overflow-x-hidden w-full max-w-full">
        <Hero />
        <div className="pt-24">
          <Categories />
        </div>
        <BrandCarousel />
        <ServicesPromo />
        <PopularProducts />
        <UsedPhones />
        <Gallery />
        <Stats />
        
        {galleryImages.length > 0 && (
          <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground">Recent Gallery</h2>
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
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;