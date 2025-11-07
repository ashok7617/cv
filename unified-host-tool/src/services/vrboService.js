import { fetchBookingsFromICal } from "../utils/icalParser.js";
import { pool } from "../db/index.js";

export async function syncVrboListing(listing) {
  if (!listing || !listing.ical_url) {
    throw new Error("Listing with iCal URL is required to sync Vrbo data");
  }

  const bookings = await fetchBookingsFromICal(listing.ical_url);

  for (const booking of bookings) {
    await pool.query(
      `INSERT INTO bookings (listing_id, platform, start_date, end_date, guest_name, reservation_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (reservation_id) DO NOTHING`,
      [
        listing.id,
        "vrbo",
        booking.start_date,
        booking.end_date,
        booking.summary,
        booking.uid,
      ],
    );
  }

  await pool.query(`UPDATE listings SET last_sync = NOW() WHERE id = $1`, [
    listing.id,
  ]);

  return bookings.length;
}
