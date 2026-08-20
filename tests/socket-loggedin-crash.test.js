// Regression test: an unauthenticated client that emits 'loggedIn' with a
// malformed/expired token must not kill the Node process (jwt.verify throws).
const h = require("./helpers");

async function test({ check }) {
  const server = await h.startServer();
  try {
    // --- the attack: no account, garbage token ---
    const attacker = h.connectSocket(server, "this.is.garbage");
    let authError = false;
    attacker.on("authentication_error", () => (authError = true));
    await new Promise((resolve, reject) => {
      attacker.on("connect", resolve);
      attacker.on("connect_error", reject);
      setTimeout(() => reject(new Error("socket connect timeout")), 8000);
    });
    attacker.emit("loggedIn");
    await h.sleep(1200);

    check("server process still alive after malformed token", server.alive());
    check("client was told authentication failed", authError);

    // a token signed with the wrong key
    const jwt = require("jsonwebtoken");
    const forged = jwt.sign({ id: "aaaaaaaaaaaaaaaaaaaaaaaa" }, "wrong-secret", {
      expiresIn: "1h",
    });
    const attacker2 = h.connectSocket(server, forged);
    await new Promise((r) => attacker2.on("connect", r));
    attacker2.emit("loggedIn");
    await h.sleep(800);
    check("server process still alive after wrong-key token", server.alive());

    // an expired token signed with the right key
    const expired = jwt.sign({ id: "aaaaaaaaaaaaaaaaaaaaaaaa" }, server.secret, {
      expiresIn: -60,
    });
    const attacker3 = h.connectSocket(server, expired);
    await new Promise((r) => attacker3.on("connect", r));
    attacker3.emit("loggedIn");
    await h.sleep(800);
    check("server process still alive after expired token", server.alive());

    // no cookie at all
    const attacker4 = h.connectSocket(server);
    await new Promise((r) => attacker4.on("connect", r));
    attacker4.emit("loggedIn");
    await h.sleep(800);
    check("server process still alive with no cookie", server.alive());

    // HTTP still serves traffic
    let httpOk = false;
    try {
      const res = await h.api(server, "GET", "/users/all");
      httpOk = res.status === 200 || res.status === 401;
    } catch (_) {
      httpOk = false;
    }
    check("http endpoint still reachable", httpOk);

    // raw session tokens must not be written to the server log
    check(
      "server log does not echo raw session tokens",
      !server.output.includes("this.is.garbage"),
      server.output.split("\n").slice(-3).join(" | ")
    );

    for (const s of [attacker, attacker2, attacker3, attacker4]) s.disconnect();

    // --- the legitimate path still works: a real token binds the socket ---
    const user = await h.signup(server, "sockuser", "sockPass123");
    const good = h.connectSocket(server, user.token);
    await new Promise((r) => good.on("connect", r));
    const gotUpdate = new Promise((resolve) => {
      good.on("updateUser", () => resolve(true));
      setTimeout(() => resolve(false), 4000);
    });
    good.emit("loggedIn");
    await h.sleep(500);
    good.emit("action", {
      id: "test-action-1",
      type: "build tower",
      payload: { x: 1, y: 1, username: "sockuser", structureType: "structureTower" },
    });
    check("valid token still binds the socket (action accepted)", await gotUpdate);
    good.disconnect();
    check("server still alive at end of test", server.alive());
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("Socket 'loggedIn' unauthenticated crash", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
