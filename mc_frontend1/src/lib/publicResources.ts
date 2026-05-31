import api from "@/lib/api";

export type PublicResource = {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
  imageUrl?: string;
  url?: string;
};

export const fetchPublicResources = async (type: "banner" | "popup" | "brand") => {
  const response = (await api(`/resources/${type}`)) as {
    resources: PublicResource[];
  };

  return response.resources || [];
};
