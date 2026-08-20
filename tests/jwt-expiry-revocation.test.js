// Regression test: session JWTs must expire, and a password change must
// revoke tokens issued before it.
const jwt = require("jsonwebtoken");
const h = require("./helpers");

function payloadOf(token) {
  return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
}

async function test({ check }) {
  const server = await h.startServer();
  try {
    const signed = await h.signup(server, "tokenuser", "tokenPass123");
    const p = payloadOf(signed.token);
    check("issued token has an exp claim", typeof p.exp === "number", JSON.stringify(p));
    check(
      "exp is the documented 2h session length",
      p.exp - p.iat === 7200,
      `exp-iat=${p.exp - p.iat}`
    );

    const loggedIn = await h.login(server, "tokenuser", "tokenPass123");
    const lp = payloadOf(loggedIn.token);
    check("login token has an exp claim too", typeof lp.exp === "number", JSON.stringify(lp));

    const doc = await h.findUserDoc(server, "tokenuser");
    const uid = String(doc._id);

    // Legacy tokens (issued before this fix) carry no exp. They must stop
    // working once they are older than the session length...
    const staleLegacy = jwt.sign(
      { id: uid, iat: Math.floor(Date.now() / 1000) - 3 * 3600 },
      server.secret
    );
    const staleRes = await h.api(server, "GET", "/users/me", { token: staleLegacy });
    check(
      "legacy token older than the session length is rejected",
      staleRes.status === 401,
      `status=${staleRes.status}`
    );

    // ...but a freshly issued legacy token keeps working, so live players are
    // not force-logged-out by the deploy.
    const freshLegacy = jwt.sign({ id: uid }, server.secret);
    const freshRes = await h.api(server, "GET", "/users/me", { token: freshLegacy });
    check(
      "recent legacy token still works (no forced re-login on deploy)",
      freshRes.status === 200,
      `status=${freshRes.status}`
    );

    // Password change revokes previously issued tokens.
    const sessionA = (await h.login(server, "tokenuser", "tokenPass123")).token;
    const sessionB = (await h.login(server, "tokenuser", "tokenPass123")).token;
    const before = await h.api(server, "GET", "/users/me", { token: sessionA });
    check("session A works before the password change", before.status === 200);

    const change = await h.api(server, "PUT", "/users/me", {
      token: sessionB,
      body: { password: "rotatedPass456" },
    });
    check("password change succeeds", change.status === 200, `status=${change.status}`);

    const after = await h.api(server, "GET", "/users/me", { token: sessionA });
    check(
      "session A is revoked by the password change",
      after.status === 401,
      `status=${after.status}`
    );
    const legacyAfter = await h.api(server, "GET", "/users/me", { token: freshLegacy });
    check(
      "legacy token is revoked by the password change too",
      legacyAfter.status === 401,
      `status=${legacyAfter.status}`
    );

    check("password change hands back a fresh cookie", !!change.cookie);
    const withNew = await h.api(server, "GET", "/users/me", { token: change.cookie });
    check(
      "the caller stays logged in with the fresh cookie",
      withNew.status === 200,
      `status=${withNew.status}`
    );
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("JWT expiry and revocation", test).then((ok) => process.exit(ok ? 0 : 1));
}
module.exports = test;
