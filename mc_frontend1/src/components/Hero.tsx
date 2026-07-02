import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/contexts/AdminContext";
import { useEffect, useState, useCallback } from "react";
import { fetchHeroAsset } from "@/services/assetService";
import { fetchPublicResources, PublicResource } from "@/lib/publicResources";

export function Hero() {
  const navigate = useNavigate();
  const { heroSettings } = useAdmin();
  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [savedHero, setSavedHero] = useState<PublicResource | null>(null);

  const loadHeroImage = useCallback(async () => {
    try {
      const resources = await fetchPublicResources("banner");
      const hero = resources.find((item) => item.data?.bannerType === "hero");
      if (hero) {
        setSavedHero(hero);
        setBackgroundImage(String(hero.data?.image || ""));
        return;
      }
      const response = await fetchHeroAsset();
      if (response.url) setBackgroundImage(response.url);
    } catch (err) {
      console.error("Failed to load hero image:", err);
    }
  }, []);

  useEffect(() => { loadHeroImage(); }, [loadHeroImage]);
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "admin_heroSettings" || e.key === "mc_asset_update") loadHeroImage();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadHeroImage]);
  useEffect(() => {
    const handleAssetUpdate = () => loadHeroImage();
    window.addEventListener("mc_asset_update", handleAssetUpdate);
    return () => window.removeEventListener("mc_asset_update", handleAssetUpdate);
  }, [loadHeroImage]);

  const tagline = String(savedHero?.data?.tagline || heroSettings?.tagline || "New Arrivals 2026");
  const title = String(savedHero?.title || savedHero?.data?.title || heroSettings?.title || "Premium Mobiles &");
  const titleHighlight = heroSettings?.titleHighlight || "Accessories";
  const subtitle = String(savedHero?.data?.subtitle || heroSettings?.subtitle || "Upgrade Your Lifestyle Today");

  return (
    <section className="pt-40 lg:pt-36 pb-0 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Left: Large Hero Banner ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[420px] cursor-pointer group"
            onClick={() => navigate("/mobiles-accessories")}
          >
            {/* Background */}
            <div className="absolute inset-0">
              {backgroundImage && backgroundImage.trim() !== "" ? (
                <img
                  src={backgroundImage}
                  alt="Hero Background"
                  onError={(e) => { e.currentTarget.src = "/hero.jpg"; }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <img
                  src="/hero.jpg"
                  alt="Hero Background"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
            </div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />

            {/* Content */}
            <div className="relative z-10 p-8 md:p-12 flex flex-col justify-end h-full min-h-[320px] sm:min-h-[420px]">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-primary font-semibold text-sm uppercase tracking-widest mb-3"
              >
                {tagline}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight"
              >
                {title}
                {!savedHero && (
                  <><br /><span className="text-primary">{titleHighlight}</span></>
                )}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-base mb-6 max-w-md"
              >
                {subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="btn-gradient text-white rounded-full px-8 shadow-elevated hover:shadow-soft transition-all"
                  onClick={(e) => { e.stopPropagation(); navigate("/mobiles-accessories"); }}
                >
                  Shop Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-white/40 text-white hover:bg-white/20 rounded-full px-8"
                  onClick={(e) => { e.stopPropagation(); navigate("/services"); }}
                >
                  Our Services
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* ── Right: 2 Mini Promo Banners ── */}
          <div className="flex flex-col gap-4">
            {/* Mini Banner 1 — Accessories */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              onClick={() => navigate("/accessories")}
              className="relative rounded-2xl overflow-hidden flex-1 min-h-[150px] cursor-pointer group"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle at 70% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)" }}
              />
              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-purple-200 text-xs font-semibold uppercase tracking-widest mb-1">New Arrivals</p>
                  <h3 className="text-white text-xl font-bold leading-tight">Premium<br />Earbuds</h3>
                </div>
                <button className="self-start flex items-center gap-2 text-white text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full">
                  Shop Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-80 transition-opacity">
                <ShoppingBag className="w-20 h-20 text-white/40" />
              </div>
            </motion.div>

            {/* Mini Banner 2 — Repair Services */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              onClick={() => navigate("/services")}
              className="relative rounded-2xl overflow-hidden flex-1 min-h-[150px] cursor-pointer group"
              style={{
                background: "linear-gradient(135deg, #0d5c63 0%, #00897b 50%, #00acc1 100%)",
              }}
            >
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)" }}
              />
              <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                <div>
                  <p className="text-teal-200 text-xs font-semibold uppercase tracking-widest mb-1">Expert Repair</p>
                  <h3 className="text-white text-xl font-bold leading-tight">Phone Repair<br />Services</h3>
                </div>
                <button className="self-start flex items-center gap-2 text-white text-sm font-semibold bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-full">
                  Book Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 group-hover:opacity-80 transition-opacity">
                <ShoppingBag className="w-20 h-20 text-white/40" />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
