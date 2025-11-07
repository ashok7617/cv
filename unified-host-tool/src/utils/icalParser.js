import ical from "ical";
import axios from "axios";

export async function fetchBookingsFromICal(url) {
  if (!url) {
    throw new Error("iCal URL is required");
  }

  const response = await axios.get(url);
  const calendar = ical.parseICS(response.data);
  const bookings = [];

  for (const key of Object.keys(calendar)) {
    const event = calendar[key];
    if (!event || event.type !== "VEVENT") continue;

    bookings.push({
      start_date: event.start ? new Date(event.start) : null,
      end_date: event.end ? new Date(event.end) : null,
      summary: event.summary || "Guest",
      uid: event.uid || key,
    });
  }

  return bookings;
}
