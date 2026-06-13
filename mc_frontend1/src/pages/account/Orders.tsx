import { useEffect, useState } from "react";
import { CheckCircle, ChevronRight, Package, Truck, XCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type OrderStatus = "PENDING" | "CONFIRMED" | "PROCESSING" | "COMPLETED" | "DELIVERED" | "CANCELLED";

type Product = {
  id: string;
  name: string;
  images: string[];
};

type OrderItem = {
  id: string;
  quantity: number;
  product: Product;
};

type Order = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
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
  return date.toISOString().slice(0, 10);
};

// Force HMR update
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

        const data = (await response.json()) as Order[];
        setOrders(Array.isArray(data) ? data : []);
      } catch {
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
            const firstItem = order.items?.[0];
            const product = firstItem?.product;
            const thumbnail = product?.images?.[0];
            const meta = statusMeta(order.status);
            const StatusIcon = meta.icon;

            return (
              <div key={order.id} className="border border-gray-200 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-5 h-5 ${meta.color}`} />
                    <span className={`font-medium ${meta.color}`}>{meta.label}</span>
                  </div>
                  <span className="text-sm text-gray-500">Order #{order.id}</span>
                </div>

                {/* Mobile layout */}
                <div className="md:hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={product?.name || "Product"}
                          className="w-14 h-14 object-cover rounded-xl bg-secondary shrink-0"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-secondary shrink-0" />
                      )}

                      <div className="min-w-0">
                        <div className="font-medium truncate">{product?.name || "Item"}</div>
                        <div className="text-sm text-gray-500">
                          {formatDate(order.createdAt)}
                          {typeof firstItem?.quantity === "number" ? ` • Qty ${firstItem.quantity}` : ""}
                          {typeof order.total === "number" ? ` • \u20B9${order.total.toLocaleString("en-IN")}` : ""}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                  </div>
                </div>

                {/* Desktop layout (unchanged) */}
                <div className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Items</div>
                    <div className="font-medium">
                      {order.items?.length
                        ? order.items.map((i) => i.product?.name).filter(Boolean).join(", ")
                        : ""}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Order Date</div>
                    <div className="font-medium">{formatDate(order.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div className="font-medium">
                      {"\u20B9"}
                      {typeof order.total === "number" ? order.total.toLocaleString("en-IN") : ""}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

