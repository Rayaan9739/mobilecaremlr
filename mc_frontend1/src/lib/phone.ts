export const normalizePhoneInput = (value: string) =>
  String(value || "").replace(/\s+/g, "").trim();

export const isValidPhoneNumber = (value: string) => {
  const normalized = normalizePhoneInput(value);
  return /^\+?\d{10,}$/.test(normalized);
};

export const toNormalizedPhoneNumber = (value: string) => {
  const compact = normalizePhoneInput(value).replace(/-/g, "");
  const withoutPlus = compact.startsWith("+") ? compact.slice(1) : compact;
  if (!/^\d+$/.test(withoutPlus) || withoutPlus.length < 10) {
    return "";
  }
  if (withoutPlus.length === 10) {
    return `91${withoutPlus}`;
  }
  return withoutPlus;
};

