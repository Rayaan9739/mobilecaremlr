import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useProducts } from "@/contexts/ProductContext";

type AdminResource = {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

type PopupOfferProduct = {
  productId: string;
  offerPrice: number;
  text?: string;
};

const defaultHeroResource: AdminResource = {
  id: "default-hero",
  title: "Premium Mobiles & Accessories",
  enabled: true,
  order: 0,
  data: {
    bannerType: "hero",
    subtitle: "Upgrade Your Lifestyle Today",
    image: "/hero.jpg",
    source: "default",
  },
};

const defaultBannerResources: AdminResource[] = [
  {
    id: "default-banner-mobile",
    title: "Latest Smartphones & Accessories",
    enabled: true,
    order: 0,
    data: {
      bannerType: "banner",
      subtitle: "Power, performance, and style in one place",
      image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop",
      buttonText: "Explore Mobiles",
      buttonLink: "/category/mobile",
      source: "default",
    },
  },
];

// Enhanced Banner & Hero Management
export function BannerHeroManager() {
  const { uploadImage } = useProducts();
  const [banners, setBanners] = useState<AdminResource[]>([]);
  const [heroes, setHeroes] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [editType, setEditType] = useState<"hero" | "banner">("hero");
  const [form, setForm] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const response = (await api("/admin/resources/banner")) as {
        resources: AdminResource[];
      };
      const resources = response.resources || [];
      setHeroes(
        resources.filter((item) => item.data?.bannerType === "hero"),
      );
      setBanners(
        resources.filter((item) => item.data?.bannerType !== "hero"),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const saveBanner = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      title: form.title || "",
      enabled,
      order: Number(form.order || 0),
      data: {
        ...form,
        bannerType: editType,
      },
    };

    try {
      if (editing) {
        await api(`/admin/resources/banner/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Banner updated");
      } else {
        await api("/admin/resources/banner", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Banner created");
      }
      resetForm();
      loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save banner");
    }
  };

  const deleteBanner = async (id: string, type: string) => {
    if (id.startsWith("default-")) {
      toast.error("Default content cannot be deleted. Edit it and save to create your own version.");
      return;
    }
    if (!confirm(`Delete this ${type === "hero" ? "hero slide" : "banner"}?`)) return;
    try {
      await api(`/admin/resources/banner/${id}`, { method: "DELETE" });
      if (editing?.id === id) resetForm();
      toast.success(`${type === "hero" ? "Hero slide" : "Banner"} deleted`);
      loadBanners();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ order: "0" });
    setEnabled(true);
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const editBanner = (item: AdminResource) => {
    const nextType = item.data?.bannerType === "hero" ? "hero" : "banner";
    setEditing(item.id.startsWith("default-") ? null : item);
    setEditType(nextType);
    setEnabled(item.enabled);
    setForm({
      order: String(item.order || 0),
      ...Object.fromEntries(
        Object.entries(item.data || {}).map(([key, value]) => [
          key,
          String(value ?? ""),
        ]),
      ),
      title: item.title || String(item.data?.title || ""),
    });
  };

  const renderSavedItems = (
    title: string,
    type: "hero" | "banner",
    items: AdminResource[],
  ) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="outline">{items.length}</Badge>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          No {type === "hero" ? "hero slides" : "banners"} yet
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-border/60 bg-white p-3"
            >
              {item.data?.image ? (
                <div className="mb-3 h-28 overflow-hidden rounded-md bg-secondary">
                  <img
                    src={String(item.data.image)}
                    alt={item.title || title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {item.title || "Untitled"}
                  </p>
                  <Badge className={item.enabled ? "bg-green-500" : "bg-gray-500"}>
                    {item.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {item.data?.subtitle ? (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {String(item.data.subtitle)}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  Order {item.order || 0}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => editBanner(item)}
                >
                  <Pencil className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => deleteBanner(item.id, type)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>
              {editing ? "Update" : "Create"}{" "}
              {editType === "hero" ? "Hero Carousel" : "Homepage Banner"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={saveBanner} className="space-y-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={editType === "hero" ? "default" : "outline"}
                  onClick={() => {
                    setEditType("hero");
                    resetForm();
                  }}
                >
                  Hero
                </Button>
                <Button
                  type="button"
                  variant={editType === "banner" ? "default" : "outline"}
                  onClick={() => {
                    setEditType("banner");
                    resetForm();
                  }}
                >
                  Banner
                </Button>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={form.title || ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Banner title"
                />
              </div>

              <div>
                <Label>Subtitle / Text</Label>
                <Textarea
                  value={form.subtitle || ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, subtitle: e.target.value }))
                  }
                  placeholder={
                    editType === "hero" ? "Hero text" : "Banner subtitle"
                  }
                />
              </div>

              <div>
                <Label>Image</Label>
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleUpload(e.target.files?.[0])}
                  />
                  {form.image && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden bg-secondary">
                      <img
                        src={form.image}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute right-2 top-2"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, image: "" }))
                        }
                      >
                        Remove Image
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {editType === "banner" && (
                <>
                  <div>
                    <Label>Button Text</Label>
                    <Input
                      value={form.buttonText || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, buttonText: e.target.value }))
                      }
                      placeholder="e.g., Shop Now"
                    />
                  </div>

                  <div>
                    <Label>Button Link</Label>
                    <Input
                      value={form.buttonLink || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, buttonLink: e.target.value }))
                      }
                      placeholder="/products/category"
                    />
                  </div>
                </>
              )}

              <div>
                <Label>Order</Label>
                <Input
                  type="number"
                  value={form.order || "0"}
                  onChange={(e) => setForm((prev) => ({ ...prev, order: e.target.value }))}
                  min="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  id="enabled"
                />
                <Label htmlFor="enabled" className="cursor-pointer">
                  Active
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editing ? "Update" : "Create"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* List Section */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Saved Hero Sections & Banners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[28rem] space-y-6 overflow-y-auto pr-2">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-24 rounded-lg bg-secondary/60 animate-pulse"
                    />
                  ))}
                </div>
              ) : (
                <>
                  {renderSavedItems(
                    "Hero Slides",
                    "hero",
                    heroes.length > 0 ? heroes : [defaultHeroResource],
                  )}
                  {renderSavedItems(
                    "Banners",
                    "banner",
                    banners.length > 0 ? banners : defaultBannerResources,
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Enhanced Deals Management with Product Discount Calculations
export function DealsManager({ products }: { products: any[] }) {
  const { updateProduct } = useProducts();
  const [deals, setDeals] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const response = (await api("/admin/resources/deal")) as {
        resources: AdminResource[];
      };
      const dealsMap: Record<string, number> = {};
      response.resources?.forEach((item) => {
        if (item.data?.productId && item.data?.discount) {
          dealsMap[item.data.productId as string] = Number(item.data.discount) || 0;
        }
      });
      setDeals(dealsMap);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load deals");
    } finally {
      setLoading(false);
    }
  };

  const saveDeal = async (productId: string, discount: number) => {
    if (discount < 0 || discount > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }

    try {
      const product = products.find((p) => p.id === productId);
      if (!product) return;

      const basePrice =
        Number(product.originalPrice) > Number(product.price)
          ? Number(product.originalPrice)
          : Number(product.price);
      const calculatedPrice = Math.round(basePrice * (1 - discount / 100));

      await api("/admin/resources/deal", {
        method: "POST",
        body: JSON.stringify({
          title: `${product.name} - ${discount}% OFF`,
          enabled: true,
          data: {
            productId,
            productName: product.name,
            originalPrice: basePrice,
            discount,
            calculatedPrice,
          },
        }),
      });

      await updateProduct(productId, {
        price: calculatedPrice,
        originalPrice: basePrice,
        discount,
      });

      setDeals((prev) => ({ ...prev, [productId]: discount }));
      toast.success("Deal saved");
      loadDeals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save deal");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Deals Management</h2>
      <div className="rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50">
            <tr>
              <th className="px-4 py-3 text-left">Product Name</th>
              <th className="px-4 py-3 text-right">Current Price</th>
              <th className="px-4 py-3 text-right">Discount %</th>
              <th className="px-4 py-3 text-right">Calculated Price</th>
              <th className="px-4 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const basePrice =
                Number(product.originalPrice) > Number(product.price)
                  ? Number(product.originalPrice)
                  : Number(product.price);
              const discount = deals[product.id] ?? product.discount ?? 0;
              const calculatedPrice = Math.round(basePrice * (1 - discount / 100));
              return (
                <tr key={product.id} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-4 py-3">{product.name}</td>
                  <td className="px-4 py-3 text-right">₹{basePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setDeals((prev) => ({ ...prev, [product.id]: val }));
                      }}
                      min="0"
                      max="100"
                      className="w-20"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold">₹{calculatedPrice.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      onClick={() => saveDeal(product.id, discount)}
                    >
                      Save
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Enhanced Popup Management with Scheduling
export function PopupManager() {
  const { uploadImage, products } = useProducts();
  const [popups, setPopups] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [enabled, setEnabled] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<
    Record<string, { offerPrice: string; text: string }>
  >({});

  useEffect(() => {
    loadPopups();
  }, []);

  const loadPopups = async () => {
    try {
      setLoading(true);
      const response = (await api("/admin/resources/popup")) as {
        resources: AdminResource[];
      };
      setPopups(response.resources || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load popups");
    } finally {
      setLoading(false);
    }
  };

  const savePopup = async (event: React.FormEvent) => {
    event.preventDefault();
    const offerProducts: PopupOfferProduct[] = Object.entries(selectedProducts)
      .map(([productId, details]) => ({
        productId,
        offerPrice: Number(details.offerPrice),
        text: details.text.trim(),
      }))
      .filter((item) => item.productId);

    const hasMissingPrice = offerProducts.some(
      (item) => !Number.isFinite(item.offerPrice) || item.offerPrice <= 0,
    );

    if (hasMissingPrice) {
      toast.error("Please enter offer price for every selected product");
      return;
    }

    const payload = {
      title: form.title || "",
      enabled,
      order: Number(form.order || 0),
      data: {
        ...form,
        offerProducts,
        scheduledTime: form.scheduledTime || null,
      },
    };

    try {
      if (editing) {
        await api(`/admin/resources/popup/${editing.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast.success("Popup updated");
      } else {
        await api("/admin/resources/popup", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Popup created");
      }
      resetForm();
      loadPopups();
      setIsDialogOpen(false);
      window.dispatchEvent(new CustomEvent("mc_popup_update"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save popup");
    }
  };

  const deletePopup = async (id: string) => {
    if (!confirm("Delete this popup?")) return;
    try {
      await api(`/admin/resources/popup/${id}`, { method: "DELETE" });
      toast.success("Popup deleted");
      loadPopups();
      window.dispatchEvent(new CustomEvent("mc_popup_update"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete");
    }
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ order: "0" });
    setEnabled(true);
    setProductQuery("");
    setSelectedProducts({});
  };

  const handleUpload = async (file?: File) => {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  const filteredProducts = products
    .filter((product) =>
      productQuery.trim()
        ? product.name.toLowerCase().includes(productQuery.trim().toLowerCase())
        : true,
    )
    .slice(0, 60);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Popup Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 mr-2" /> Create Popup
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden p-0">
            <DialogHeader>
              <div className="px-6 pt-6">
                <DialogTitle>{editing ? "Edit Popup" : "Create New Popup"}</DialogTitle>
              </div>
            </DialogHeader>
            <form onSubmit={savePopup} className="flex max-h-[calc(90vh-4rem)] flex-col">
              <div className="grid gap-4 overflow-y-auto px-6 py-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={form.title || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Popup title"
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={form.message || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                    placeholder="Popup message"
                  />
                </div>

                <div>
                  <Label>Image (Optional)</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleUpload(e.target.files?.[0])}
                    />
                    {form.image && (
                      <div className="relative w-full overflow-hidden rounded-lg bg-secondary">
                        <img
                          src={form.image}
                          alt="Preview"
                          className="max-h-56 w-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Offer Products</Label>
                  <Input
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products..."
                    className="mt-1"
                  />
                  <div className="mt-3 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border/60 bg-background p-3">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No products found.</p>
                    ) : (
                      filteredProducts.map((product) => {
                        const productId = String(product.id);
                        const selected = selectedProducts[productId];

                        return (
                          <div key={productId} className="rounded-lg border border-border/50 bg-white p-3">
                            <label className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={Boolean(selected)}
                                onChange={(event) => {
                                  setSelectedProducts((prev) => {
                                    const next = { ...prev };
                                    if (event.target.checked) {
                                      next[productId] = next[productId] || {
                                        offerPrice: "",
                                        text: "",
                                      };
                                    } else {
                                      delete next[productId];
                                    }
                                    return next;
                                  });
                                }}
                              />
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-md object-contain"
                                />
                              ) : null}
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium text-foreground">
                                  {product.name}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                  ₹{Number(product.price || 0).toLocaleString("en-IN")}
                                </span>
                              </span>
                            </label>

                            {selected ? (
                              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[140px_1fr]">
                                <Input
                                  value={selected.offerPrice}
                                  onChange={(event) =>
                                    setSelectedProducts((prev) => ({
                                      ...prev,
                                      [productId]: {
                                        ...prev[productId],
                                        offerPrice: event.target.value.replace(/[^\d]/g, ""),
                                      },
                                    }))
                                  }
                                  placeholder="Offer price"
                                  inputMode="numeric"
                                />
                                <Input
                                  value={selected.text}
                                  onChange={(event) =>
                                    setSelectedProducts((prev) => ({
                                      ...prev,
                                      [productId]: {
                                        ...prev[productId],
                                        text: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Product offer text (optional)"
                                />
                              </div>
                            ) : null}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Link (Optional)</Label>
                    <Input
                      value={form.link || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, link: e.target.value }))}
                      placeholder="/products/category"
                    />
                  </div>

                  <div>
                    <Label>Schedule Time (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={form.scheduledTime || ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, scheduledTime: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    id="enabled"
                  />
                  <Label htmlFor="enabled" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border bg-card px-6 py-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Update Popup" : "Save Popup"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {popups.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">
            No popups yet
          </p>
        ) : (
          popups.map((popup) => (
            <Card key={popup.id} className="overflow-hidden">
              {popup.data?.image && (
                <div className="h-40 bg-secondary overflow-hidden">
                  <img
                    src={popup.data.image as string}
                    alt="Popup"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div>
                  <p className="font-bold">{popup.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {popup.data?.message}
                  </p>
                </div>
                {popup.data?.scheduledTime && (
                  <p className="text-xs text-muted-foreground">
                    Scheduled: {new Date(popup.data.scheduledTime as string).toLocaleString()}
                  </p>
                )}
                <div className="flex gap-2">
                  <Badge className={popup.enabled ? "bg-green-500" : "bg-gray-500"}>
                    {popup.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(popup);
                      setEnabled(popup.enabled);
                      setForm(
                        {
                          ...Object.fromEntries(
                          Object.entries(popup.data || {}).map(([key, value]) => [
                            key,
                            String(value ?? ""),
                          ]),
                          ),
                          title: popup.title || String(popup.data?.title || ""),
                        },
                      );
                      const offerProducts = Array.isArray(popup.data?.offerProducts)
                        ? (popup.data.offerProducts as PopupOfferProduct[])
                        : [];
                      setSelectedProducts(
                        Object.fromEntries(
                          offerProducts.map((item) => [
                            String(item.productId),
                            {
                              offerPrice: String(item.offerPrice || ""),
                              text: String(item.text || ""),
                            },
                          ]),
                        ),
                      );
                      setIsDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deletePopup(popup.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
