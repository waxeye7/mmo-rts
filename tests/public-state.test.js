// GET /public/state is the no-login spectator snapshot.
// Must not require a cookie and must not leak password hashes or _id.
const h = require("./helpers");

async function test({ check }) {
  const server = await h.startServer();
  try {
    const created = await h.signup(server, "looker", "lookerPass123");
    check("seed player exists", created.status === 200);

    const anon = await h.api(server, "GET", "/public/state");
    check("anonymous request is allowed", anon.status === 200, `status=${anon.status}`);
    check("payload is json", !!anon.json, anon.text.slice(0, 160));
    check("board is a 2d array", Array.isArray(anon.json && anon.json.board));
    check(
      "players lists the seed account without secrets",
      anon.json &&
        anon.json.players &&
        anon.json.players.looker &&
        typeof anon.json.players.looker.backgroundColor === "string",
      anon.text.slice(0, 200)
    );
    check(
      "no password hashes leak",
      !/\$2[aby]\$/.test(anon.text),
      anon.text.slice(0, 200)
    );
    check("no _id leaks", !/"_id"/.test(anon.text));
    check(
      "next tick is a number",
      typeof (anon.json && anon.json.nextTick) === "number"
    );
    check(
      "remainingSeconds is a number",
      typeof (anon.json && anon.json.remainingSeconds) === "number"
    );
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("GET /public/state spectator snapshot", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
