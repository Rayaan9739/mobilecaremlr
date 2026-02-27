const normalizePhoneNumber = (value) => {
  if (value === null || value === undefined) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const withoutSpacesAndDashes = raw.replace(/[\s-]/g, "");
  const withoutPlus = withoutSpacesAndDashes.startsWith("+")
    ? withoutSpacesAndDashes.slice(1)
    : withoutSpacesAndDashes;

  if (!/^\d+$/.test(withoutPlus)) return null;
  if (withoutPlus.length < 10) return null;

  if (withoutPlus.length === 10) {
    return `91${withoutPlus}`;
  }

  return withoutPlus;
};

const isValidPhoneNumber = (value) => Boolean(normalizePhoneNumber(value));

module.exports = {
  normalizePhoneNumber,
  isValidPhoneNumber,
};

