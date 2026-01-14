/**
 * FLIGHT SEARCH (COMING SOON)
 * Purpose:
 * - Explicitly block search
 * - Keep interface consistent for future APIs
 */

module.exports = async function flightSearch() {
  return {
    ok: false,
    type: "FLIGHT",
    errors: ["Flight booking not available yet"],
    meta: {
      status: "COMING_SOON",
    },
  };
};
