/**
 * Admin Parser for Manual Bus Booking
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
    if (!text || typeof text !== "string") {
      console.warn("⚠️ parseBusOptions received invalid input", { text });
      return error("❌ Empty or invalid admin message");
    }

    const lines = text
      .split("\n")
      .map(normalizeLine)
      .filter(Boolean);

    if (!lines.length) {
      return error("❌ Empty admin message");
    }

    const header = lines[0]?.toUpperCase();

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
      try {
        const partsRaw = splitLine(line);

        if (!partsRaw) {
          errors.push(
            `Line ${index + 1}: Invalid separator (use | , or @)`
          );
          return;
        }

        let parts = partsRaw.map(p => p.trim());

        if (parts.length === 7) parts.shift();

        if (parts.length !== 6) {
          errors.push(
            `Line ${index + 1}: Expected 6 fields, got ${parts.length}`
          );
          return;
        }

        let [name, type, time, duration, seats, price] = parts;

        duration = normalizeDuration(duration);

        const bus = { name, type, time, duration, seats, price };

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
        console.error("🔥 ERROR PARSING BUS LINE", {
          lineNumber: index + 1,
          line,
          error: err.message,
        });

        errors.push(`Line ${index + 1}: Unexpected parsing error`);
      }
    });

    if (errors.length) {
      console.warn("⚠️ BUS OPTIONS PARSE FAILED", { errors });
      return error(errors.join("\n"));
    }

    console.log("🟢 PARSE BUS OPTIONS END — SUCCESS");
    return success(buses);

  } catch (err) {
    console.error("🔥 FATAL BUS OPTIONS PARSE ERROR", {
      preview: text?.slice?.(0, 200),
      error: err.message,
    });

    return error(
      "❌ Failed to parse bus options due to an internal error"
    );
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

        if (!rules[key]) {
          console.warn("⚠️ Unknown seat rule key", { key });
          return;
        }

        const seats = value
          .split(",")
          .map(s => s.trim().toUpperCase())
          .filter(s => seatRegex.test(s));

        rules[key] = seats;

      } catch (err) {
        console.error("🔥 ERROR PARSING SEAT RULE LINE", {
          lineNumber: index + 1,
          line,
          error: err.message,
        });
      }
    });

    if (!rules.AVAILABLE.length) {
      return error("❌ Seat map missing AVAILABLE seats");
    }

    console.log("🟢 PARSE SEAT RULES END — SUCCESS");
    return success(rules);

  } catch (err) {
    console.error("🔥 FATAL SEAT RULE PARSE ERROR", {
      preview: text?.slice?.(0, 200),
      error: err.message,
    });

    return error(
      "❌ Failed to parse seat rules due to an internal error"
    );
  }
}

/* ================================
 * SEAT OPTIONS PARSER
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

    lines.slice(1).forEach((line, index) => {
      const upper = line.toUpperCase();

      if (upper.startsWith("AVAILABLE")) {
        mode = "AVAILABLE";
        return;
      }

      if (upper.startsWith("LADIES")) {
        mode = "LADIES";
        return;
      }

      try {
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

      } catch (err) {
        console.error("🔥 ERROR PARSING SEAT OPTIONS LINE", {
          lineNumber: index + 2,
          line,
          error: err.message,
        });
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

  } catch (err) {
    console.error("🔥 FATAL SEAT OPTIONS PARSE ERROR", {
      preview: text?.slice?.(0, 200),
      error: err.message,
    });

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

module.exports = {
  parseBusOptions,
  parseSeatRules,
  parseSeatOptions
};
