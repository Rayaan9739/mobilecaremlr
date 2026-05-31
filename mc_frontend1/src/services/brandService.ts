import { fetchPublicResources } from "@/lib/publicResources";

export type BrandRecord = {
  id?: string;
  title?: string | null;
  imageUrl?: string | null;
  url?: string | null;
  data?: {
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    status?: string | null;
    enabled?: boolean | null;
  } | null;
};

export type BrandViewModel = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  enabled: boolean;
};

const normalizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const resolveImage = (brand: BrandRecord) =>
  String(
    brand.data?.logo ||
      brand.data?.image ||
      brand.data?.imageUrl ||
      brand.imageUrl ||
      brand.url ||
      "",
  ).trim();

export const getBrandInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2) || "?";

export const normalizeBrand = (brand: BrandRecord): BrandViewModel => {
  const name = String(brand.data?.name || brand.title || "").trim();
  const slug = normalizeSlug(
    String(brand.data?.slug || brand.data?.name || brand.title || name),
  );

  return {
    id: String(brand.id || slug || name),
    name,
    slug,
    image: resolveImage(brand) || null,
    enabled: Boolean(brand.data?.enabled ?? brand.data?.status !== "inactive"),
  };
};

export async function loadBrands(): Promise<BrandViewModel[]> {
  const resources = (await fetchPublicResources("brand")) as BrandRecord[];

  return resources
    .map(normalizeBrand)
    .filter((brand) => brand.name || brand.slug);
}

export async function findBrandBySlug(slug: string): Promise<BrandViewModel | null> {
  const brands = await loadBrands();
  return (
    brands.find((brand) => brand.slug === normalizeSlug(slug)) || null
  );
}
