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
  console.log("🟢 PARSE BUS OPTIONS START");

  try {
    /* ================================
     * STEP 1: Validate input
     * ================================ */
    try {
      if (!text) {
        console.log("❌ EMPTY ADMIN MESSAGE");
        return error("❌ Empty admin message");
      }
    } catch (err) {
      console.error("🔥 ERROR VALIDATING INPUT", err);
      throw err;
    }

    /* ================================
     * STEP 2: Normalize lines
     * ================================ */
    let lines;
    try {
      lines = text
        .split("\n")
        .map(normalizeLine)
        .filter(Boolean);

      console.log("🧪 NORMALIZED LINES COUNT:", lines.length);
    } catch (err) {
      console.error("🔥 ERROR NORMALIZING LINES", err);
      throw err;
    }

    /* ================================
     * STEP 3: Header validation
     * ================================ */
    let header;
    try {
      header = lines[0]?.toUpperCase();

      if (header !== "BUS_OPTIONS" && header !== "BUS") {
        console.log("❌ INVALID HEADER:", header);
        return error("❌ Message must start with BUS_OPTIONS or BUS");
      }
    } catch (err) {
      console.error("🔥 ERROR VALIDATING HEADER", err);
      throw err;
    }

    /* ================================
     * STEP 4: Extract data lines
     * ================================ */
    let dataLines;
    try {
      dataLines = lines.slice(1);

      if (!dataLines.length) {
        console.log("❌ NO BUS DATA PROVIDED");
        return error("❌ No bus data provided");
      }
    } catch (err) {
      console.error("🔥 ERROR EXTRACTING DATA LINES", err);
      throw err;
    }

    const buses = [];
    const errors = [];

    /* ================================
     * STEP 5: Parse each bus line
     * ================================ */
    dataLines.forEach((line, index) => {
      try {
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

      } catch (err) {
        console.error(`🔥 ERROR PARSING LINE ${index + 1}`, err);
        errors.push(`Line ${index + 1}: Unexpected parsing error`);
      }
    });

    /* ================================
     * STEP 6: Final validation
     * ================================ */
    try {
      if (errors.length) {
        console.log("❌ PARSING ERRORS FOUND");
        return error(errors.join("\n"));
      }
    } catch (err) {
      console.error("🔥 ERROR FINALIZING PARSE", err);
      throw err;
    }

    console.log("🟢 PARSE BUS OPTIONS END — SUCCESS");
    return success(buses);

  } catch (err) {
    console.error("🔥🔥 FATAL BUS OPTIONS PARSE ERROR", err);
    return error("❌ Failed to parse bus options due to an internal error");
  }
}

/* ================================
 * SEAT RULE PARSER
 * ================================ */

function parseSeatRules(text) {
  console.log("🟢 PARSE SEAT RULES START");

  try {
    if (!text) return error("❌ Empty seat rules");

    const rules = {
      AVAILABLE: [],
      LADIES: [],
    };

    const seatRegex = /^[A-Z]{1,2}\d+$/;

    text.split("\n").forEach((line, index) => {
      try {
        if (!line.includes(":")) return;

        const [keyRaw, value] = line.split(":");
        const key = keyRaw.trim().toUpperCase();

        if (!rules[key]) return;

        const seats = value
          .split(",")
          .map(s => s.trim().toUpperCase())
          .filter(s => seatRegex.test(s));

        rules[key] = seats;
      } catch (err) {
        console.error(`🔥 ERROR PARSING SEAT RULE LINE ${index + 1}`, err);
      }
    });

    if (!rules.AVAILABLE.length) {
      return error("❌ Seat map missing AVAILABLE seats");
    }

    console.log("🟢 PARSE SEAT RULES END — SUCCESS");
    return success(rules);

  } catch (err) {
    console.error("🔥🔥 FATAL SEAT RULE PARSE ERROR", err);
    return error("❌ Failed to parse seat rules due to an internal error");
  }
}

/* ================================
 * SEAT OPTIONS PARSER (ADD ONLY)
 * ================================ */

function parseSeatOptions(text) {
  console.log("🟢 PARSE SEAT OPTIONS START");

  try {
    if (!text) return error("❌ Empty seat options");

    const seatRegex = /^[UL]\d+$/;

    const seatMap = {
      availableUpper: [],
      availableLower: [],
      ladies: [],
    };

    let mode = null;

    const lines = text
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const header = lines[0]?.toUpperCase();
    if (header !== "SEAT_OPTIONS") {
      return error("❌ Message must start with SEAT_OPTIONS");
    }

    lines.slice(1).forEach(line => {
      const upper = line.toUpperCase();

      if (upper.startsWith("AVAILABLE")) {
        mode = "AVAILABLE";
        return;
      }

      if (upper.startsWith("LADIES")) {
        mode = "LADIES";
        return;
      }

      if (mode === "AVAILABLE") {
        if (upper.startsWith("UPPER")) {
          const seats = line.split(":")[1] || "";
          seats
            .split(",")
            .map(s => s.trim().toUpperCase())
            .filter(s => seatRegex.test(s))
            .forEach(s => seatMap.availableUpper.push(s));
        }

        if (upper.startsWith("LOWER")) {
          const seats = line.split(":")[1] || "";
          seats
            .split(",")
            .map(s => s.trim().toUpperCase())
            .filter(s => seatRegex.test(s))
            .forEach(s => seatMap.availableLower.push(s));
        }
      }

      if (mode === "LADIES") {
        line
          .split(/[\s,]+/)
          .map(s => s.trim().toUpperCase())
          .filter(s => seatRegex.test(s))
          .forEach(s => seatMap.ladies.push(s));
      }
    });

    if (
      seatMap.availableUpper.length === 0 &&
      seatMap.availableLower.length === 0
    ) {
      return error("❌ No available seats found");
    }

    console.log("🟢 PARSE SEAT OPTIONS END — SUCCESS");
    return success(seatMap);
  } catch {
    return error("❌ Failed to parse seat options");
  }
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
  parseSeatOptions
};
