const express = require("express");
const { Prisma } = require("@prisma/client");
const prisma = require("../utils/prisma");
const { auth } = require("../middleware/auth");
const { normalizePhoneNumber } = require("../utils/phone");

const router = express.Router();

const ALLOWED_TYPES = new Set(["REPAIR", "CONTACT", "ORDER", "CART_ORDER"]);
const ADMIN_EMAIL = "admin@mobilecare.com";
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const normalizeIssues = (issues) => {
  if (Array.isArray(issues)) return issues;
  if (typeof issues === "string") {
    try {
      const parsed = JSON.parse(issues);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const mapRowToNotification = (row) => ({
  id: String(row.id || ""),
  kind: row.kind || "repair",
  name: row.name || null,
  mobileNumber: row.mobileNumber || row.mobile_number || null,
  phoneBrand: row.phoneBrand || row.phone_brand || null,
  phoneModel: row.phoneModel || row.phone_model || null,
  issues: normalizeIssues(row.issues),
  otherIssue: row.otherIssue || row.other_issue || "",
  visitDate: row.visitDate || row.visit_date || "",
  message: row.message || "",
  replied: Boolean(row.replied),
  createdAt: row.createdAt || row.created_at || new Date().toISOString(),
});

const buildExpiresAt = () => {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + THREE_DAYS_MS);
    if (Number.isNaN(expiresAt.getTime())) {
      return now;
    }
    return expiresAt;
  } catch {
    return new Date();
  }
};

const validateCreatePayload = (payload) => {
  const missing = [];
  if (payload?.type === undefined) missing.push("type");
  if (payload?.title === undefined) missing.push("title");
  if (payload?.data === undefined) missing.push("data");

  if (missing.length > 0) {
    return {
      ok: false,
      status: 400,
      body: {
        error: "Bad Request",
        details: `Missing required field(s): ${missing.join(", ")}`,
      },
    };
  }

  const type = String(payload.type || "")
    .trim()
    .toUpperCase();
  if (!ALLOWED_TYPES.has(type)) {
    return {
      ok: false,
      status: 422,
      body: {
        error: "Validation failed",
        details: "type must be one of REPAIR, CONTACT, ORDER, CART_ORDER",
      },
    };
  }

  const title = String(payload.title || "").trim();
  if (!title) {
    return {
      ok: false,
      status: 422,
      body: {
        error: "Validation failed",
        details: "title must be a non-empty string",
      },
    };
  }

  if (!isObject(payload.data) || Object.keys(payload.data).length === 0) {
    return {
      ok: false,
      status: 422,
      body: {
        error: "Validation failed",
        details: "data must be a non-empty JSON object",
      },
    };
  }

  const rawPhone =
    payload?.data?.mobileNumber || payload?.data?.phone || payload?.mobileNumber;
  const normalizedPhone = normalizePhoneNumber(rawPhone);
  if (!normalizedPhone) {
    return {
      ok: false,
      status: 422,
      body: { error: "Phone number is required" },
    };
  }

  return { ok: true, type, title, data: payload.data, normalizedPhone };
};

const isPrismaValidationError = (error) => {
  if (error instanceof Prisma.PrismaClientValidationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2000" ||
      error.code === "P2005" ||
      error.code === "P2006" ||
      error.code === "P2007" ||
      error.code === "P2008" ||
      error.code === "P2009" ||
      error.code === "P2010" ||
      error.code === "P2011" ||
      error.code === "P2012" ||
      error.code === "P2013"
    );
  }
  return false;
};

const isPrismaConstraintError = (error) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === "P2002" || error.code === "P2003" || error.code === "P2014");

const assertAdminEmail = (req, res) => {
  const userEmail = String(req?.user?.email || "").toLowerCase();
  if (!req.user || userEmail !== ADMIN_EMAIL) {
    res
      .status(403)
      .json({ error: "Forbidden", details: "Admin access required" });
    return false;
  }
  return true;
};

const createNotificationRecord = async ({
  type,
  title,
  data,
  expiresAt,
  normalizedPhone,
}) => {
  const normalizedData = {
    ...(isObject(data) ? data : {}),
    mobileNumber: normalizedPhone,
  };
  const messagePayload = JSON.stringify({
    data: normalizedData,
    expiresAt: expiresAt.toISOString(),
  });
  const kind = type.toLowerCase();

  try {
    return await prisma.notification.create({
      data: {
        kind,
        name: title,
        mobileNumber: normalizedPhone,
        phoneBrand: null,
        phoneModel: null,
        issues: [],
        otherIssue: "",
        visitDate: "",
        message: messagePayload,
      },
    });
  } catch (prismaError) {
    if (
      isPrismaValidationError(prismaError) ||
      isPrismaConstraintError(prismaError)
    ) {
      throw prismaError;
    }

    try {
      const rowsCamel = await prisma.$queryRawUnsafe(
        `
        INSERT INTO "notifications"
        ("kind","name","message","issues","otherIssue","visitDate","replied","createdAt")
        VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,NOW())
        RETURNING *
        `,
        kind,
        title,
        messagePayload,
        JSON.stringify([]),
        "",
        "",
        false,
      );
      if (rowsCamel && rowsCamel[0]) return mapRowToNotification(rowsCamel[0]);
    } catch (fallbackCamelError) {
      try {
        const rowsSnake = await prisma.$queryRawUnsafe(
          `
          INSERT INTO "notifications"
          ("kind","name","message","issues","other_issue","visit_date","replied","created_at")
          VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7,NOW())
          RETURNING *
          `,
          kind,
          title,
          messagePayload,
          JSON.stringify([]),
          "",
          "",
          false,
        );
        if (rowsSnake && rowsSnake[0])
          return mapRowToNotification(rowsSnake[0]);
      } catch (fallbackSnakeError) {
        const aggregate = new Error("Notification persistence failed");
        aggregate.cause = {
          prismaError,
          fallbackCamelError,
          fallbackSnakeError,
        };
        throw aggregate;
      }
    }

    const unknown = new Error("Notification persistence failed");
    unknown.cause = { prismaError };
    throw unknown;
  }
};

const handleCreate = async (req, res, { strictContract }) => {
  try {
    console.log("NOTIFICATION REQUEST BODY:", req.body);

    let payload;
    if (strictContract) {
      payload = req.body || {};
    } else {
      const legacy = req.body || {};
      const legacyKind = String(legacy.kind || "repair").toUpperCase();
      const type =
        legacyKind === "CONTACT"
          ? "CONTACT"
          : legacyKind === "ORDER"
            ? "ORDER"
            : "REPAIR";
      payload = {
        type,
        title: String(legacy.name || "Request").trim() || "Request",
        data: legacy,
      };
    }

    console.log("NOTIFICATION PAYLOAD AFTER PARSING:", payload);

    const validation = validateCreatePayload(payload);
    if (!validation.ok) {
      console.log("NOTIFICATION VALIDATION FAILED:", validation);
      return res.status(validation.status).json(validation.body);
    }

    const expiresAt = buildExpiresAt();
    console.log("NOTIFICATION CREATING RECORD:", {
      type: validation.type,
      title: validation.title,
    });

    await createNotificationRecord({
      type: validation.type,
      title: validation.title,
      data: validation.data,
      expiresAt,
      normalizedPhone: validation.normalizedPhone,
    });

    return res.status(201).json({
      success: true,
      message: "Notification created",
    });
  } catch (error) {
    console.error("NOTIFICATION ERROR:", error);
    console.error("NOTIFICATION ERROR CAUSE:", error?.cause);
    console.error("NOTIFICATION ERROR CODE:", error?.code);

    if (isPrismaValidationError(error)) {
      return res.status(422).json({
        error: "Validation failed",
        details: "Notification payload is not valid for persistence",
      });
    }

    if (isPrismaConstraintError(error)) {
      return res.status(409).json({
        error: "Conflict",
        details: "Notification could not be stored due to constraint conflict",
      });
    }

    console.error("notification create controller error", error);
    return res.status(500).json({
      error: "Notification creation failed",
      details: "internal safe message",
    });
  }
};

// New strict endpoint contract
router.post("/create", async (req, res) =>
  handleCreate(req, res, { strictContract: true }),
);

// Backward-compatible endpoint for existing UI flows
router.post("/", async (req, res) =>
  handleCreate(req, res, { strictContract: false }),
);

// list notifications for admin (non-expired only)
router.get("/", auth, async (req, res) => {
  if (!assertAdminEmail(req, res)) return;

  const cutoff = new Date(Date.now() - THREE_DAYS_MS);

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        createdAt: {
          gt: cutoff,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(notifications);
  } catch (error) {
    try {
      const rows = await prisma.$queryRawUnsafe(
        `
        SELECT * FROM "notifications"
        WHERE "createdAt" > $1
        ORDER BY "createdAt" DESC
        `,
        cutoff,
      );
      return res.json((rows || []).map(mapRowToNotification));
    } catch (fallbackCamelError) {
      try {
        const rowsSnake = await prisma.$queryRawUnsafe(
          `
          SELECT * FROM "notifications"
          WHERE "created_at" > $1
          ORDER BY "created_at" DESC
          `,
          cutoff,
        );
        return res.json((rowsSnake || []).map(mapRowToNotification));
      } catch (fallbackSnakeError) {
        console.error("list notifications error", error);
        console.error(
          "list notifications fallback camel error",
          fallbackCamelError,
        );
        console.error(
          "list notifications fallback snake error",
          fallbackSnakeError,
        );
        return res.json([]);
      }
    }
  }
});

router.patch("/:id/replied", auth, async (req, res) => {
  if (!assertAdminEmail(req, res)) return;

  try {
    const { id } = req.params;
    const updated = await prisma.notification.update({
      where: { id },
      data: { replied: true },
    });
    return res.json(updated);
  } catch (error) {
    try {
      const rows = await prisma.$queryRawUnsafe(
        `
        UPDATE "notifications"
        SET "replied" = true
        WHERE "id" = $1
        RETURNING *
        `,
        req.params.id,
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: "Notification not found" });
      }
      return res.json(mapRowToNotification(rows[0]));
    } catch (fallbackCamelError) {
      try {
        const rowsSnake = await prisma.$queryRawUnsafe(
          `
          UPDATE "notifications"
          SET "replied" = true
          WHERE "id" = $1
          RETURNING *
          `,
          req.params.id,
        );
        if (!rowsSnake || rowsSnake.length === 0) {
          return res.status(404).json({ error: "Notification not found" });
        }
        return res.json(mapRowToNotification(rowsSnake[0]));
      } catch (fallbackSnakeError) {
        console.error("mark replied error", error);
        console.error("mark replied fallback camel error", fallbackCamelError);
        console.error("mark replied fallback snake error", fallbackSnakeError);
        return res.status(500).json({ error: "Internal server error" });
      }
    }
  }
});

router.delete("/:id", auth, async (req, res) => {
  if (!assertAdminEmail(req, res)) return;

  try {
    await prisma.notification.delete({ where: { id: req.params.id } });
    return res.status(204).end();
  } catch (error) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "notifications" WHERE "id" = $1`,
        req.params.id,
      );
      return res.status(204).end();
    } catch (fallbackError) {
      console.error("delete notification error", error);
      console.error("delete notification fallback error", fallbackError);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
});

module.exports = router;
