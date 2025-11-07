import express from "express";
import { pool } from "../db/index.js";

const router = express.Router();

router.get("/", async (req, res) => {
  const { listing_id: listingId } = req.query;

  try {
    let queryText = `
      SELECT id, listing_id, platform, start_date, end_date, guest_name, reservation_id, created_at
      FROM bookings
    `;
    const params = [];

    if (listingId) {
      queryText += " WHERE listing_id = $1";
      params.push(listingId);
    }

    queryText += " ORDER BY start_date DESC";

    const { rows } = await pool.query(queryText, params);
    res.json(rows);
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { rowCount } = await pool.query(
      "DELETE FROM bookings WHERE id = $1",
      [id],
    );

    if (!rowCount) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
});

export default router;
