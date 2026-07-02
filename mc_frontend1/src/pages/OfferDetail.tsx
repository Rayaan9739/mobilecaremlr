import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Star } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdmin } from "@/contexts/AdminContext";
import { useProducts } from "@/contexts/ProductContext";
import { useCart } from "@/contexts/CartContext";
import { useRepairBooking } from "@/contexts/RepairBookingContext";
import { useAuth } from "@/contexts/AuthContext";
import { isValidPhoneNumber, toNormalizedPhoneNumber } from "@/lib/phone";
import { toast } from "sonner";
import { fetchPublicResources, PublicResource } from "@/lib/publicResources";

type OfferProductEntry = {
  productId: string;
  offerPrice: number;
  text?: string;
};

type DisplayOffer = {
  id: string | number;
  title: string;
  subtitle: string;
  description: string;
  tagline: string;
  image: string;
  endDate: string;
  products: OfferProductEntry[];
};

const formatPopupEndDate = (value: unknown) => {
  const text = String(value || "");
  return text ? text.slice(0, 10) : "Available now";
};

export default function OfferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { offers } = useAdmin();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { addOrderNotification } = useRepairBooking();
  const { user } = useAuth();
  const [popupOfferResources, setPopupOfferResources] = useState<PublicResource[]>([]);

  useEffect(() => {
    const loadPopupOffers = async () => {
      try {
        const resources = await fetchPublicResources("popup");
        setPopupOfferResources(
          resources.filter(
            (item) =>
              item.enabled &&
              Array.isArray(item.data?.offerProducts) &&
              item.data.offerProducts.length > 0,
          ),
        );
      } catch (error) {
        console.error("Failed to load popup offers:", error);
      }
    };

    loadPopupOffers();
  }, []);

  const popupOffers = useMemo<DisplayOffer[]>(
    () =>
      popupOfferResources.map((item) => ({
        id: item.id,
        title: item.title || String(item.data?.title || "Special Offer"),
        subtitle: "Limited Time Offer",
        description: String(item.data?.message || "Selected products at offer prices"),
        tagline: String(item.data?.message || "Tap to view offer products"),
        image: String(item.data?.image || ""),
        endDate: formatPopupEndDate(item.data?.scheduledTime),
        products: Array.isArray(item.data?.offerProducts)
          ? (item.data.offerProducts as OfferProductEntry[])
          : [],
      })),
    [popupOfferResources],
  );

  const adminOffers: DisplayOffer[] = offers.map((offer) => ({
    ...offer,
    products: offer.products.map((product) => ({
      productId: product.productId,
      offerPrice: product.offerPrice,
    })),
  }));

  const offer = [...popupOffers, ...adminOffers].find((o) => String(o.id) === String(id));

  const offerProducts = useMemo(() => {
    if (!offer) return [];

    const byId = new Map(products.map((p) => [String(p.id), p]));
    return offer.products
      .map((op) => {
        const p = byId.get(String(op.productId));
        if (!p) return null;
        return { product: p, offerPrice: op.offerPrice, text: op.text || "" };
      })
      .filter(Boolean) as { product: any; offerPrice: number; text: string }[];
  }, [offer, products]);

  const getProductDetailPath = (product: any) => {
    const category = String(product?.category || "")
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    if (category === "USED_PHONE" || category === "USED_PHONES") {
      return `/used-phones/${product.id}`;
    }

    return `/product/${category === "MOBILE" ? "new" : "accessory"}/${product.id}`;
  };

  const getOfferDetailNote = (product: any, offerPrice: number, text = "") => {
    const parts = [
      text ? String(text).trim() : "",
      offer?.title ? `Offer: ${offer.title}` : "",
      offerPrice < Number(product?.price || 0) ? "Special offer price" : "",
    ].filter(Boolean);

    return parts.join(" • ");
  };

  const handleBookOfferProduct = (product: any, offerPrice: number, text = "") => {
    const userPhone = user?.phone || "";
    if (!isValidPhoneNumber(userPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const formattedOfferPrice = `₹${Number(offerPrice || 0).toLocaleString("en-IN")}`;
    if (!window.confirm(`Book ${product.name} for ${formattedOfferPrice}?`)) {
      return;
    }

    addToCart(
      {
        id: product.id,
        productId: product.id,
        name: product.name,
        price: offerPrice,
        image: product.image,
        brand: product.brand,
        category: product.category,
        offerId: offer?.id,
        offerTitle: offer?.title,
        offerPrice,
        offerText: text,
        originalPrice: product.price,
      } as any,
      1,
    );
    navigate("/cart", { state: { autoBookNow: true } });
    return;

    addOrderNotification({
      name: user?.fullName || "Customer",
      mobileNumber: toNormalizedPhoneNumber(userPhone),
      message: `Booking started (Offer: ${offer?.title || "Offer"}): ${product.name} | â‚¹${Number(offerPrice).toLocaleString("en-IN")}`,
      productId: product.id,
      productName: product.name,
      price: offerPrice,
      offerId: offer?.id,
      offerTitle: offer?.title,
    });
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: offerPrice,
        image: product.image,
        brand: product.brand,
        category: product.category,
        offerId: offer?.id,
        offerTitle: offer?.title,
        offerPrice,
      } as any,
      1,
    );
    navigate("/cart", { state: { autoBookNow: true } });
  };

  if (!offer) {
    return (
      <div className="min-h-screen bg-secondary">
        <Header />
        <main className="pt-36 md:pt-44 pb-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Offer not found
            </h1>
            <Button onClick={() => navigate("/offers")}>Back to Offers</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-36 md:pt-44 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="hover:text-primary transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/offers" className="hover:text-primary transition-colors">
              Offers
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{offer.title}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {offer.title}
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              {offer.subtitle} {offer.description} â€¢ Valid Till:{" "}
              {offer.endDate}
            </p>
          </motion.div>

          {offerProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-base">
                No products selected for this offer yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {offerProducts.map(({ product, offerPrice, text }, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <div className="bg-white rounded-2xl border border-border hover:border-primary hover:shadow-elevated transition-all duration-300 overflow-hidden group text-left">
                    {/* Image */}
                    <div className="relative aspect-square bg-secondary/20 overflow-hidden">
                      {offerPrice && Number(offerPrice) < Number(product.price) && (
                        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{Math.round(((Number(product.price) - Number(offerPrice)) / Number(product.price)) * 100)}%
                        </div>
                      )}
                      {product.rating ? (
                        <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-soft">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                          {product.rating}
                        </div>
                      ) : null}
                      <img
                        src={
                          product.image ||
                          "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"
                        }
                        alt={product.name}
                        className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(getProductDetailPath(product), {
                            state: {
                              offerNote: getOfferDetailNote(product, offerPrice, text),
                              offerTitle: offer?.title || "",
                              offerPrice,
                            },
                          })
                        }
                        className="text-left w-full"
                      >
                        <h3 className="text-sm font-semibold text-foreground mb-1 line-clamp-2 leading-tight hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </button>
                      {text ? (
                        <p className="line-clamp-1 text-xs text-primary mb-2">{text}</p>
                      ) : null}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className="text-base font-black text-primary">
                          ₹{Number(offerPrice).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{Number(product.price).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() =>
                            handleBookOfferProduct(product, offerPrice, text)
                          }
                          className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs rounded-full btn-gradient"
                        >
                          Book Now
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            navigate(getProductDetailPath(product), {
                              state: {
                                offerNote: getOfferDetailNote(product, offerPrice, text),
                                offerTitle: offer?.title || "",
                                offerPrice,
                              },
                            })
                          }
                          className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs rounded-full"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
