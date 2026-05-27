import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bold, Heading2, Image as ImageIcon, Italic, List, ListOrdered, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/contexts/ProductContext";
import api from "@/lib/api";

type BrandResource = {
  id: string;
  title?: string;
  enabled?: boolean;
  data?: { name?: string };
};

type ColorDraft = {
  id: string;
  name: string;
  hex: string;
  dotImage: string;
  images: string[];
  inStock: boolean;
};

type StorageDraft = {
  id: string;
  storage: string;
  originalPrice: string;
  sellingPrice: string;
  applyDiscount: boolean;
  comparativePrice: string;
  inStock: boolean;
  colors: ColorDraft[];
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createColor = (): ColorDraft => ({
  id: createId("color"),
  name: "",
  hex: "#000000",
  dotImage: "",
  images: [],
  inStock: true,
});

const createStorage = (): StorageDraft => ({
  id: createId("storage"),
  storage: "",
  originalPrice: "",
  sellingPrice: "",
  applyDiscount: false,
  comparativePrice: "",
  inStock: true,
  colors: [createColor()],
});

const calculateDiscount = (originalPrice: number, sellingPrice: number) =>
  originalPrice > sellingPrice
    ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
    : 0;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "product";

const buildFamilyId = (name: string) => `${slugify(name)}_family`;

const cropSquareImage = (file: File): Promise<File> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const size = Math.min(image.width, image.height);
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Image crop failed"));
        return;
      }

      ctx.drawImage(
        image,
        (image.width - size) / 2,
        (image.height - size) / 2,
        size,
        size,
        0,
        0,
        512,
        512,
      );

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            reject(new Error("Image crop failed"));
            return;
          }

          resolve(new File([blob], file.name, { type: file.type || "image/jpeg" }));
        },
        file.type || "image/jpeg",
        0.9,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image crop failed"));
    };

    image.src = objectUrl;
  });

export default function AdminAddProduct({
  editingProduct,
  onCancel,
}: {
  editingProduct?: any;
  onCancel?: () => void;
}) {
  const navigate = useNavigate();
  const { products, categories, createProduct, uploadImage, updateProduct } = useProducts();
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const descriptionImageRef = useRef<HTMLInputElement | null>(null);

  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [category, setCategory] = useState("");
  const [rating, setRating] = useState("");
  const [reviewCount, setReviewCount] = useState("");
  const [hasVariants, setHasVariants] = useState(() => Boolean(!editingProduct));
  const [storages, setStorages] = useState<StorageDraft[]>([createStorage()]);
  const [simpleImages, setSimpleImages] = useState<string[]>([]);
  const [simpleOriginalPrice, setSimpleOriginalPrice] = useState("");
  const [simpleSellingPrice, setSimpleSellingPrice] = useState("");
  const [simpleInStock, setSimpleInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isWeeklyTrending, setIsWeeklyTrending] = useState(false);
  const [productSections, setProductSections] = useState<{
    weeklyTrending: boolean;
    mostPopular: boolean;
    premiumUsed: boolean;
    bestSelling: boolean;
    flagship: boolean;
  }>({
    weeklyTrending: false,
    mostPopular: false,
    premiumUsed: false,
    bestSelling: false,
    flagship: false,
  });
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragState, setDragState] = useState<{
    storageId: string;
    colorId: string;
    index: number;
  } | null>(null);

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const response = (await api("/admin/resources/brand")) as {
          resources: BrandResource[];
        };
        const names = (response.resources || [])
          .filter((item) => item.enabled !== false)
          .map((item) => item.data?.name || item.title || "")
          .filter(Boolean);

        setBrandOptions(names);
      } catch {
        setBrandOptions([]);
      }
    };

    loadBrands();

    if (!editingProduct) {
      return;
    }

    // If editing product is provided, populate form state
    setProductName(editingProduct.name || "");
    setBrand(editingProduct.brand || "");
    setCategory(editingProduct.category || "");
    setDescriptionHtml(editingProduct.description || "");
    setRating(editingProduct.rating?.toString() || "");
    setReviewCount(editingProduct.reviewsCount?.toString() || "");
    setHasVariants(false);
    setSimpleImages(editingProduct.images || (editingProduct.image ? [editingProduct.image] : []));
    setSimpleOriginalPrice(editingProduct.originalPrice?.toString() || "");
    setSimpleSellingPrice(editingProduct.price?.toString() || "");
    setSimpleInStock(Boolean(editingProduct.stock > 0));
    setIsFeatured(Boolean(editingProduct.isFeatured));
    setIsWeeklyTrending(Boolean(editingProduct.isWeeklyTrending));
    setProductSections({
      weeklyTrending:
        Boolean(editingProduct.productSections?.weeklyTrending) ||
        Boolean(editingProduct.isWeeklyTrending),
      mostPopular:
        Boolean(editingProduct.productSections?.mostPopular) ||
        Boolean(editingProduct.isFeatured),
      premiumUsed:
        Boolean(editingProduct.productSections?.premiumUsed) ||
        Boolean(editingProduct.isUsed),
      bestSelling:
        Boolean(editingProduct.productSections?.bestSelling) ||
        Boolean(editingProduct.isBestSeller),
      flagship:
        Boolean(editingProduct.productSections?.flagship) || false,
    });

    // Populate storages and colors from family products or single product
    if (editingProduct.familyId) {
      const familyProducts = products.filter((p: any) => p.familyId === editingProduct.familyId);
      if (familyProducts.length > 0) {
        const grouped: Record<string, StorageDraft> = {};
        familyProducts.forEach((fp: any) => {
          const storageKey = fp.storageOption || fp.name || "_default";
          if (!grouped[storageKey]) {
            grouped[storageKey] = {
              id: createId("storage"),
              storage: fp.storageOption || "",
              originalPrice: fp.originalPrice?.toString() || "",
              sellingPrice: fp.price?.toString() || "",
              applyDiscount: false,
              comparativePrice: "",
              inStock: fp.stock > 0,
              colors: [],
            };
          }

          const colorName = fp.colorName || fp.colors?.[0]?.name || fp.colorVariants?.[0]?.name || "";
          const colorHex = fp.colorHex || fp.colors?.[0]?.hex || fp.colorVariants?.[0]?.hex || "#000000";
          const dotImage = fp.colors?.[0]?.image || fp.colorVariants?.[0]?.image || fp.images?.[0] || "";
          const images = fp.images?.length ? fp.images : fp.colors?.[0]?.images || fp.colorVariants?.[0]?.images || [];

          grouped[storageKey].colors.push({
            id: createId("color"),
            name: colorName,
            hex: colorHex,
            dotImage,
            images,
            inStock: fp.stock > 0,
          });
        });
        setStorages(Object.values(grouped));
      }
    } else if (editingProduct.storageOption || (editingProduct.colors && editingProduct.colors.length)) {
      const storagesFromProduct: StorageDraft[] = [
        {
          id: createId("storage"),
          storage: editingProduct.storageOption || "",
          originalPrice: editingProduct.originalPrice?.toString() || "",
          sellingPrice: editingProduct.price?.toString() || "",
          applyDiscount: false,
          comparativePrice: "",
          inStock: editingProduct.stock > 0,
          colors: (editingProduct.colors || []).map((c: any) => ({
            id: createId("color"),
            name: c.name || "",
            hex: c.hex || "#000000",
            dotImage: c.image || "",
            images: c.images || [],
            inStock: editingProduct.stock > 0,
          })),
        },
      ];
      setStorages(storagesFromProduct);
    }
  }, [editingProduct, products]);

  const effectiveBrandOptions = useMemo(
    () =>
      brandOptions.length > 0
        ? brandOptions
        : [
            "Apple",
            "Samsung",
            "OnePlus",
            "Xiaomi",
            "Vivo",
            "Oppo",
            "Realme",
            "Google",
            "Nothing",
          ],
    [brandOptions],
  );

  const formatCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setDescriptionHtml(descriptionRef.current?.innerHTML || "");
  };

  const uploadFiles = async (files: FileList | File[], square = false) => {
    const selected = Array.from(files);

    if (selected.length === 0) return [];

    setUploading(true);

    try {
      const urls: string[] = [];

      for (const file of selected) {
        const uploadFile = square ? await cropSquareImage(file) : file;
        urls.push(await uploadImage(uploadFile));
      }

      return urls;
    } finally {
      setUploading(false);
    }
  };

  const handleDescriptionImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const [url] = await uploadFiles([file]);
      const image = document.createElement("img");
      image.src = url;
      image.alt = "Product description";
      image.className = "max-w-full rounded my-3";
      descriptionRef.current?.appendChild(image);
      setDescriptionHtml(descriptionRef.current?.innerHTML || "");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    } finally {
      event.target.value = "";
    }
  };

  const addStorage = () => setStorages((prev) => [...prev, createStorage()]);

  const updateStorage = (storageId: string, patch: Partial<StorageDraft>) => {
    setStorages((prev) =>
      prev.map((storage) =>
        storage.id === storageId ? { ...storage, ...patch } : storage,
      ),
    );
  };

  const deleteStorage = (storageId: string) => {
    if (editingProduct) {
      if (!confirm("Are you sure you want to delete this storage variant?")) return;
    }
    setStorages((prev) =>
      prev.length === 1 ? prev : prev.filter((storage) => storage.id !== storageId),
    );
  };

  const addColor = (storageId: string) => {
    setStorages((prev) =>
      prev.map((storage) =>
        storage.id === storageId
          ? { ...storage, colors: [...storage.colors, createColor()] }
          : storage,
      ),
    );
  };

  const updateColor = (
    storageId: string,
    colorId: string,
    patch: Partial<ColorDraft>,
  ) => {
    setStorages((prev) =>
      prev.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colors: storage.colors.map((color) =>
                color.id === colorId ? { ...color, ...patch } : color,
              ),
            }
          : storage,
      ),
    );
  };

  const deleteColor = (storageId: string, colorId: string) => {
    if (editingProduct) {
      if (!confirm("Are you sure you want to delete this color variant?")) return;
    }
    setStorages((prev) =>
      prev.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colors:
                storage.colors.length === 1
                  ? storage.colors
                  : storage.colors.filter((color) => color.id !== colorId),
            }
          : storage,
      ),
    );
  };

  const addColorImages = async (
    storageId: string,
    colorId: string,
    files?: FileList | null,
  ) => {
    if (!files) return;

    try {
      const urls = await uploadFiles(files);

      setStorages((prev) =>
        prev.map((storage) =>
          storage.id === storageId
            ? {
                ...storage,
                colors: storage.colors.map((color) =>
                  color.id === colorId
                    ? { ...color, images: [...color.images, ...urls] }
                    : color,
                ),
              }
            : storage,
        ),
      );

      toast.success("Images uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  };

  const uploadDotImage = async (
    storageId: string,
    colorId: string,
    file?: File,
  ) => {
    if (!file) return;

    try {
      const [url] = await uploadFiles([file], true);
      updateColor(storageId, colorId, { dotImage: url });
      toast.success("Color dot uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  };

  const addSimpleImages = async (files?: FileList | null) => {
    if (!files) return;

    try {
      const urls = await uploadFiles(files);
      setSimpleImages((prev) => [...prev, ...urls]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Image upload failed");
    }
  };

  const reorderColorImage = (
    storageId: string,
    colorId: string,
    from: number,
    to: number,
  ) => {
    setStorages((prev) =>
      prev.map((storage) =>
        storage.id === storageId
          ? {
              ...storage,
              colors: storage.colors.map((color) =>
                color.id === colorId
                  ? {
                      ...color,
                      images: (() => {
                        const next = [...color.images];
                        const [moved] = next.splice(from, 1);
                        next.splice(to, 0, moved);
                        return next;
                      })(),
                    }
                  : color,
              ),
            }
          : storage,
      ),
    );
  };

  const handleDragStart = (
    storageId: string,
    colorId: string,
    index: number,
  ) => {
    setDragState({ storageId, colorId, index });
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>,
    storageId: string,
    colorId: string,
    index: number,
  ) => {
    event.preventDefault();

    if (
      !dragState ||
      dragState.storageId !== storageId ||
      dragState.colorId !== colorId ||
      dragState.index === index
    ) {
      return;
    }

    reorderColorImage(storageId, colorId, dragState.index, index);
    setDragState(null);
  };

  const validate = () => {
    if (!productName.trim()) {
      toast.error("Product name is required");
      return false;
    }

    if (!brand.trim()) {
      toast.error("Brand is required");
      return false;
    }

    if (!category.trim()) {
      toast.error("Category is required");
      return false;
    }

    if (!hasVariants) {
      if (!simpleSellingPrice || Number.isNaN(Number(simpleSellingPrice))) {
        toast.error("Selling price is required");
        return false;
      }

      return true;
    }

    if (storages.length === 0) {
      toast.error("Add at least one storage variant");
      return false;
    }

    for (const storage of storages) {
      if (!storage.storage.trim()) {
        toast.error("Storage name is required");
        return false;
      }

      if (!storage.sellingPrice || Number.isNaN(Number(storage.sellingPrice))) {
        toast.error(`${storage.storage || "Storage"} needs a selling price`);
        return false;
      }

      if (storage.colors.length === 0) {
        toast.error(`${storage.storage || "Storage"} needs at least one color`);
        return false;
      }

      for (const color of storage.colors) {
        if (!color.name.trim()) {
          toast.error("Each color needs a name");
          return false;
        }

        if (color.images.length === 0) {
          toast.error(`${color.name || "Color"} needs at least one product image`);
          return false;
        }
      }
    }

    return true;
  };

  const buildSingleProductPayload = () => ({
    name: productName.trim(),
    brand,
    category,
    description: descriptionHtml,
    rating: rating ? Number(rating) : null,
    ratingsCount: reviewCount ? Number(reviewCount) : null,
    reviewsCount: reviewCount ? Number(reviewCount) : null,
    reviewCount: reviewCount ? Number(reviewCount) : null,
    price: Number(simpleSellingPrice),
    originalPrice: simpleOriginalPrice ? Number(simpleOriginalPrice) : null,
    discount: simpleOriginalPrice
      ? calculateDiscount(Number(simpleOriginalPrice), Number(simpleSellingPrice))
      : null,
    stock: simpleInStock ? 1 : 0,
    images: simpleImages,
    colors: [],
    colorVariants: [],
    isFeatured: isFeatured || productSections.mostPopular || productSections.flagship,
    isWeeklyTrending: isWeeklyTrending || productSections.weeklyTrending,
    isBestSeller: productSections.bestSelling,
    isUsed: productSections.premiumUsed,
    isNewArrival: false,
    productSections: {
      weeklyTrending: productSections.weeklyTrending,
      mostPopular: productSections.mostPopular,
      premiumUsed: productSections.premiumUsed,
      bestSelling: productSections.bestSelling,
      flagship: productSections.flagship,
    },
  });

  const getFamilyId = () => editingProduct?.familyId || buildFamilyId(productName);

  const buildVariantProducts = () => {
    const familyId = getFamilyId();

    return storages.flatMap((storage) =>
      storage.colors.map((color) => {
        const sellingPrice = Number(storage.sellingPrice);
        const originalPrice = Number(
          storage.applyDiscount && storage.comparativePrice
            ? storage.comparativePrice
            : storage.originalPrice || storage.sellingPrice,
        );

        return {
          name: `${productName.trim()} (${storage.storage.trim()} / ${color.name.trim()})`,
          brand,
          category,
          description: descriptionHtml,
          rating: rating ? Number(rating) : null,
          ratingsCount: reviewCount ? Number(reviewCount) : null,
          reviewsCount: reviewCount ? Number(reviewCount) : null,
          reviewCount: reviewCount ? Number(reviewCount) : null,
          price: sellingPrice,
          originalPrice: storage.originalPrice ? originalPrice : null,
          discount: calculateDiscount(originalPrice, sellingPrice),
          stock: storage.inStock && color.inStock ? 1 : 0,
          images: color.images,
          colors: [
            {
              name: color.name.trim(),
              hex: color.hex,
              dotImage: color.dotImage,
              image: color.dotImage || color.images[0] || "",
              images: color.images,
            },
          ],
          colorVariants: [
            {
              name: color.name.trim(),
              hex: color.hex,
              dotImage: color.dotImage,
              image: color.dotImage || color.images[0] || "",
              images: color.images,
            },
          ],
          familyId,
          colorName: color.name.trim(),
          colorHex: color.hex,
          storageOption: storage.storage.trim(),
          isFeatured: isFeatured || productSections.mostPopular || productSections.flagship,
          isWeeklyTrending: isWeeklyTrending || productSections.weeklyTrending,
          isBestSeller: productSections.bestSelling,
          isUsed: productSections.premiumUsed,
          isNewArrival: false,
          productSections: {
            weeklyTrending: productSections.weeklyTrending,
            mostPopular: productSections.mostPopular,
            premiumUsed: productSections.premiumUsed,
            bestSelling: productSections.bestSelling,
            flagship: productSections.flagship,
          },
        };
      }),
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);

      const productsToCreate = hasVariants
        ? buildVariantProducts()
        : [buildSingleProductPayload()];

      if (productsToCreate.length === 0) {
        toast.error("No products were generated");
        return;
      }

      if (editingProduct) {
        const productsToUpdate = hasVariants
          ? buildVariantProducts()
          : [buildSingleProductPayload()];

        const currentVariant = productsToUpdate.find(
          (payload) =>
            payload.storageOption === editingProduct.storageOption &&
            payload.colorName === editingProduct.colorName,
        ) || productsToUpdate[0];

        const mergedCurrent = { ...editingProduct, ...currentVariant };
        await updateProduct(editingProduct.id, mergedCurrent as any);

        const familyProducts = editingProduct.familyId
          ? products.filter((p: any) => p.familyId === editingProduct.familyId)
          : [editingProduct];

        const otherPayloads = productsToUpdate.filter(
          (payload) => payload !== currentVariant,
        );

        for (const payload of otherPayloads) {
          const existingVariant = familyProducts.find(
            (product) =>
              product.id !== editingProduct.id &&
              product.storageOption === payload.storageOption &&
              product.colorName === payload.colorName,
          );

          if (existingVariant) {
            const merged = { ...existingVariant, ...payload };
            await updateProduct(existingVariant.id, merged as any);
          } else {
            await createProduct(payload as any);
          }
        }

        toast.success("Product updated successfully");
        if (onCancel) onCancel();
      } else {
        for (const productData of productsToCreate) {
          await createProduct(productData as any);
        }

        toast.success(
          `${productsToCreate.length} product${productsToCreate.length === 1 ? "" : "s"} created successfully`,
        );
        navigate("/admin");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const formatINR = (value: number) =>
    `₹${value.toLocaleString("en-IN")}`;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Add Product</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Storage variants render first. Add colors under each storage.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin")}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || uploading}>
              {submitting ? "Saving..." : "Save Product"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Name</Label>
                  <Input
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Brand</Label>
                    <Select value={brand} onValueChange={setBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {effectiveBrandOptions.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Product Sections / Flags</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={productSections.weeklyTrending} onChange={(e)=>setProductSections(prev=>({...prev,weeklyTrending:e.target.checked}))} />
                      <span className="text-sm">Weekly Trending Products</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={productSections.mostPopular} onChange={(e)=>setProductSections(prev=>({...prev,mostPopular:e.target.checked}))} />
                      <span className="text-sm">Most Popular Products</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={productSections.premiumUsed} onChange={(e)=>setProductSections(prev=>({...prev,premiumUsed:e.target.checked}))} />
                      <span className="text-sm">Premium Used Phones</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={productSections.bestSelling} onChange={(e)=>setProductSections(prev=>({...prev,bestSelling:e.target.checked}))} />
                      <span className="text-sm">Best Selling Smartphones</span>
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={productSections.flagship} onChange={(e)=>setProductSections(prev=>({...prev,flagship:e.target.checked}))} />
                      <span className="text-sm">Flagship Smartphones</span>
                    </label>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <div className="rounded-lg border border-border overflow-hidden bg-white">
                    <div className="flex flex-wrap gap-2 border-b border-border bg-secondary/50 p-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => formatCommand("bold")}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => formatCommand("italic")}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => formatCommand("formatBlock", "h2")}
                      >
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => formatCommand("insertUnorderedList")}
                      >
                        <List className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => formatCommand("insertOrderedList")}
                      >
                        <ListOrdered className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => descriptionImageRef.current?.click()}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <input
                        ref={descriptionImageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleDescriptionImage}
                      />
                    </div>
                    <div
                      ref={descriptionRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={() =>
                        setDescriptionHtml(descriptionRef.current?.innerHTML || "")
                      }
                      className="min-h-52 p-4 text-sm leading-6 outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Rating</Label>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      value={rating}
                      onChange={(e) => setRating(e.target.value)}
                      placeholder="4.7"
                    />
                  </div>
                  <div>
                    <Label>Reviews</Label>
                    <Input
                      type="number"
                      min="0"
                      value={reviewCount}
                      onChange={(e) => setReviewCount(e.target.value)}
                      placeholder="5300"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {editingProduct ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setHasVariants(true)}
                    >
                      Add Variant
                    </Button>
                  ) : (
                    <Label className="flex items-center gap-3">
                      <Checkbox
                        checked={hasVariants}
                        onCheckedChange={(checked) => setHasVariants(Boolean(checked))}
                      />
                      This product has variants
                    </Label>
                  )}
                </div>
              </CardContent>
            </Card>

            {hasVariants ? (
              <Card>
                <CardHeader>
                  <CardTitle>Storage Variants</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {storages.map((storage, storageIndex) => (
                    <Card key={storage.id} className="border-border">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-3">
                          <CardTitle className="text-base">
                            Storage {storageIndex + 1}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Button type="button" size="sm" onClick={() => addColor(storage.id)}>
                              <Plus className="w-4 h-4 mr-2" /> Add Color
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteStorage(storage.id)}
                              disabled={storages.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Storage Name</Label>
                            <Input
                              value={storage.storage}
                              onChange={(e) =>
                                updateStorage(storage.id, { storage: e.target.value })
                              }
                              placeholder="128GB"
                            />
                          </div>
                          <div className="flex flex-col justify-end gap-2">
                            <Label className="flex items-center gap-3">
                              <Checkbox
                                checked={storage.inStock}
                                onCheckedChange={(checked) =>
                                  updateStorage(storage.id, { inStock: Boolean(checked) })
                                }
                              />
                              In Stock
                            </Label>
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Original Price</Label>
                            <Input
                              type="number"
                              value={storage.originalPrice}
                              onChange={(e) =>
                                updateStorage(storage.id, { originalPrice: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Selling Price</Label>
                            <Input
                              type="number"
                              value={storage.sellingPrice}
                              onChange={(e) =>
                                updateStorage(storage.id, { sellingPrice: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <Label className="flex items-center gap-3">
                          <Checkbox
                            checked={storage.applyDiscount}
                            onCheckedChange={(checked) =>
                              updateStorage(storage.id, { applyDiscount: Boolean(checked) })
                            }
                          />
                          Apply Discount
                        </Label>

                        {storage.applyDiscount && (
                          <div>
                            <Label>Comparative Price</Label>
                            <Input
                              type="number"
                              value={storage.comparativePrice}
                              onChange={(e) =>
                                updateStorage(storage.id, {
                                  comparativePrice: e.target.value,
                                })
                              }
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-semibold">Colors</h3>
                            <span className="text-xs text-muted-foreground">
                              {storage.colors.length} color
                              {storage.colors.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {storage.colors.map((color, colorIndex) => (
                            <div
                              key={color.id}
                              className="rounded-lg border border-border p-3 space-y-4"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold">
                                  Color {colorIndex + 1}
                                </p>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => deleteColor(storage.id, color.id)}
                                  disabled={storage.colors.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                                <div>
                                  <Label>Color Name</Label>
                                  <Input
                                    value={color.name}
                                    onChange={(e) =>
                                      updateColor(storage.id, color.id, {
                                        name: e.target.value,
                                      })
                                    }
                                    placeholder="Black"
                                  />
                                </div>
                                <div>
                                  <Label>Color Picker</Label>
                                  <div className="mt-2 flex gap-2">
                                    <input
                                      type="color"
                                      value={color.hex}
                                      onChange={(e) =>
                                        updateColor(storage.id, color.id, {
                                          hex: e.target.value,
                                        })
                                      }
                                      className="h-10 w-14 rounded border"
                                    />
                                    <Input
                                      value={color.hex}
                                      onChange={(e) =>
                                        updateColor(storage.id, color.id, {
                                          hex: e.target.value,
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              </div>

                              <div>
                                <Label>Color Dot Image</Label>
                                <div className="mt-2 flex items-center gap-3">
                                  {color.dotImage ? (
                                    <img
                                      src={color.dotImage}
                                      alt=""
                                      className="h-14 w-14 rounded-full object-cover border"
                                    />
                                  ) : (
                                    <span
                                      className="h-14 w-14 rounded-full border"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                  )}
                                  <Label className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm">
                                    Upload 1:1 Image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) =>
                                        uploadDotImage(
                                          storage.id,
                                          color.id,
                                          e.target.files?.[0],
                                        )
                                      }
                                    />
                                  </Label>
                                </div>
                              </div>

                              <div>
                                <Label>Product Images</Label>
                                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                  {color.images.map((image, index) => (
                                    <div
                                      key={`${image}-${index}`}
                                      draggable
                                      onDragStart={() =>
                                        handleDragStart(storage.id, color.id, index)
                                      }
                                      onDragOver={(e) => e.preventDefault()}
                                      onDrop={(e) =>
                                        handleDrop(e, storage.id, color.id, index)
                                      }
                                      className="relative aspect-square rounded-md border bg-white overflow-hidden"
                                    >
                                      <img
                                        src={image}
                                        alt={`${color.name || "Color"} ${index + 1}`}
                                        className="h-full w-full object-contain p-2"
                                      />
                                      <button
                                        type="button"
                                        className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                                        onClick={() =>
                                          updateColor(storage.id, color.id, {
                                            images: color.images.filter(
                                              (_, itemIndex) => itemIndex !== index,
                                            ),
                                          })
                                        }
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}

                                  <Label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border text-sm">
                                    <ImageIcon className="w-5 h-5 mb-2" />
                                    Add Images
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) =>
                                        addColorImages(storage.id, color.id, e.target.files)
                                      }
                                    />
                                  </Label>
                                </div>
                              </div>

                              <Label className="flex items-center gap-3">
                                <Checkbox
                                  checked={color.inStock}
                                  onCheckedChange={(checked) =>
                                    updateColor(storage.id, color.id, {
                                      inStock: Boolean(checked),
                                    })
                                  }
                                />
                                In Stock
                              </Label>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button type="button" className="w-full" onClick={addStorage}>
                    <Plus className="w-4 h-4 mr-2" /> Add Storage
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Simple Product</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Original Price</Label>
                      <Input
                        type="number"
                        value={simpleOriginalPrice}
                        onChange={(e) => setSimpleOriginalPrice(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Selling Price</Label>
                      <Input
                        type="number"
                        value={simpleSellingPrice}
                        onChange={(e) => setSimpleSellingPrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <Label className="flex items-center gap-3">
                    <Checkbox
                      checked={simpleInStock}
                      onCheckedChange={(checked) => setSimpleInStock(Boolean(checked))}
                    />
                    In Stock
                  </Label>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {simpleImages.map((image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="relative aspect-square rounded-md border bg-white"
                      >
                        <img
                          src={image}
                          alt=""
                          className="h-full w-full object-contain p-2"
                        />
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
                          onClick={() => {
                            if (editingProduct) {
                              if (!confirm("Are you sure you want to delete this image?")) return;
                            }
                            setSimpleImages((prev) =>
                              prev.filter((_, itemIndex) => itemIndex !== index),
                            );
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    <Label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-border text-sm">
                      <ImageIcon className="w-5 h-5 mb-2" />
                      Add Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => addSimpleImages(e.target.files)}
                      />
                    </Label>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground">Product</p>
                  <p>{productName || "Untitled product"}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Brand</p>
                  <p>{brand || "Select a brand"}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Category</p>
                  <p>{category || "Select a category"}</p>
                </div>

                <div>
                  <p className="font-semibold text-foreground">Storage Variants</p>
                  <div className="space-y-3">
                    {storages.map((storage) => (
                      <div
                        key={storage.id}
                        className="rounded-lg border border-border p-3"
                      >
                        <p className="font-semibold text-foreground">
                          {storage.storage || "Storage"}
                        </p>
                        <p>
                          {storage.originalPrice
                            ? `Original: ${formatINR(Number(storage.originalPrice))}`
                            : "Original: —"}
                        </p>
                        <p>
                          {storage.sellingPrice
                            ? `Selling: ${formatINR(Number(storage.sellingPrice))}`
                            : "Selling: —"}
                        </p>
                        <p>
                          {storage.inStock ? "In Stock" : "Out of Stock"}
                        </p>
                        <p className="mt-2 text-foreground">Colors:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {storage.colors.map((color) => (
                            <span
                              key={color.id}
                              className="rounded-full border border-border px-2 py-1 text-xs"
                            >
                              {color.name || "Untitled color"}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
