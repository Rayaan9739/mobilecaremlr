import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { isValidPhoneNumber, toNormalizedPhoneNumber } from "@/lib/phone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Address {
  id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  isDefaultAddress?: boolean;
}

interface CartProduct {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  images?: string[];
  brand?: string;
  category?: string;
  variantId?: string;
  selectedColor?: string;
  selectedStorage?: string;
}

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } =
    useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [autoBookHandled, setAutoBookHandled] = useState(false);

  const total = useMemo(() => getCartTotal(), [getCartTotal, cart]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setAddressesLoading(true);
        const data = await api<Address | null>("/addresses/my");
        setAddresses(data ? [data] : []);
      } catch {
        setAddresses([]);
      } finally {
        setAddressesLoading(false);
      }
    };
    fetchAddresses();
  }, []);

  const defaultAddress =
    addresses.find((a) => a.isDefaultAddress) || addresses[0];

  const formatAddressText = (address?: Address) => {
    if (!address) return "";
    return [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.city,
      address.state,
      address.pincode,
    ]
      .map((v) => (v || "").toString().trim())
      .filter(Boolean)
      .join(", ");
  };

  const handleBookNow = async () => {
    if (!isValidPhoneNumber(user?.phone || "")) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    if (addressesLoading) return;
    if (addresses.length === 0) {
      setShowAddressDialog(true);
      return;
    }
    setShowConfirmDialog(true);
  };

  useEffect(() => {
    const shouldAutoBook = Boolean((location.state as any)?.autoBookNow);
    if (!shouldAutoBook || autoBookHandled) return;
    if (cart.length === 0) return;
    if (addressesLoading) return;

    setAutoBookHandled(true);
    handleBookNow();
  }, [
    autoBookHandled,
    cart.length,
    location.state,
    addresses.length,
    addressesLoading,
  ]);

  useEffect(() => {
    const shouldAutoBook = Boolean((location.state as any)?.autoBookNow);
    if (!shouldAutoBook) return;
    if (addressesLoading) return;
    if (addresses.length > 0 && showAddressDialog) {
      setShowAddressDialog(false);
      setShowConfirmDialog(true);
    }
  }, [addresses.length, addressesLoading, location.state, showAddressDialog]);

  const handleConfirmOrder = async () => {
    if (!isValidPhoneNumber(user?.phone || "")) {
      toast({
        title: "Error",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    if (!defaultAddress) {
      setShowConfirmDialog(false);
      setShowAddressDialog(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Prepare order items
      const items = cart.map(({ product, quantity }) => ({
        productId: String(product.id),
        quantity,
        variantId: product.variantId || String(product.id),
        color: product.selectedColor,
        storage: product.selectedStorage,
        price: product.price,
      }));
      const orderResponse = await api<{
        order?: { id?: string };
        notificationCreated?: boolean;
      }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          items,
          addressText: formatAddressText(defaultAddress),
        }),
      });

      // Fallback path: if backend reports notification creation failure,
      // create one from frontend so admin still receives the order request.
      if (orderResponse?.notificationCreated === false) {
        const fallbackItems = cart
          .map(({ product, quantity }) => ({
            name: product.name,
            quantity,
            color: product.selectedColor,
            storage: product.selectedStorage,
            price: product.price,
            variantId: product.variantId || String(product.id),
          }))
          .filter(Boolean);
        await api("/notifications/create", {
          method: "POST",
          body: JSON.stringify({
            type: "CART_ORDER",
            title: "New Cart Order",
            data: {
              orderId: orderResponse?.order?.id,
              items: fallbackItems,
              total,
              address: formatAddressText(defaultAddress),
            },
            kind: "order",
            name: "Customer",
            mobileNumber: toNormalizedPhoneNumber(user?.phone || ""),
            message: `New Order #${orderResponse?.order?.id || "N/A"} | Items: ${cart
              .map(
                ({ product, quantity }) =>
                  `${product.name} [${product.selectedColor || "Default"}, ${product.selectedStorage || "Standard"}] x${quantity}`,
              )
              .join(
                ", ",
              )} | Total: INR ${Number(total).toFixed(2)} | Address: ${formatAddressText(defaultAddress)}`,
          }),
        });
      }

      toast({
        title: "Success",
        description: "Order placed successfully!",
      });

      clearCart();
      setShowConfirmDialog(false);
      navigate("/account/orders");
    } catch {
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary">
      <Header />

      <main className="pt-32 md:pt-40 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-2xl md:text-4xl font-bold text-foreground font-display">
              Cart
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              Review items and proceed to checkout.
            </p>
          </motion.div>

          {cart.length === 0 ? (
            <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-10 text-center shadow-soft max-w-md mx-auto">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
              <p className="text-foreground font-semibold text-base sm:text-lg">
                Your cart is empty
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                Browse products and add items to your cart.
              </p>
              <div className="mt-6">
                <Button
                  className="btn-gradient rounded-full px-8"
                  onClick={() => navigate("/products")}
                >
                  Explore Products
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {cart.map(({ product, quantity }) => (
                  <Card
                    key={product.id}
                    className="border border-border/50 bg-card rounded-2xl overflow-hidden shadow-soft"
                  >
                    <CardContent className="p-4 sm:p-6 flex gap-4">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-secondary/30 flex-shrink-0">
                        <img
                          src={
                            product.image?.trim()
                              ? product.image
                              : product.images?.[0]?.trim()
                                ? product.images?.[0]
                                : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop"
                          }
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-semibold text-foreground truncate">
                              {product.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
                              {product.brand || "Product"}{" "}
                              {product.category ? `• ${product.category}` : ""}
                            </p>
                            {(product.selectedColor || product.selectedStorage) && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {product.selectedColor || "Default"} • {product.selectedStorage || "Standard"}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive cursor-pointer"
                            onClick={() => removeFromCart(product.id)}
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent cursor-pointer"
                              onClick={() =>
                                updateQuantity(product.id, quantity - 1)
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="min-w-10 text-center text-sm sm:text-base font-semibold text-foreground">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent cursor-pointer"
                              onClick={() =>
                                updateQuantity(product.id, quantity + 1)
                              }
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Price
                            </p>
                            <p className="text-sm sm:text-base text-foreground font-bold">
                              ₹
                              {(product.price * quantity).toLocaleString(
                                "en-IN",
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="lg:col-span-1">
                <Card className="border border-border/50 bg-card rounded-2xl shadow-soft sticky top-32">
                  <CardContent className="p-6">
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      Order Summary
                    </h2>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Shipping</span>
                        <span>₹0</span>
                      </div>
                      <div className="border-t border-border/60 pt-3 mt-3 flex items-center justify-between">
                        <span className="font-semibold text-foreground">
                          Total
                        </span>
                        <span className="font-extrabold text-foreground">
                          ₹{total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <Button
                        className="w-full btn-gradient rounded-full"
                        onClick={handleBookNow}
                      >
                        Book Now
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => navigate("/mobiles-accessories")}
                      >
                        Continue Shopping
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-destructive hover:text-destructive"
                        onClick={clearCart}
                      >
                        Clear Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* No Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Address Required</DialogTitle>
            <DialogDescription>
              Please add an address before placing your order.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowAddressDialog(false);
                navigate("/account/addresses");
              }}
            >
              Add Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Please review your order details before confirming.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <div className="mb-4">
              <h4 className="font-medium mb-2">Order Items:</h4>
              {cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span>
                    {product.name} x {quantity}
                  </span>
                  <span>
                    ₹{(product.price * quantity).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3">
              <h4 className="font-medium mb-2">Delivery Address:</h4>
              {defaultAddress ? (
                <div className="text-sm text-gray-600">
                  <p>
                    {defaultAddress.name}, {defaultAddress.phone}
                  </p>
                  <p>{defaultAddress.addressLine1}</p>
                  {defaultAddress.addressLine2 && (
                    <p>{defaultAddress.addressLine2}</p>
                  )}
                  <p>
                    {defaultAddress.city}, {defaultAddress.state} -{" "}
                    {defaultAddress.pincode}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No address selected</p>
              )}
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between font-medium">
              <span>Total:</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmOrder}
              disabled={isPlacingOrder}
              className="btn-gradient"
            >
              {isPlacingOrder ? "Placing Order..." : "Confirm Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
