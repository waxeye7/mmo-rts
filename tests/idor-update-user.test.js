// Regression test: PUT /users/:id must not let one account change another
// account's password (IDOR / horizontal privilege escalation), and must not
// return the target document (bcrypt hash + _id) in its response.
const h = require("./helpers");

async function test({ check }) {
  const server = await h.startServer();
  try {
    await h.signup(server, "victim", "victimPass123");
    const attacker = await h.signup(server, "attacker", "attackerPass123");
    check("attacker signup succeeded", attacker.status === 200 && !!attacker.token);

    const victimDoc = await h.findUserDoc(server, "victim");
    check("victim _id readable from db (test setup)", !!victimDoc);
    const victimId = String(victimDoc._id);

    // --- the attack ---
    const attack = await h.api(server, "PUT", `/users/${victimId}`, {
      token: attacker.token,
      body: { password: "HACKED123" },
    });
    check(
      "cross-user password write is rejected",
      attack.status === 403 || attack.status === 404,
      `status=${attack.status} body=${attack.text.slice(0, 120)}`
    );

    const hacked = await h.login(server, "victim", "HACKED123");
    check(
      "attacker-chosen password does NOT log in as victim",
      hacked.status === 401,
      `status=${hacked.status}`
    );

    const original = await h.login(server, "victim", "victimPass123");
    check(
      "victim's original password still works",
      original.status === 200,
      `status=${original.status}`
    );

    // --- identifier is equally protected ---
    const idAttack = await h.api(server, "PUT", `/users/${victimId}`, {
      token: attacker.token,
      body: { identifier: { backgroundColor: "#000", shape: "square", fillColor: "#000" } },
    });
    check(
      "cross-user identifier write is rejected",
      idAttack.status === 403 || idAttack.status === 404,
      `status=${idAttack.status}`
    );

    // --- the legitimate self-service path still works ---
    const self = await h.api(server, "PUT", `/users/me`, {
      token: original.token,
      body: { password: "newVictimPass456" },
    });
    check("self password update succeeds", self.status === 200, `status=${self.status}`);
    check(
      "update response leaks neither password hash nor _id",
      !/\$2[aby]\$/.test(self.text) && !/_id/.test(self.text),
      self.text.slice(0, 200)
    );

    const relogin = await h.login(server, "victim", "newVictimPass456");
    check("victim can log in with the new password", relogin.status === 200);
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("IDOR: PUT /users/:id account takeover", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
