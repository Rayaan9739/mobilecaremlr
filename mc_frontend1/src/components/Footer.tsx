import { motion } from "framer-motion";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { REPAIR_ISSUES } from "@/constants/repairIssues";

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about" },
  { name: "Mobiles and Accessories", href: "/mobiles-accessories" },
  { name: "Services", href: "/services" },
  { name: "Offers", href: "/offers" },
  { name: "Contact", href: "/contact" },
];

export function Footer() {
  const { openModal } = useRepairBooking();
  return (
    <footer className="bg-foreground text-primary-foreground pt-20 pb-8 overflow-x-hidden box-border">
      <div className="container mx-auto px-4 max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Logo & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <a href="#" className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="MobileCare Logo" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-bold">
                Mobile<span className="text-primary"> Care</span>
              </span>
            </a>
            <p className="text-primary-foreground/70 mb-6 leading-relaxed">
              Your trusted destination for premium mobiles, accessories, and
              expert repair services. Quality you can trust, prices you'll love.
            </p>
            <div className="flex items-center gap-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-lg font-bold mb-6">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-primary-foreground/70 hover:text-primary transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Services */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-bold mb-6">Our Services</h3>
            <ul className="space-y-3">
              {REPAIR_ISSUES.map((issue) => (
                <li key={issue}>
                  <button
                    onClick={() => openModal(issue)}
                    className="text-primary-foreground/70 hover:text-primary transition-colors text-left"
                  >
                    {issue}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-lg font-bold mb-6">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-6 h-6 text-primary mt-0.5 flex-shrink-0" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Prakash+Beedi+Building,+K.S.+Rao+Road,+Near+Passport+Office,+Kodialbail,+Mangaluru,+Karnataka+575003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/70 hover:text-primary transition-colors"
                >
                  Prakash Beedi Building, K.S. Rao Road, Near Passport Office,
                  Kodialbail, Mangaluru, Karnataka 575003.
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70">
                  <a href="tel:08242448899" className="hover:text-primary transition-colors">0824 - 2448899</a>,{" "}
                  <a href="tel:9845145662" className="hover:text-primary transition-colors">9845145662</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <a
                  href="mailto:info@mobilecaremlr.com"
                  className="text-primary-foreground/70 hover:text-primary transition-colors"
                >
                  info@mobilecaremlr.com
                </a>
              </li>
            </ul>
            {/* Google Map */}
            <div className="mt-4 rounded-lg overflow-hidden h-40 w-full">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.574682367857!2d74.84057531482173!3d12.869797990876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba35a4d0d3e7a49%3A0x793c2e9c8d1d3e6a!2sPrakash%20Beedi%20Building%2C%20K.S.%20Rao%20Rd%2C%20Kodialbail%2C%20Mangalore%2C%20Karnataka%20575003!5e0!3m2!1sen!2sin!4v1645000000000!5m2!1sen!2sin"
                width="100%"
                height="160"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mobile Care Location"
              ></iframe>
            </div>
          </motion.div>
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-primary-foreground/10 pt-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">
                Subscribe to Our Newsletter
              </h3>
              <p className="text-primary-foreground/70">
                Get the latest offers and updates delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto min-w-0">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 rounded-full px-6 w-full"
              />
              <Button className="btn-gradient text-primary-foreground rounded-full px-6 w-full sm:w-auto whitespace-nowrap">
                <Send className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <div className="border-t border-primary-foreground/10 pt-8 text-center">
          <p className="text-primary-foreground text-sm">
            Copyright 2026 © MobileCare. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}