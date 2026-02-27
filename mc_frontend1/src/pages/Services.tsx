import { motion } from "framer-motion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Monitor, 
  Battery, 
  Wifi, 
  Camera, 
  Mic, 
  HardDrive, 
  Wrench,
  Shield,
  Clock,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { useAdmin } from "@/contexts/AdminContext";
import { useRepairBooking } from "@/contexts/RepairBookingContext";

const iconMap: Record<string, any> = {
  monitor: Monitor,
  battery: Battery,
  wifi: Wifi,
  camera: Camera,
  mic: Mic,
  "hard-drive": HardDrive,
  smartphone: Smartphone,
  wrench: Wrench,
};

const whyChooseUs = [
  { icon: Shield, title: "90-Day Warranty", description: "All repairs covered with warranty" },
  { icon: Clock, title: "Quick Turnaround", description: "Most repairs done same day" },
  { icon: CheckCircle2, title: "Genuine Parts", description: "OEM quality spare parts only" },
];

export default function Services() {
  const { services } = useAdmin();
  const { openModal } = useRepairBooking();

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-36 md:pt-44 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-display mb-4">
              Mobile Repair <span className="text-gradient">Services</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-sm md:text-base">
              Expert repair services for all smartphone brands. Fast, reliable, and affordable with genuine parts and warranty.
            </p>
          </motion.div>

          {/* Why Choose Us */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
          >
            {whyChooseUs.map((item, index) => (
              <div
                key={index}
                className="bg-card rounded-2xl p-6 text-center hover:shadow-elevated transition-all"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-foreground text-base md:text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm mt-2">{item.description}</p>
              </div>
            ))}
          </motion.div>

          {/* Services Grid */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground text-center mb-8"
          >
            Our Services
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.icon] || Wrench;
              
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-elevated transition-all duration-300 group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="font-bold text-foreground text-base md:text-lg mb-2">{service.title}</h3>
                      <p className="text-muted-foreground text-xs md:text-sm mb-4">{service.description}</p>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-primary font-semibold">{service.price}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {service.duration}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-accent rounded-3xl p-8 md:p-12 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
              Need a Repair?
            </h2>
            <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto text-sm md:text-base">
              Book your repair today and get your device fixed by certified technicians with genuine parts.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              className="rounded-full px-8"
              onClick={() => openModal()}
            >
              Book Repair Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
