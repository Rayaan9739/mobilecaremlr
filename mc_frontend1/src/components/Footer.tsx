import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { REPAIR_ISSUES } from "@/constants/repairIssues";
import { COMPANY_LOGO_SRC } from "@/utils/companyLogo";
import { Link } from "react-router-dom";

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
    <footer className="bg-[#0d1f3c] text-white pt-16 pb-6 overflow-x-hidden">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link to="/" className="flex items-center gap-2 mb-5">
              <img src={COMPANY_LOGO_SRC} alt="MobileCare Logo" className="w-10 h-10 rounded-xl object-cover" />
              <span className="text-xl font-bold">
                Mobile<span className="text-primary">Care</span>
              </span>
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Your trusted destination for premium mobiles, accessories, and expert repair services.
              Quality you can trust, prices you'll love.
            </p>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
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
            <h3 className="text-base font-bold mb-5 text-white">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-white/60 hover:text-primary transition-colors text-sm flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {link.name}
                  </Link>
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
            <h3 className="text-base font-bold mb-5 text-white">Our Services</h3>
            <ul className="space-y-3">
              {REPAIR_ISSUES.slice(0, 6).map((issue) => (
                <li key={issue}>
                  <button
                    onClick={() => openModal(issue)}
                    className="text-white/60 hover:text-primary transition-colors text-sm text-left flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary" />
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
            <h3 className="text-base font-bold mb-5 text-white">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Prakash+Beedi+Building,+K.S.+Rao+Road,+Near+Passport+Office,+Kodialbail,+Mangaluru,+Karnataka+575003"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-primary transition-colors text-sm leading-relaxed"
                >
                  Prakash Beedi Building, K.S. Rao Road, Near Passport Office, Kodialbail, Mangaluru 575003
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="text-white/60 text-sm">
                  <a href="tel:08242448899" className="hover:text-primary transition-colors">0824-2448899</a>,{" "}
                  <a href="tel:9845145662" className="hover:text-primary transition-colors">9845145662</a>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href="mailto:info@mobilecaremlr.com" className="text-white/60 hover:text-primary transition-colors text-sm">
                  info@mobilecaremlr.com
                </a>
              </li>
            </ul>
            {/* Map */}
            <div className="mt-4 rounded-xl overflow-hidden h-36 w-full border border-white/10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.574682367857!2d74.84057531482173!3d12.869797990876!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba35a4d0d3e7a49%3A0x793c2e9c8d1d3e6a!2sPrakash%20Beedi%20Building%2C%20K.S.%20Rao%20Rd%2C%20Kodialbail%2C%20Mangalore%2C%20Karnataka%20575003!5e0!3m2!1sen!2sin!4v1645000000000!5m2!1sen!2sin"
                width="100%" height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Mobile Care Location"
              />
            </div>
          </motion.div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-white/10 pt-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-5">
            <div>
              <h3 className="text-base font-bold mb-1">Subscribe to Our Newsletter</h3>
              <p className="text-white/60 text-sm">Get the latest offers and updates in your inbox.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:min-w-[400px]">
              <Input
                type="email"
                placeholder="Your email address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-full px-5"
              />
              <Button className="btn-gradient text-white rounded-full px-6 whitespace-nowrap shadow-soft hover:shadow-elevated transition-all">
                <Send className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-sm">Copyright 2026 © MobileCare. All rights reserved.</p>
          <div className="flex items-center gap-4 text-white/50 text-xs">
            <a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
