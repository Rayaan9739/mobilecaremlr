import { useEffect, useState } from "react";
import { CheckCircle, Package, Truck, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "DELIVERED" | "CANCELLED";

type Product = {
  id: string;
  name: string;
  images: string[];
  storageOption?: string | null;
  colorName?: string | null;
  category?: string | null;
  brand?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  price: number;
  product: Product;
};

type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  addressText?: string | null;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
  };
  items: OrderItem[];
};

function statusMeta(status: OrderStatus) {
  switch (status) {
    case "DELIVERED":
      return { label: "Delivered", icon: CheckCircle, color: "text-green-600" as const };
    case "COMPLETED":
      return { label: "Completed", icon: CheckCircle, color: "text-green-700" as const };
    case "PROCESSING":
      return { label: "Processing", icon: Truck, color: "text-amber-600" as const };
    case "CONFIRMED":
      return { label: "Confirmed", icon: Package, color: "text-blue-600" as const };
    case "CANCELLED":
      return { label: "Cancelled", icon: XCircle, color: "text-red-600" as const };
    case "PENDING":
    default:
      return { label: "Pending", icon: Truck, color: "text-blue-600" as const };
  }
}

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatCurrency = (value: number) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const buildVariantLabel = (product: Product) => {
  const pieces = [
    product.storageOption ? `Storage: ${product.storageOption}` : "",
    product.colorName ? `Color: ${product.colorName}` : "",
  ].filter(Boolean);
  return pieces.length > 0 ? pieces.join(" • ") : "Default variant";
};

export default function AccountOrders() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      if (!isAuthenticated || authLoading) return;

      const token = localStorage.getItem("token");
      if (!token) {
        setOrders([]);
        setErrorMessage("Please sign in to view your orders.");
        return;
      }

      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("http://localhost:5000/api/orders/my", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401 || response.status === 403) {
          setOrders([]);
          setErrorMessage("You do not have permission to view orders.");
          return;
        }

        if (!response.ok) {
          setOrders([]);
          setErrorMessage("Unable to load order history right now.");
          return;
        }

        const data = (await response.json()) as Order[] | { orders?: Order[] };
        setOrders(Array.isArray(data) ? data : Array.isArray(data?.orders) ? data.orders : []);
      } catch (error) {
        console.error("Load order history error:", error);
        setOrders([]);
        setErrorMessage("Unable to load order history right now.");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [isAuthenticated, authLoading]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {!isAuthenticated ? (
        <p className="text-gray-500">Please sign in to view your orders.</p>
      ) : loading ? (
        <p className="text-gray-500">Loading your order history...</p>
      ) : errorMessage ? (
        <p className="text-gray-500">{errorMessage}</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">No orders yet</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const meta = statusMeta(order.status);
            const StatusIcon = meta.icon;

            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-5 bg-white">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${meta.color}`} />
                    <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <div className="text-sm text-gray-500">Order ID: {order.id}</div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm mb-4">
                  <div>
                    <div className="text-gray-500">Order Date</div>
                    <div className="font-medium text-gray-900">{formatDate(order.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Status</div>
                    <div className="font-medium text-gray-900">{meta.label}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Total Amount</div>
                    <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-semibold text-gray-900">Ordered Products</div>
                  {order.items.map((item, index) => {
                    const product = item.product;
                    const thumbnail = product?.images?.[0];
                    const itemTotal = Number(item.price || 0) * Number(item.quantity || 0);

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3"
                      >
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={product?.name || "Product"}
                            className="h-14 w-14 rounded-lg object-cover bg-white shrink-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-lg bg-gray-200 shrink-0" />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <div className="font-semibold text-gray-900">
                              {index + 1}. {product?.name || "Product"}
                            </div>
                            {product?.id ? (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Product ID: {product.id}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 text-sm text-gray-600 space-y-1">
                            <div>{buildVariantLabel(product)}</div>
                            <div>Quantity: {item.quantity}</div>
                            <div>Individual Item Price: {formatCurrency(item.price)}</div>
                            <div>Line Total: {formatCurrency(itemTotal)}</div>
                            <div>
                              Brand: {product?.brand || "-"} | Category: {product?.category || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.addressText ? (
                  <div className="mt-4 text-sm text-gray-600">
                    Shipping Address: {order.addressText}
                  </div>
                ) : null}

                {order.user ? (
                  <div className="mt-2 text-xs text-gray-500">
                    Customer: {order.user.fullName} | {order.user.phone}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
