import express from "express";
import { pool } from "../db/index.js";
import { syncAirbnbListing } from "../services/airbnbService.js";
import { syncVrboListing } from "../services/vrboService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { user_id, platform, listing_id, ical_url } = req.body;

  if (!user_id || !platform || !ical_url) {
    return res.status(400).json({
      error: "user_id, platform, and ical_url are required",
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO listings (user_id, platform, listing_id, ical_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, platform, listing_id || null, ical_url],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Failed to create listing:", error);
    res.status(500).json({ error: "Failed to create listing" });
  }
});

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, user_id, platform, listing_id, ical_url, last_sync FROM listings ORDER BY id DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch listings:", error);
    res.status(500).json({ error: "Failed to fetch listings" });
  }
});

router.post("/:id/sync", async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query("SELECT * FROM listings WHERE id = $1", [
      id,
    ]);

    if (!rows.length) {
      return res.status(404).json({ error: "Listing not found" });
    }

    const listing = rows[0];
    let syncedCount = 0;

    if (listing.platform === "airbnb") {
      syncedCount = await syncAirbnbListing(listing);
    } else if (listing.platform === "vrbo") {
      syncedCount = await syncVrboListing(listing);
    } else {
      return res.status(400).json({ error: "Unsupported platform" });
    }

    res.json({
      message: `Listing ${listing.id} synced`,
      bookingsProcessed: syncedCount,
    });
  } catch (error) {
    console.error("Failed to sync listing:", error);
    res.status(500).json({ error: "Failed to sync listing" });
  }
});

export default router;
