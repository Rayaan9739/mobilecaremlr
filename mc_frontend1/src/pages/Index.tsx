import { useState, useEffect } from "react";
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

const API_BASE =
  import.meta.env.VITE_API_BASE?.toString() || "http://localhost:5000/api";

interface HeroSettings {
  tagline?: string;
  title?: string;
  titleHighlight?: string;
  subtitle?: string;
  backgroundImage?: string;
}

interface Technician {
  id: number;
  name: string;
  role: string;
  image: string;
  yearsOfExperience?: number;
  rating?: number;
}

interface GalleryImage {
  id: number;
  url: string;
  alt?: string;
}

interface Service {
  id: number;
  name: string;
  description: string;
  price: string;
  duration: string;
  icon: string;
}

interface Content {
  hero: HeroSettings;
  technicians: Technician[];
  gallery: GalleryImage[];
  services: Service[];
}

const defaultContent: Content = {
  hero: {
    tagline: "Get best mobile experience with us",
    title: "Premium Mobiles &",
    titleHighlight: "Accessories",
    subtitle: "Upgrade Your Lifestyle Today",
  },
  technicians: [],
  gallery: [],
  services: [],
};

const Index = () => {
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_BASE}/content`);
        if (response.ok) {
          const data = await response.json();
          setContent({
            hero: data.hero ? JSON.parse(data.hero) : defaultContent.hero,
            technicians: data.technicians
              ? JSON.parse(data.technicians)
              : defaultContent.technicians,
            gallery: data.gallery
              ? JSON.parse(data.gallery)
              : defaultContent.gallery,
            services: data.services
              ? JSON.parse(data.services)
              : defaultContent.services,
          });
        } else {
          setContent(defaultContent);
        }
      } catch (error) {
        console.error("Failed to fetch content:", error);
        setContent(defaultContent);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden w-full max-w-full">
      <Header />
      <main className="overflow-x-hidden w-full max-w-full">
        <Hero heroSettings={content?.hero} />
        <div className="pt-24">
          <Categories />
        </div>
        <BrandCarousel />
        <ServicesPromo services={content?.services} />
        <PopularProducts />
        <UsedPhones />
        <Gallery galleryImages={content?.gallery} />
        <Stats />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
