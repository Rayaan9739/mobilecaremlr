import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useAdmin } from "@/contexts/AdminContext";

interface GalleryProps {
  galleryImages?: {
    id: number;
    url: string;
    alt?: string;
  }[];
}

export function Gallery(props: GalleryProps) {
  const { galleryImages: contextGalleryImages } = useAdmin();
  const galleryImages = props.galleryImages ?? contextGalleryImages ?? [];
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    const handleMouseEnter = () => cancelAnimationFrame(animationId);
    const handleMouseLeave = () => {
      animationId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener("mouseenter", handleMouseEnter);
    scrollContainer.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationId);
      scrollContainer.removeEventListener("mouseenter", handleMouseEnter);
      scrollContainer.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [galleryImages]);

  // Duplicate images for seamless loop
  const duplicatedImages = [...galleryImages, ...galleryImages];

  return (
    <section className="py-24 md:py-32 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">
            Our Store
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Recent Gallery
          </h2>
        </motion.div>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-hidden"
          style={{ scrollBehavior: "auto" }}
        >
          {duplicatedImages.map((image, index) => (
            <motion.div
              key={`${image.id}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (index % galleryImages.length) * 0.1 }}
              className="relative flex-shrink-0 overflow-hidden rounded-2xl group cursor-pointer"
              style={{
                width: index % 3 === 0 ? "350px" : "250px",
                height: index % 3 === 0 ? "400px" : "250px",
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
