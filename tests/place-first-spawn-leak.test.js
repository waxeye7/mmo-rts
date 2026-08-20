// Regression test: POST /users/placefirstspawn must not broadcast the full
// user document (bcrypt hash + _id) to every connected socket.
const h = require("./helpers");

function findFreeCell(board) {
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const c = board[y][x];
      if (!c.unit && !c.building && !c.resource) return { x, y };
    }
  }
  return null;
}

async function test({ check }) {
  const server = await h.startServer();
  try {
    const attacker = await h.signup(server, "spy", "spyPass123");
    const attackerSocket = h.connectSocket(server, attacker.token);
    const seenByAttacker = [];
    let boardUpdates = 0;
    attackerSocket.on("updateUser", (u) => seenByAttacker.push(u));
    attackerSocket.on("updateBoard", () => boardUpdates++);
    await new Promise((r) => attackerSocket.on("connect", r));
    attackerSocket.emit("loggedIn");
    await h.sleep(300);

    const victim = await h.signup(server, "freshplayer", "victimPass123");
    const victimSocket = h.connectSocket(server, victim.token);
    const seenByVictim = [];
    victimSocket.on("updateUser", (u) => seenByVictim.push(u));
    await new Promise((r) => victimSocket.on("connect", r));
    victimSocket.emit("loggedIn");

    const board = await new Promise((resolve, reject) => {
      victimSocket.on("updateBoard", resolve);
      victimSocket.emit("getInitialValues");
      setTimeout(() => reject(new Error("no board received")), 8000);
    });
    const cell = findFreeCell(board);
    check("found a free cell for the spawn (test setup)", !!cell);

    const res = await h.api(server, "POST", "/users/placefirstspawn", {
      token: victim.token,
      body: { cell },
    });
    check("spawn placement still works", res.status === 200, `status=${res.status} ${res.text}`);
    await h.sleep(800);

    const leaked = JSON.stringify(seenByAttacker);
    check(
      "other players receive no updateUser for the spawning player",
      seenByAttacker.length === 0,
      leaked.slice(0, 200)
    );
    check(
      "no bcrypt hash reaches other players",
      !/\$2[aby]\$/.test(leaked),
      leaked.slice(0, 200)
    );
    check("no _id reaches other players", !/_id/.test(leaked), leaked.slice(0, 200));

    check("board update is still broadcast to everyone", boardUpdates >= 1);

    const mine = JSON.stringify(seenByVictim);
    check(
      "owner still receives their own updateUser",
      seenByVictim.length >= 1,
      mine.slice(0, 120)
    );
    check(
      "owner's own updateUser carries no password hash / _id",
      !/\$2[aby]\$/.test(mine) && !/_id/.test(mine),
      mine.slice(0, 200)
    );
    check(
      "owner's updateUser still carries the game state the client needs",
      seenByVictim.length >= 1 &&
        seenByVictim[0].username === "freshplayer" &&
        Array.isArray(seenByVictim[0].buildings) &&
        seenByVictim[0].buildings.length === 1 &&
        !!seenByVictim[0].resources,
      mine.slice(0, 200)
    );

    attackerSocket.disconnect();
    victimSocket.disconnect();
  } finally {
    await server.stop();
  }
}

if (require.main === module) {
  h.runTest("placeFirstSpawn broadcasts full user document", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
