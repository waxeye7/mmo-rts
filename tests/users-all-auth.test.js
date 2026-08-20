// Regression test: GET /users/all must require a session, must not disclose
// password hashes, and must be bounded (no unpaginated full-collection dump).
const h = require("./helpers");

async function test({ check }) {
  const server = await h.startServer({ MAX_USERS_RETURNED: "3" });
  try {
    const anon = await h.api(server, "GET", "/users/all");
    check(
      "anonymous request is rejected",
      anon.status === 401,
      `status=${anon.status} body=${anon.text.slice(0, 120)}`
    );

    const user = await h.signup(server, "player1", "playerPass123");
    await h.signup(server, "player2", "playerPass123");
    await h.signup(server, "player3", "playerPass123");
    await h.signup(server, "player4", "playerPass123");
    await h.signup(server, "player5", "playerPass123");

    const authed = await h.api(server, "GET", "/users/all", { token: user.token });
    check("authenticated request still works", authed.status === 200, `status=${authed.status}`);
    check(
      "response still shaped as { username: identifier }",
      authed.json &&
        authed.json.player1 &&
        typeof authed.json.player1.backgroundColor === "string",
      authed.text.slice(0, 200)
    );
    check(
      "no password hashes in the response",
      !/\$2[aby]\$/.test(authed.text),
      authed.text.slice(0, 200)
    );
    check(
      "result set is bounded by the configured cap",
      Object.keys(authed.json || {}).length <= 3,
      `count=${Object.keys(authed.json || {}).length}`
    );
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("GET /users/all authentication + bounding", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
