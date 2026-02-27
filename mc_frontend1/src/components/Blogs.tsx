import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";

const blogs = [
  {
    id: 1,
    title: "Top 10 Smartphones to Buy in 2024",
    excerpt:
      "Discover the best smartphones of the year with our comprehensive guide to the latest features and value picks.",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=400",
    date: "Jan 15, 2024",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "How to Extend Your Phone Battery Life",
    excerpt:
      "Simple tips and tricks to maximize your smartphone battery performance and avoid common charging mistakes.",
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?q=80&w=400",
    date: "Jan 12, 2024",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "New Year Special: 20% Off All Repairs",
    excerpt:
      "Celebrate the new year with amazing discounts on all phone repair services. Limited time offer!",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=400",
    date: "Jan 10, 2024",
    readTime: "2 min read",
  },
];

export function Blogs() {
  return (
    <section className="py-24 md:py-32 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="text-primary font-display italic text-lg mb-2">Stay Updated</p>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">Latest News & Offers</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.map((blog, index) => (
            <motion.article
              key={blog.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group"
            >
              <div className="bg-card rounded-3xl overflow-hidden shadow-card card-hover">
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {blog.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {blog.readTime}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {blog.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 line-clamp-2">{blog.excerpt}</p>

                  <button className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                    Read More <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
