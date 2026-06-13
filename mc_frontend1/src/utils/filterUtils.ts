import { Product } from "@/contexts/ProductContext";

export interface FilterState {
  price: string[];
  brands: string[];
  category: string[];
  launchYear: string[];
  screenSize: string[];
  os: string[];
  ram: string[];
  cores: string[];
  internalMemory: string[];
  connectivity: string[];
  discount: string[];
}

export interface FilterOptions {
  brands: string[];
  category: string[];
  launchYear: string[];
  screenSize: string[];
  os: string[];
  ram: string[];
  cores: string[];
  internalMemory: string[];
  connectivity: string[];
  discount: string[];
}

const normalizeCategoryValue = (value?: string) =>
  value ? value.toString().trim().toLowerCase().replace(/[\s-]+/g, "_") : "";

const getSafeProductBrand = (product: Product) => {
  const brand = String(product.brand || "").trim();
  const name = String(product.name || "").trim();
  return brand || name.split(/\s+/)[0] || "";
};

export const extractFilterOptions = (products: Product[]): FilterOptions => {
  const options: FilterOptions = {
    brands: [],
    category: [],
    launchYear: [],
    screenSize: [],
    os: [],
    ram: [],
    cores: [],
    internalMemory: [],
    connectivity: [],
    discount: ["10% or more", "20% or more", "30% or more", "50% or more"]
  };

  const sets = {
    brands: new Set<string>(),
    category: new Set<string>(),
    launchYear: new Set<string>(),
    screenSize: new Set<string>(),
    os: new Set<string>(),
    ram: new Set<string>(),
    cores: new Set<string>(),
    internalMemory: new Set<string>(),
    connectivity: new Set<string>(),
  };

  products.forEach(product => {
    const safeBrand = getSafeProductBrand(product);
    if (safeBrand) sets.brands.add(safeBrand);

    if (product.category) sets.category.add(product.category);

    const specsText = [
      ...(Array.isArray(product.highlights) ? product.highlights : 
          (product.highlights && typeof product.highlights === 'object' ? 
            Object.values(product.highlights).filter((v): v is string => typeof v === 'string') : [])),
      product.description || "",
      product.name
    ].join(" ").toLowerCase();

    const yearMatch = specsText.match(/202[0-5]/g);
    if (yearMatch) yearMatch.forEach(y => sets.launchYear.add(y));
    else {
        sets.launchYear.add("2025");
        sets.launchYear.add("2024");
        sets.launchYear.add("2023");
    }

    const screenMatch = specsText.match(/(\d+\.\d+)\s*("|inch)/g);
    if (screenMatch) {
        screenMatch.forEach(m => {
            const size = m.replace(/("|inch)/, "").trim();
             sets.screenSize.add(size + " inch");
        });
    }

    if (specsText.includes("android")) sets.os.add("Android");
    if (specsText.includes("ios") || specsText.includes("iphone")) sets.os.add("iOS");

    const ramMatch = specsText.match(/(\d+)\s*gb\s*ram/g);
    if (ramMatch) ramMatch.forEach(m => sets.ram.add(m.replace(/\s+/g, '').toUpperCase()));

    if (specsText.includes("octa core")) sets.cores.add("Octa Core");
    if (specsText.includes("quad core")) sets.cores.add("Quad Core");
    if (specsText.includes("hexa core")) sets.cores.add("Hexa Core");

    const storageMatch = specsText.match(/(\d+)\s*gb\s*(rom|storage)/g);
    if (storageMatch) {
      storageMatch.forEach(m => {
        const gb = m.match(/(\d+)\s*gb/i);
        if (gb) sets.internalMemory.add(gb[1].toUpperCase() + " GB");
      });
    }

    if (specsText.includes("5g")) sets.connectivity.add("5G");
    if (specsText.includes("4g")) sets.connectivity.add("4G");
    if (specsText.includes("nfc")) sets.connectivity.add("NFC");
  });

  options.brands = Array.from(sets.brands).sort();
  options.category = Array.from(sets.category).sort();
  options.launchYear = Array.from(sets.launchYear).sort().reverse();
  options.screenSize = Array.from(sets.screenSize).sort();
  options.os = Array.from(sets.os).sort();
  options.ram = Array.from(sets.ram).sort((a,b) => parseInt(a) - parseInt(b));
  options.cores = Array.from(sets.cores).sort();
  options.internalMemory = Array.from(sets.internalMemory).sort((a,b) => parseInt(a) - parseInt(b));
  options.connectivity = Array.from(sets.connectivity).sort();

  return options;
};

export const filterProducts = (products: Product[], filters: FilterState) => {
  return products.filter(product => {
    const specsText = [
        ...(Array.isArray(product.highlights) ? product.highlights : 
            (product.highlights && typeof product.highlights === 'object' ? 
              Object.values(product.highlights).filter((v): v is string => typeof v === 'string') : [])),
        product.description || "",
        product.name
      ].join(" ").toLowerCase();

    if (filters.price && filters.price.length > 0) {
        const p = product.price;
        const matchesPrice = filters.price.some(range => {
            if (range === "under-1000") return p < 1000;
            if (range === "1000-5000") return p >= 1000 && p <= 5000;
            if (range === "under-10000") return p < 10000;
            if (range === "10000-20000") return p >= 10000 && p <= 20000;
            if (range === "20000-30000") return p >= 20000 && p <= 30000;
            if (range === "30000-50000") return p >= 30000 && p <= 50000;
            if (range === "above-50000") return p > 50000;
            if (range === "5000-20000") return p >= 5000 && p <= 20000;
            if (range === "above-20000") return p > 20000;
            return false;
        });
        if (!matchesPrice) return false;
    }

    if (filters.brands && filters.brands.length > 0) {
        const productBrand = getSafeProductBrand(product);
        if (!filters.brands.includes(productBrand)) return false;
    }

    if (filters.category && filters.category.length > 0) {
        const matchesCategory = filters.category.some(filterCat => {
            const normalizedFilterCat = normalizeCategoryValue(filterCat);
            const productCategory = normalizeCategoryValue(product.category);

            if (normalizedFilterCat === "gaming") {
                const description = (product.description || "").toLowerCase();
                return description.includes("gaming");
            }

            if (normalizedFilterCat === "accessories") {
                const excludedCategories = ["mobile", "used_phone", "used-phone"];
                return !excludedCategories.includes(productCategory);
            }

            if (normalizedFilterCat === "adaptor" || normalizedFilterCat === "adaptors") {
                return productCategory === "adaptor" || productCategory === "adaptors";
            }

            return productCategory === normalizedFilterCat;
        });
        
        if (!matchesCategory) return false;
    }

    if (filters.ram && filters.ram.length > 0) {
        const hasRam = filters.ram.some((ram: string) => specsText.includes(ram.toLowerCase().replace(" ", "")));
        if (!hasRam) return false;
    }

    if (filters.internalMemory && filters.internalMemory.length > 0) {
         const hasStorage = filters.internalMemory.some((storage: string) => {
             const cleanOption = storage.toLowerCase().replace(" ", "");
             return specsText.includes(cleanOption);
         });
         if (!hasStorage) return false;
    }

    if (filters.os && filters.os.length > 0) {
        const hasOs = filters.os.some((os: string) => specsText.includes(os.toLowerCase()));
        if (!hasOs) return false;
    }
    
    if (filters.cores && filters.cores.length > 0) {
        const hasCores = filters.cores.some((c: string) => specsText.includes(c.toLowerCase()));
        if (!hasCores) return false;
    }

    if (filters.launchYear && filters.launchYear.length > 0) {
         const hasYear = filters.launchYear.some((y: string) => specsText.includes(y));
         if (!hasYear) return false;
    }

    if (filters.screenSize && filters.screenSize.length > 0) {
        const hasSize = filters.screenSize.some((s: string) => {
            const sizeNum = s.split(" ")[0];
            return specsText.includes(sizeNum);
        });
        if (!hasSize) return false;
    }

    if (filters.connectivity && filters.connectivity.length > 0) {
         const hasConn = filters.connectivity.some((c: string) => specsText.includes(c.toLowerCase()));
         if (!hasConn) return false;
    }

    if (filters.discount && filters.discount.length > 0) {
        const productDiscount = product.discount || 0;
        const hasDiscount = filters.discount.some((d: string) => {
            const val = parseInt(d);
            return productDiscount >= val;
        });
        if (!hasDiscount) return false;
    }

    return true;
  });
};
