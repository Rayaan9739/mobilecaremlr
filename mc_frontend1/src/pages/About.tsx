import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Smartphone, Award, Users, Truck, Shield, Headphones, Star, Clock } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-32 md:pt-40">
        {/* 1️⃣ Hero Section */}
        <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/10 to-secondary">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                About Mobile Care
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
                Your trusted destination for premium smartphones, accessories, and expert repair services in Mangaluru.
              </p>
              <a
                href="/contact"
                className="inline-block mt-6 px-6 py-3 bg-primary text-white font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Get in Touch
              </a>
            </motion.div>
          </div>
        </section>

        {/* 2️⃣ Company Overview Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  Your Trusted Smartphone Destination
                </h2>
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    At Mobile Care, we specialize in helping you find and discover the best smartphones and accessories to transform the way you live. From great deals to the knowledge of our in-store experts, we'll connect you with the best cell phones, cases, and accessories.
                  </p>
                  <p>
                    We are a genuine smartphone seller that expertise in the field. We focus one and only for mobile and its accessories. That's what makes us different from the other retailers. We don't compromise on quality. We know what type of smartphones the new generation wants. We sell genuine and new smartphones. We wish to make India digital that's why we provide the best smartphones in India.
                  </p>
                  <p>
                    At Mobile Care, our endeavor has always been fulfilling every customers' Smartphone requirement by helping customers choose the best smart phones, as per their needs. Mobile Care's efficient, well-trained and knowledgeable team validates the Smartphone authenticity and Quality so customer receives the best value for money.
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <img
                  src="/about.png"
                  alt="Mobile Care Store"
                  className="w-full h-auto rounded-2xl shadow-lg"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3️⃣ Mission & Vision / Values Section */}
        <section className="py-16 md:py-20 bg-card">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Our Values
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The core principles that drive everything we do at Mobile Care
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Award,
                  title: "Genuine Products",
                  description: "We sell only 100% genuine and new smartphones. Every device is quality validated by our expert team."
                },
                {
                  icon: Users,
                  title: "Expert Guidance",
                  description: "Our knowledgeable team provides objective advice to help you choose the perfect phone and plan."
                },
                {
                  icon: Shield,
                  title: "Quality Assured",
                  description: "We never compromise on quality. Every smartphone undergoes thorough authenticity verification."
                },
                {
                  icon: Star,
                  title: "Customer First",
                  description: "Your satisfaction is our priority. We help find the best phone as per your needs and budget."
                },
                {
                  icon: Truck,
                  title: "In-Store Experience",
                  description: "Visit us to get hands-on experience with the latest smartphones from all major brands."
                },
                {
                  icon: Headphones,
                  title: "After-Sales Support",
                  description: "We're here to help even after your purchase with repairs and technical support."
                }
              ].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background rounded-xl p-6 shadow-sm border"
                >
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 4️⃣ Why Choose Us Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Why Choose Mobile Care
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experience the difference of shopping with Mangaluru's trusted smartphone experts
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Smartphone,
                  title: "All Major Brands",
                  description: "Apple, Samsung, Xiaomi, Lenovo, Oppo, Asus, Huawei, Infocus, Motorola, Vivo and more."
                },
                {
                  icon: Award,
                  title: "Best Deals",
                  description: "Great deals on the latest smartphones with competitive pricing."
                },
                {
                  icon: Users,
                  title: "Expert Setup",
                  description: "We set up your new phone and show you all the cool features."
                },
                {
                  icon: Shield,
                  title: "Plan Comparison",
                  description: "Objective advice on choosing the perfect cell phone plan from major carriers."
                },
                {
                  icon: Star,
                  title: "Authenticity Guaranteed",
                  description: "Every device is quality validated by our trained team."
                },
                {
                  icon: Clock,
                  title: "Quick Service",
                  description: "Fast and efficient service for all your smartphone needs."
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-4"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5️⃣ Stats Section */}
        <section className="py-16 md:py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { number: "10+", label: "Years Experience" },
                { number: "50+", label: "Phone Brands" },
                { number: "10000+", label: "Happy Customers" },
                { number: "100%", label: "Genuine Products" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="text-3xl md:text-4xl font-bold mb-1">
                    {stat.number}
                  </div>
                  <div className="text-sm opacity-80">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 6️⃣ CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Find Your Perfect Phone?
              </h2>
              <p className="text-muted-foreground mb-6">
                Visit our store or contact us today to explore the latest smartphones and get expert advice.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="px-6 py-3 bg-primary text-white font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  Contact Us
                </a>
                <a
                  href="/mobiles-accessories"
                  className="px-6 py-3 border border-primary text-primary font-medium rounded-full hover:bg-primary/10 transition-colors"
                >
                  Browse Phones
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
