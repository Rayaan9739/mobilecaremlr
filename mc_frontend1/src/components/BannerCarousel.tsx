import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { fetchPublicResources, PublicResource } from "@/lib/publicResources";

const defaultBanners: PublicResource[] = [
  {
    id: "default-banner-mobile",
    title: "Latest Smartphones & Accessories",
    enabled: true,
    order: 0,
    data: {
      bannerType: "banner",
      subtitle: "Power, performance, and style in one place",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
      buttonText: "Explore Mobiles",
      buttonLink: "/category/mobile",
    },
  },
];

export function BannerCarousel() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<PublicResource[]>(defaultBanners);

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const resources = await fetchPublicResources("banner");
        const savedBanners = resources.filter(
          (item) => item.data?.bannerType !== "hero",
        );
        setBanners(savedBanners.length > 0 ? [savedBanners[0]] : defaultBanners);
      } catch (error) {
        console.error("Failed to load banners:", error);
        setBanners(defaultBanners);
      }
    };

    loadBanners();
  }, []);

  const current = banners[0];
  const image = String(current.data?.image || "");
  const subtitle = String(current.data?.subtitle || "");
  const buttonText = String(current.data?.buttonText || "Shop Now");
  const buttonLink = String(current.data?.buttonLink || "/products");

  return (
    <section className="bg-background py-4">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-foreground text-background">
          {image ? (
            <img
              src={image}
              alt={current.title || "Banner"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative z-10 flex min-h-56 flex-col justify-center p-6 sm:min-h-64 sm:p-10">
            <h2 className="max-w-2xl text-2xl font-bold sm:text-4xl">
              {current.title}
            </h2>
            {subtitle ? (
              <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
                {subtitle}
              </p>
            ) : null}
            <Button
              type="button"
              className="mt-6 w-fit rounded-full bg-white text-foreground hover:bg-white/90"
              onClick={() => navigate(buttonLink)}
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
