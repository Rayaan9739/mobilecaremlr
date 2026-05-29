import api from "@/lib/api";

export type PublicResource = {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
  data: Record<string, unknown>;
};

export const fetchPublicResources = async (type: "banner" | "popup" | "brand") => {
  const response = (await api(`/resources/${type}`)) as {
    resources: PublicResource[];
  };

  return response.resources || [];
};
