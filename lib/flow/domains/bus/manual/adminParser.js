/**
 * Admin Parser for Manual Bus Booking
 * Supports:
 * 1) Pipe format (|)
 * 2) Comma format (,)
 * 3) At format (@)
 *
 * Format:
 * BUS_OPTIONS
 * KPN | AC Sleeper | 22:30 | 7 | 12 | 1200
 */

const REQUIRED_FIELDS = [
  "name",
  "type",
  "time",
  "duration",
  "seats",
  "price",
];

/* ================================
 * Helpers
 * ================================ */

function normalizeLine(line) {
  return line.replace(/\s+/g, " ").trim();
}

function isValidTime(time) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(time);
}

function isPositiveNumber(val) {
  return !isNaN(val) && Number(val) > 0;
}

function normalizeDuration(val) {
  if (!val) return val;
  if (/^\d+$/.test(val)) return `${val}h`;
  return val;
}

function splitLine(line) {
  if (line.includes("|")) return line.split("|");
  if (line.includes("@")) return line.split("@");
  if (line.includes(",")) return line.split(",");
  return null;
}

/* ================================
 * BUS OPTIONS PARSER
 * ================================ */

function parseBusOptions(text) {
  if (!text) return error("❌ Empty admin message");

  const lines = text
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  const header = lines[0].toUpperCase();

  if (header !== "BUS_OPTIONS" && header !== "BUS") {
    return error("❌ Message must start with BUS_OPTIONS or BUS");
  }

  const dataLines = lines.slice(1);
  if (!dataLines.length) {
    return error("❌ No bus data provided");
  }

  const buses = [];
  const errors = [];

  dataLines.forEach((line, index) => {
    const partsRaw = splitLine(line);

    if (!partsRaw) {
      errors.push(`Line ${index + 1}: Invalid separator`);
      return;
    }

    let parts = partsRaw.map(p => p.trim());

    // Remove numbering if present
    if (parts.length === 7) parts.shift();

    if (parts.length !== 6) {
      errors.push(`Line ${index + 1}: Expected 6 fields`);
      return;
    }

    let [name, type, time, duration, seats, price] = parts;

    duration = normalizeDuration(duration);

    const bus = {
      id: buses.length + 1,
      name,
      type,
      time,
      duration,
      seats,
      price,
    };

    const lineErrors = [];

    REQUIRED_FIELDS.forEach(field => {
      if (!bus[field]) lineErrors.push(`Missing ${field}`);
    });

    if (time && !isValidTime(time)) {
      lineErrors.push(`Invalid time (${time})`);
    }

    if (seats && !isPositiveNumber(seats)) {
      lineErrors.push("Invalid seat count");
    }

    if (price && !isPositiveNumber(price)) {
      lineErrors.push("Invalid price");
    }

    if (lineErrors.length) {
      errors.push(`Line ${index + 1}: ${lineErrors.join(", ")}`);
      return;
    }

    buses.push({
      ...bus,
      seats: Number(seats),
      price: Number(price),
    });
  });

  if (errors.length) {
    return error(errors.join("\n"));
  }

  return success(buses);
}

/* ================================
 * SEAT RULE PARSER
 * ================================ */

function parseSeatRules(text) {
  if (!text) return error("❌ Empty seat rules");

  const rules = {
    AVAILABLE: [],
    LADIES: [],
  };

  const seatRegex = /^[A-Z]{1,2}\d+$/;

  text.split("\n").forEach(line => {
    if (!line.includes(":")) return;

    const [keyRaw, value] = line.split(":");
    const key = keyRaw.trim().toUpperCase();

    if (!rules[key]) return;

    const seats = value
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(s => seatRegex.test(s));

    rules[key] = seats;
  });

  if (!rules.AVAILABLE.length) {
    return error("❌ Seat map missing AVAILABLE seats");
  }

  return success(rules);
}

/* ================================
 * Response Helpers
 * ================================ */

function error(message) {
  return { ok: false, error: message };
}

function success(data) {
  return { ok: true, data };
}

/* ================================
 * Exports
 * ================================ */

module.exports = {
  parseBusOptions,
  parseSeatRules,
};
