import express from "express";
import dotenv from "dotenv";
import cron from "node-cron";

import listingsRouter from "./routes/listings.js";
import bookingsRouter from "./routes/bookings.js";
import { pool } from "./db/index.js";
import { syncAirbnbListing } from "./services/airbnbService.js";
import { syncVrboListing } from "./services/vrboService.js";

dotenv.config();

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/listings", listingsRouter);
app.use("/api/bookings", bookingsRouter);

cron.schedule("*/15 * * * *", async () => {
  try {
    const { rows } = await pool.query("SELECT * FROM listings");

    for (const listing of rows) {
      if (listing.platform === "airbnb") {
        await syncAirbnbListing(listing);
      } else if (listing.platform === "vrbo") {
        await syncVrboListing(listing);
      }
    }

    console.log("Sync complete:", new Date().toISOString());
  } catch (error) {
    console.error("Scheduled sync failed:", error);
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
