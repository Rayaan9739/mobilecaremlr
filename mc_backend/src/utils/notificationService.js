const prisma = require("./prisma");
const { normalizePhoneNumber } = require("./phone");

// Compute expiresAt value (3 days from now)
function computeExpiry() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d;
}

/**
 * Convert incoming payload (could be old-style or new-style) into a
 * consolidated notification object suitable for database insertion.
 */
function normalizePayload(body) {
  // if already using unified fields, just return them
  const { type, title, data } = body;
  let finalType = type;
  let finalTitle = title;
  let finalData = data;

  // support legacy "kind" field
  if (!finalType) {
    switch ((body.kind || "").toLowerCase()) {
      case "repair":
        finalType = "REPAIR";
        break;
      case "contact":
        finalType = "CONTACT";
        break;
      case "order":
        // distinguish cart vs product booking with flag
        if (body.isCart === true || body.cart === true) {
          finalType = "CART_ORDER";
        } else {
          finalType = "ORDER";
        }
        break;
      default:
        finalType = "REPAIR";
    }
  }

  if (!finalTitle) {
    const titles = {
      REPAIR: "New Repair Booking",
      CONTACT: "New Contact Message",
      ORDER: "New Product Order",
      CART_ORDER: "New Cart Order",
    };
    finalTitle = titles[finalType] || "New Notification";
  }

  if (!finalData) {
    // copy everything except the helper fields so admin sees original input
    const copy = { ...body };
    // remove control fields
    delete copy.type;
    delete copy.title;
    delete copy.data;
    delete copy.kind;
    delete copy.isCart;
    delete copy.cart;
    finalData = copy;
  }

  return { type: finalType, title: finalTitle, data: finalData };
}

async function createNotification(body) {
  const { type, title, data } = normalizePayload(body);
  const expiresAt = computeExpiry();
  const normalizedPhone = normalizePhoneNumber(
    body.mobileNumber || data?.mobileNumber || data?.phone,
  );
  if (!normalizedPhone) {
    const error = new Error("Phone number is required");
    error.status = 422;
    throw error;
  }
  const normalizedData = {
    ...(data && typeof data === "object" ? data : {}),
    mobileNumber: normalizedPhone,
  };

  // prepare object for Prisma create; copy over legacy props so UI still works
  const record = {
    type,
    title,
    data: normalizedData,
    expiresAt,
    // legacy fields
    kind: body.kind || undefined,
    name: body.name || data?.name || null,
    mobileNumber: normalizedPhone,
    phoneBrand: body.phoneBrand || data?.phoneBrand || null,
    phoneModel: body.phoneModel || data?.phoneModel || null,
    issues: Array.isArray(body.issues) ? body.issues : data?.issues || [],
    otherIssue: body.otherIssue || data?.otherIssue || "",
    visitDate: body.visitDate || data?.visitDate || "",
    message: body.message || data?.message || "",
  };

  const created = await prisma.notification.create({ data: record });
  return created;
}

async function listNotifications() {
  const now = new Date();
  // only non-expired
  return await prisma.notification.findMany({
    where: {
      OR: [
        { expiresAt: { gt: now } },
        { expiresAt: null }, // for legacy rows
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}

async function markReplied(id) {
  return await prisma.notification.update({
    where: { id },
    data: { replied: true },
  });
}

async function deleteNotification(id) {
  return await prisma.notification.delete({ where: { id } });
}

module.exports = {
  createNotification,
  listNotifications,
  markReplied,
  deleteNotification,
  computeExpiry,
};
