function getTimerAmount() {
  // Must match the turn cron in server/index.js (hourly) — this value is what
  // the "time until actions refill" countdown is derived from.
  return 60 * 60 * 1000;
}

module.exports = getTimerAmount;