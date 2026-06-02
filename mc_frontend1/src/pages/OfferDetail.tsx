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
            <div className="grid grid-cols-3 lg:grid-cols-5 gap-1 sm:gap-2">
              {offerProducts.map(({ product, offerPrice, text }, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group h-full"
                >
                  <Card className="border-border hover:border-primary/50 transition-all duration-200 hover:shadow-md h-[220px] sm:h-[240px] flex flex-col w-full overflow-hidden">
                    <CardContent className="p-0 flex flex-col h-full">
                      <div className="relative overflow-hidden bg-secondary rounded-t-sm sm:rounded-t-xl h-[120px] sm:h-[130px]">
                        {product.rating ? (
                          <div className="absolute top-0.5 left-0.5 sm:top-3 sm:left-3 z-30 bg-black/60 backdrop-blur-sm text-white text-[6px] sm:text-xs font-bold px-1 py-0.5 rounded flex items-center gap-0.5">
                            <Star className="w-1.5 h-1.5 sm:w-3 sm:h-3 fill-yellow-400 text-yellow-400" />
                            {product.rating}
                          </div>
                        ) : null}
                        <img
                          src={
                            product.image ||
                            "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"
                          }
                          alt={product.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>

                      <div className="p-2 sm:p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate(getProductDetailPath(product))}
                            className="text-left"
                          >
                            <h3 className="font-bold text-foreground text-[8px] sm:text-sm line-clamp-2 mb-1 min-h-[20px] sm:min-h-0 hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                          </button>
                          {text ? (
                            <p className="line-clamp-1 text-[7px] text-primary sm:text-xs">
                              {text}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex items-baseline gap-2">
                            <span className="text-foreground font-black text-[9px] sm:text-sm">
                              ₹{Number(offerPrice).toLocaleString("en-IN")}
                            </span>
                            <span className="text-muted-foreground text-[6px] sm:text-xs line-through">
                              ₹{Number(product.price).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <Button
                            type="button"
                            onClick={() =>
                              handleBookOfferProduct(product, offerPrice, text)
                            }
                            className="h-7 sm:h-8 text-[10px] sm:text-xs rounded-full btn-gradient"
                          >
                            Book Now
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(getProductDetailPath(product))}
                            className="h-7 sm:h-8 text-[10px] sm:text-xs rounded-full"
                          >
                            View Product
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
