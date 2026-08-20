// Runs every security regression test in one process.
//   node tests/run-all.js
// Needs a local MongoDB (default mongodb://127.0.0.1:27018, override with
// MONGO_TEST_URI). Never point this at production data: each run creates and
// uses a throwaway database.
const h = require("./helpers");

const SUITES = [
  ["IDOR: PUT /users/:id account takeover", require("./idor-update-user.test")],
  ["Socket 'loggedIn' unauthenticated crash", require("./socket-loggedin-crash.test")],
  ["placeFirstSpawn broadcasts full user document", require("./place-first-spawn-leak.test")],
  ["JWT expiry and revocation", require("./jwt-expiry-revocation.test")],
  ["GET /users/all authentication + bounding", require("./users-all-auth.test")],
  ["Auth rate limiting and account cap", require("./auth-rate-limit.test")],
  ["Action payload validation / turn processor crash", require("./action-payload-validation.test")],
  ["GET /public/state spectator snapshot", require("./public-state.test")],
];

(async () => {
  const failed = [];
  for (const [title, fn] of SUITES) {
    const ok = await h.runTest(title, fn);
    if (!ok) failed.push(title);
  }
  console.log("\n==================================================");
  if (failed.length) {
    console.log(`FAILED suites (${failed.length}/${SUITES.length}):`);
    failed.forEach((f) => console.log(" - " + f));
  } else {
    console.log(`All ${SUITES.length} suites passed.`);
  }
  process.exit(failed.length ? 1 : 0);
})();
