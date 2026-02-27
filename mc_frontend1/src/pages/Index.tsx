import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { BrandCarousel } from "@/components/BrandCarousel";
import { ServicesPromo } from "@/components/ServicesPromo";
import { PopularProducts } from "@/components/PopularProducts";
import { UsedPhones } from "@/components/UsedPhones";
import { Gallery } from "@/components/Gallery";
import { Stats } from "@/components/Stats";
import { Team } from "@/components/Team";
import { Testimonials } from "@/components/Testimonials";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

const Index = () => {
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
        <Team />
        <Testimonials />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;