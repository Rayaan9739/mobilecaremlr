import api from "@/lib/api";

/**
 * Asset Service - Public API for fetching hero and gallery images
 * These endpoints do NOT require authentication
 */

export interface HeroAssetResponse {
  section: "hero";
  url: string | null;
}

export interface GalleryImage {
  id: string;
  url: string;
  title: string | null;
}

export interface GalleryAssetResponse {
  section: "gallery";
  images: GalleryImage[];
}

export interface Technician {
  id: number;
  name: string;
  role: string;
  image: string;
  yearsOfExperience?: number;
  rating?: number;
}

/**
 * Fetch hero image from public API
 * GET /api/assets?section=hero
 */
export async function fetchHeroAsset(): Promise<HeroAssetResponse> {
  const response = await api<HeroAssetResponse>("/assets?section=hero", {
    method: "GET",
  });
  return response as HeroAssetResponse;
}

/**
 * Fetch gallery images from public API
 * GET /api/assets?section=gallery
 */
export async function fetchGalleryAssets(): Promise<GalleryAssetResponse> {
  const response = await api<GalleryAssetResponse>("/assets?section=gallery", {
    method: "GET",
  });
  return response as GalleryAssetResponse;
}

/**
 * Fetch technicians from public API
 * GET /api/technicians
 */
export async function fetchTechnicians(): Promise<Technician[]> {
  const response = await api<Technician[]>("/technicians", {
    method: "GET",
  });
  return response as Technician[];
}

/**
 * Create a new technician (admin only)
 * POST /api/technicians
 */
export async function createTechnician(tech: Omit<Technician, "id">): Promise<Technician> {
  const response = await api<Technician>("/technicians", {
    method: "POST",
    body: JSON.stringify(tech),
  });
  return response as Technician;
}

/**
 * Update a technician (admin only)
 * PUT /api/technicians/:id
 */
export async function updateTechnician(id: number, tech: Partial<Technician>): Promise<Technician> {
  const response = await api<Technician>(`/technicians/${id}`, {
    method: "PUT",
    body: JSON.stringify(tech),
  });
  return response as Technician;
}

/**
 * Delete a technician (admin only)
 * DELETE /api/technicians/:id
 */
export async function deleteTechnician(id: number): Promise<void> {
  await api(`/technicians/${id}`, {
    method: "DELETE",
  });
}
