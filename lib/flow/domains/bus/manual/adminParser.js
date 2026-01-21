/**
 * Admin Parser for Manual Bus Booking
 * Supports:
 * 1) Pipe format (|)
 * 2) Comma format (,)
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

function isNumber(val) {
  return !isNaN(val) && Number(val) > 0;
}

/* ================================
 * BUS OPTIONS PARSER
 * ================================ */

function parseBusOptions(text) {
  if (!text) return error("Empty admin message");

  const lines = text
    .split("\n")
    .map(normalizeLine)
    .filter(Boolean);

  const header = lines[0].toUpperCase();

  if (header !== "BUS_OPTIONS" && header !== "BUS") {
    return error("Message must start with BUS_OPTIONS or BUS");
  }

  const dataLines = lines.slice(1);
  if (!dataLines.length) {
    return error("No bus data provided");
  }

  const buses = [];
  const errors = [];

  dataLines.forEach((line, index) => {
    let parts;

    // FORMAT 1 → Pipe |
    if (line.includes("|")) {
      parts = line.split("|").map(p => p.trim());
      if (parts.length === 7) parts.shift(); // remove numbering if present
    }
    // FORMAT 2 → Comma ,
    else if (line.includes(",")) {
      parts = line.split(",").map(p => p.trim());
    } else {
      errors.push(`Line ${index + 1}: Invalid format`);
      return;
    }

    const [name, type, time, duration, seats, price] = parts;

    const bus = {
      id: buses.length + 1,
      name,
      type,
      time,
      duration,
      seats,
      price,
    };

    // Validation
    REQUIRED_FIELDS.forEach(field => {
      if (!bus[field]) {
        errors.push(`Line ${index + 1}: Missing ${field}`);
      }
    });

    if (time && !isValidTime(time)) {
      errors.push(`Line ${index + 1}: Invalid time (${time})`);
    }

    if (seats && !isNumber(seats)) {
      errors.push(`Line ${index + 1}: Invalid seat count`);
    }

    if (price && !isNumber(price)) {
      errors.push(`Line ${index + 1}: Invalid price`);
    }

    buses.push(bus);
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
  const rules = {
    AVAILABLE: [],
    LADIES: [],
  };

  const lines = text.split("\n");

  lines.forEach(line => {
    const [key, value] = line.split(":");
    if (!value) return;

    const seats = value.split(",").map(s => s.trim());
    if (rules[key]) rules[key] = seats;
  });

  if (!rules.AVAILABLE.length) {
    return error("Seat map missing AVAILABLE seats");
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
