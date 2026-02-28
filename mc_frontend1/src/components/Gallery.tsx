import { motion } from "framer-motion";

export interface GalleryImage {
  id: number | string;
  url: string;
  alt?: string;
}

export function Gallery({ images }: { images?: GalleryImage[] }) {
  if (!images || images.length === 0) return null;

  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-bold">Our Store</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <motion.div key={img.id} whileHover={{ scale: 1.03 }}>
              <img
                src={img.url}
                alt={img.alt ?? "Gallery"}
                className="w-full h-56 object-cover rounded-xl"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}