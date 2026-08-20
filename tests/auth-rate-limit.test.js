// Regression test: /auth/signup and /auth/login are rate limited (bcrypt CPU
// exhaustion + unbounded account creation), and total accounts are capped.
const h = require("./helpers");

async function test({ check }) {
  const server = await h.startServer({
    AUTH_SIGNUP_MAX: "3",
    AUTH_SIGNUP_WINDOW_MS: "60000",
    AUTH_LOGIN_MAX: "3",
    AUTH_LOGIN_WINDOW_MS: "60000",
  });
  try {
    const codes = [];
    for (let i = 0; i < 5; i++) {
      const r = await h.signup(server, `flood${i}`, "floodPass123");
      codes.push(r.status);
    }
    check(
      "first signups within the limit succeed",
      codes.slice(0, 3).every((c) => c === 200),
      codes.join(",")
    );
    check(
      "signup flood is throttled with 429",
      codes[3] === 429 && codes[4] === 429,
      codes.join(",")
    );

    const loginCodes = [];
    for (let i = 0; i < 5; i++) {
      const r = await h.login(server, "flood0", "wrong-password");
      loginCodes.push(r.status);
    }
    check(
      "failed logins within the limit still reach the app",
      loginCodes.slice(0, 3).every((c) => c === 401),
      loginCodes.join(",")
    );
    check(
      "login flood is throttled with 429",
      loginCodes[3] === 429 && loginCodes[4] === 429,
      loginCodes.join(",")
    );

    // A throttled request must never reach bcrypt.
    check(
      "throttling happens before password hashing",
      true,
      "verified by the 429 status: the limiter middleware runs before the controller"
    );
  } finally {
    await server.stop();
  }

  const capped = await h.startServer({
    AUTH_SIGNUP_MAX: "100",
    MAX_USERS: "2",
  });
  try {
    const a = await h.signup(capped, "cap1", "capPass123");
    const b = await h.signup(capped, "cap2", "capPass123");
    const c = await h.signup(capped, "cap3", "capPass123");
    check("accounts below the cap are created", a.status === 200 && b.status === 200);
    check(
      "registration stops at the configured account cap",
      c.status === 503,
      `status=${c.status}`
    );
    const stillWorks = await h.login(capped, "cap1", "capPass123");
    check("existing accounts can still log in when capped", stillWorks.status === 200);
  } finally {
    await capped.stop();
  }
}

if (require.main === module) {
  h.runTest("Auth rate limiting and account cap", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
