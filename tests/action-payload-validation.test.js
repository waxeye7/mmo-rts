// Regression test: a crafted action payload (out-of-range / non-numeric
// coordinates) must be rejected at ingress and must not be able to crash the
// hourly turn processor.
const path = require("path");
const h = require("./helpers");

const BAD_ACTIONS = [
  { id: "b1", type: "tower shoot", payload: { x: 0, y: 99999, targetX: 0, targetY: 0 } },
  { id: "b2", type: "move axeman", payload: { x: -1, y: 0, targetX: 0, targetY: 0 } },
  { id: "b3", type: "build tower", payload: { x: 99999, y: 0, structureType: "structureTower" } },
  { id: "b4", type: "spawn archer", payload: { x: 0, y: 0, targetX: 1, targetY: 1e9 } },
  { id: "b5", type: "worker mine", payload: { x: "0", y: "0", targetX: 0, targetY: 0 } },
  { id: "b6", type: "archer shoot", payload: { x: 0, y: 0, targetX: NaN, targetY: 0 } },
  { id: "b7", type: "move worker", payload: { x: 0.5, y: 0, targetX: 0, targetY: 0 } },
];

async function partA({ check }) {
  const { validateAction, getCell } = require("../server/utils/actionValidation");
  for (const bad of BAD_ACTIONS) {
    const res = validateAction({ ...bad, payload: { ...bad.payload, username: "u" } });
    check(`validator rejects "${bad.type}" with bad coords (${bad.id})`, res.ok === false, res.reason);
  }
  check(
    "validator rejects unknown action types",
    validateAction({ id: "x", type: "nuke everything", payload: { x: 0, y: 0, username: "u" } }).ok === false
  );
  check(
    "validator rejects a non-object action",
    validateAction("not an action").ok === false && validateAction(null).ok === false
  );
  const good = validateAction({
    id: "ok-1",
    type: "tower shoot",
    payload: { x: 1, y: 2, targetX: 3, targetY: 4, username: "u" },
  });
  check("validator accepts a well formed action", good.ok === true, good.reason || "");
  check(
    "validator strips unknown fields from the stored action",
    good.ok &&
      Object.keys(good.action).sort().join(",") === "id,payload,type" &&
      good.action.payload.junk === undefined,
    JSON.stringify(good.action || {})
  );
  check(
    "getCell() refuses out of range coordinates instead of throwing",
    getCell([[{ x: 0, y: 0 }]], 0, 5) === null && getCell([[{ x: 0, y: 0 }]], 0, 0) !== null
  );
}

async function partB({ check }) {
  const server = await h.startServer();
  try {
    const user = await h.signup(server, "crafter", "crafterPass123");
    const socket = h.connectSocket(server, user.token);
    await new Promise((r) => socket.on("connect", r));
    socket.emit("loggedIn");
    await h.sleep(300);

    for (const bad of BAD_ACTIONS) {
      socket.emit("action", {
        ...bad,
        payload: { ...bad.payload, username: "crafter" },
      });
    }
    await h.sleep(1000);

    check("server survives crafted actions", server.alive());
    const me = await h.api(server, "GET", "/users/me", { token: user.token });
    check("crafted actions are not queued on the user", me.json && me.json.actions.length === 0, me.text.slice(0, 200));

    // legitimate action still accepted
    const gotUpdate = new Promise((resolve) => {
      socket.on("updateUser", () => resolve(true));
      setTimeout(() => resolve(false), 4000);
    });
    socket.emit("action", {
      id: "good-1",
      type: "build tower",
      payload: { x: 2, y: 2, username: "crafter", structureType: "structureTower" },
    });
    check("well formed action is still accepted", await gotUpdate);
    socket.disconnect();
  } finally {
    await server.stop();
  }
}

// Drives the real turn processor in-process with a poisoned queue: this is the
// code path the hourly cron runs.
async function partC({ check }) {
  const net = require("net");
  const port = await new Promise((resolve) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
  process.env.PORT = String(port);
  process.env.HOST = "127.0.0.1";
  process.env.AUTH_SECRET_KEY = h.AUTH_SECRET_KEY;
  process.env.SALT = "10";
  process.env.MONGODB_URI =
    (process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27018") +
    "/mmo_rts_test_turn_" + Date.now();

  const app = require(path.join(h.ROOT, "server", "index.js"));
  check("server/index.js exposes processActions for tests", typeof app.processActions === "function");
  if (typeof app.processActions !== "function") return;

  const started = Date.now();
  while (!app.getBoard() && Date.now() - started < 30000) await h.sleep(200);
  check("board loaded", Array.isArray(app.getBoard()));

  const User = require(path.join(h.ROOT, "server", "models", "user"));
  const user = new User({
    username: "turncrasher",
    password: "x",
    actions: [],
    resources: { gold: 100000, wood: 0, stone: 0, food: 0 },
    units: [],
    buildings: [],
    identifier: { backgroundColor: "#000", shape: "circle", fillColor: "#fff" },
  });
  await user.save();

  const queues = require(path.join(h.ROOT, "server", "actionsQueue"));
  const userId = String(user._id);
  const poison = (payload, type) => ({
    action: { id: "poison", type, payload: { ...payload, username: "turncrasher" } },
    userId,
  });
  queues.conflictActionsQueue.push(
    poison({ x: 0, y: 99999, targetX: 0, targetY: 0 }, "tower shoot"),
    poison({ x: 0, y: 0, targetX: 0, targetY: -5 }, "axeman attack"),
    poison({ x: 0, y: 0, targetX: 0, targetY: 0 }, "worker attack"),
    poison({ x: "a", y: "b", targetX: 0, targetY: 0 }, "archer shoot")
  );
  queues.buildActionsQueue.push(
    poison({ x: 99999, y: 0, structureType: "structureTower" }, "build tower")
  );
  queues.spawningActionsQueue.push(
    poison({ x: 0, y: 0, targetX: 1e9, targetY: 0 }, "spawn worker"),
    poison({ x: 0, y: -1, targetX: 0, targetY: 0 }, "spawn axeman"),
    poison({ x: 0, y: 0, targetX: null, targetY: 0 }, "spawn archer")
  );
  queues.resourceGatheringActionsQueue.push(
    poison({ x: 0, y: 0, targetX: 12345, targetY: 0 }, "worker mine")
  );
  queues.moveActionsQueue.push(
    poison({ x: 0, y: 0, targetX: 0, targetY: 99999 }, "move worker"),
    poison({ x: -1, y: -1, targetX: 0, targetY: 0 }, "move axeman"),
    poison({ x: 0, y: 0, targetX: undefined, targetY: 0 }, "move archer")
  );

  let threw = null;
  try {
    await app.processActions();
  } catch (err) {
    threw = err;
  }
  check(
    "turn processor survives poisoned queue entries",
    threw === null,
    threw ? String(threw.message || threw) : ""
  );
}

async function test(ctx) {
  for (const [name, part] of [
    ["validator unit tests", partA],
    ["socket ingress validation", partB],
    ["turn processor resilience", partC],
  ]) {
    try {
      await part(ctx);
    } catch (err) {
      ctx.check(`${name} threw`, false, String((err && err.message) || err));
    }
  }
}

if (require.main === module) {
  h.runTest("Action payload validation / turn processor crash", test).then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}
module.exports = test;
