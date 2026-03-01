const express = require("express");
const { adminAuth } = require("../middleware/auth");
const prisma = require("../utils/prisma");

const router = express.Router();

// GET /api/technicians - Public endpoint (no auth required)
router.get("/", async (req, res) => {
  try {
    const contentSettings = await prisma.content_settings.findFirst();

    if (!contentSettings || !contentSettings.technicians) {
      return res.json([]);
    }

    const technicians = contentSettings.technicians;

    // Return formatted technicians array
    res.json(
      technicians.map((tech) => ({
        id: tech.id,
        name: tech.name,
        role: tech.role,
        image: tech.image,
        yearsOfExperience: tech.yearsOfExperience,
        rating: tech.rating,
      })),
    );
  } catch (error) {
    console.error("Get technicians error:", error);
    res.status(500).json({ error: "Failed to fetch technicians" });
  }
});

// POST /api/technicians - Create technician (admin only)
router.post("/", adminAuth, async (req, res) => {
  try {
    const { name, role, image, yearsOfExperience, rating } = req.body;

    if (!name || !role || !image) {
      return res
        .status(400)
        .json({ error: "Name, role, and image are required" });
    }

    const contentSettings = await prisma.content_settings.findFirst();

    let technicians = [];
    if (contentSettings && contentSettings.technicians) {
      technicians = [...contentSettings.technicians];
    }

    const newId =
      technicians.length > 0
        ? Math.max(...technicians.map((t) => t.id), 0) + 1
        : 1;

    const newTechnician = {
      id: newId,
      name,
      role,
      image,
      yearsOfExperience: yearsOfExperience || null,
      rating: rating || null,
    };

    technicians.push(newTechnician);

    if (contentSettings) {
      await prisma.content_settings.update({
        where: { id: contentSettings.id },
        data: { technicians },
      });
    } else {
      await prisma.content_settings.create({
        data: { technicians },
      });
    }

    res.status(201).json(newTechnician);
  } catch (error) {
    console.error("Create technician error:", error);
    res.status(500).json({ error: "Failed to create technician" });
  }
});

// PUT /api/technicians/:id - Update technician (admin only)
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, image, yearsOfExperience, rating } = req.body;

    const contentSettings = await prisma.content_settings.findFirst();

    if (!contentSettings || !contentSettings.technicians) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const technicians = [...contentSettings.technicians];
    const index = technicians.findIndex((t) => t.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Technician not found" });
    }

    // Update only provided fields, keep existing for undefined
    technicians[index] = {
      ...technicians[index],
      ...(name !== undefined && { name }),
      ...(role !== undefined && { role }),
      ...(image !== undefined && { image }),
      ...(yearsOfExperience !== undefined && { yearsOfExperience }),
      ...(rating !== undefined && { rating }),
    };

    await prisma.content_settings.update({
      where: { id: contentSettings.id },
      data: { technicians },
    });

    res.json(technicians[index]);
  } catch (error) {
    console.error("Update technician error:", error);
    res.status(500).json({ error: "Failed to update technician" });
  }
});

// DELETE /api/technicians/:id - Delete technician (admin only)
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const contentSettings = await prisma.content_settings.findFirst();

    if (!contentSettings || !contentSettings.technicians) {
      return res.status(404).json({ error: "Technician not found" });
    }

    const technicians = contentSettings.technicians.filter(
      (t) => t.id !== parseInt(id),
    );

    await prisma.content_settings.update({
      where: { id: contentSettings.id },
      data: { technicians },
    });

    res.json({ success: true, message: "Technician deleted successfully" });
  } catch (error) {
    console.error("Delete technician error:", error);
    res.status(500).json({ error: "Failed to delete technician" });
  }
});

module.exports = router;
