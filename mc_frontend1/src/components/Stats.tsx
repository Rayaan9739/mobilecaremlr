import { motion } from "framer-motion";
import { Award, Wrench, Users, Smile } from "lucide-react";

const stats = [
  { icon: Award, value: "10+", label: "Years Experience", color: "text-amber-500", bg: "bg-amber-50" },
  { icon: Wrench, value: "5000+", label: "Repairs Done", color: "text-blue-500", bg: "bg-blue-50" },
  { icon: Users, value: "12K+", label: "Happy Customers", color: "text-green-500", bg: "bg-green-50" },
  { icon: Smile, value: "99.9%", label: "Success Rate", color: "text-primary", bg: "bg-primary/10" },
];

export function Stats() {
  return (
    <section className="py-14 bg-white border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-1">Our Numbers</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Why Choose Mobile Care</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl border border-border hover:border-primary hover:shadow-elevated transition-all duration-300 p-6 flex flex-col items-center text-center group"
            >
              <div className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <p className={`text-3xl font-black ${stat.color} mb-1`}>{stat.value}</p>
              <p className="text-sm font-semibold text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
