// Minimal test helpers for the security regression tests.
// No test framework: every test file is runnable with plain `node`.
//
// Requires a local MongoDB. Point MONGO_TEST_URI at it, e.g.
//   docker run -d -p 27018:27017 mongo:7
//   MONGO_TEST_URI=mongodb://127.0.0.1:27018 node tests/run-all.js

const { spawn } = require("child_process");
const path = require("path");
const net = require("net");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const MONGO_BASE = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27018";
const AUTH_SECRET_KEY = "test-secret-key-for-regression-tests";
const SALT = "10";

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function dbName() {
  return "mmo_rts_test_" + crypto.randomBytes(6).toString("hex");
}

async function startServer(extraEnv = {}) {
  const port = await freePort();
  const db = dbName();
  const env = {
    ...process.env,
    NODE_ENV: "test",
    PORT: String(port),
    HOST: "127.0.0.1",
    MONGODB_URI: `${MONGO_BASE}/${db}`,
    AUTH_SECRET_KEY,
    SALT,
    CLIENT_ORIGIN: "http://localhost:8080",
    ...extraEnv,
  };
  delete env.TLS_CERT_DIR;

  const proc = spawn(process.execPath, [path.join(ROOT, "server", "index.js")], {
    env,
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";
  proc.stdout.on("data", (d) => (output += d.toString()));
  proc.stderr.on("data", (d) => (output += d.toString()));

  let exited = false;
  proc.on("exit", () => (exited = true));

  const url = `http://127.0.0.1:${port}`;

  await new Promise((resolve, reject) => {
    const started = Date.now();
    const tick = setInterval(() => {
      if (/Database connected/.test(output) && /Server listening/.test(output)) {
        clearInterval(tick);
        // give createBoard() a moment to finish on a fresh database
        setTimeout(resolve, 400);
      } else if (exited) {
        clearInterval(tick);
        reject(new Error("server exited during startup:\n" + output));
      } else if (Date.now() - started > 30000) {
        clearInterval(tick);
        reject(new Error("server did not start in time:\n" + output));
      }
    }, 100);
  });

  return {
    url,
    port,
    proc,
    dbUri: env.MONGODB_URI,
    secret: AUTH_SECRET_KEY,
    get output() {
      return output;
    },
    alive() {
      return !exited && proc.exitCode === null;
    },
    async stop() {
      if (exited) return;
      proc.kill();
      await new Promise((r) => proc.once("exit", r));
    },
  };
}

function cookieFrom(res) {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : [res.headers.get("set-cookie")].filter(Boolean);
  for (const c of raw) {
    const m = /^token=([^;]*)/.exec(c);
    if (m) return m[1];
  }
  return null;
}

async function signup(server, username, password) {
  const res = await fetch(server.url + "/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      password,
      identifier: {
        backgroundColor: "#112233",
        shape: "circle",
        fillColor: "#445566",
      },
    }),
  });
  return { status: res.status, token: cookieFrom(res), body: await res.text() };
}

async function login(server, username, password) {
  const res = await fetch(server.url + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return { status: res.status, token: cookieFrom(res), body: await res.text() };
}

async function api(server, method, pathname, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Cookie = "token=" + token;
  const res = await fetch(server.url + pathname, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (_) {
    /* not json */
  }
  return { status: res.status, text, json, cookie: cookieFrom(res) };
}

// Reads a user document straight out of Mongo (tests need the _id, which the
// API deliberately no longer discloses).
async function findUserDoc(server, username) {
  const { MongoClient } = require("mongodb");
  const client = new MongoClient(server.dbUri);
  try {
    await client.connect();
    return await client.db().collection("users").findOne({ username });
  } finally {
    await client.close();
  }
}

function connectSocket(server, token) {
  const ioClient = require("socket.io-client");
  return ioClient(server.url, {
    transports: ["websocket"],
    forceNew: true,
    reconnection: false,
    extraHeaders: token === undefined ? {} : { Cookie: "token=" + token },
  });
}

function waitConnect(socket, ms = 8000) {
  return new Promise((resolve, reject) => {
    if (socket.connected) return resolve();
    const t = setTimeout(() => reject(new Error("socket connect timeout")), ms);
    socket.on("connect", () => {
      clearTimeout(t);
      resolve();
    });
    socket.on("connect_error", (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- tiny assertion / runner plumbing -------------------------------------

const results = [];

function check(name, condition, detail = "") {
  results.push({ name, ok: !!condition, detail });
  console.log(`${condition ? "  PASS" : "  FAIL"}  ${name}${detail ? " :: " + detail : ""}`);
  return !!condition;
}

function summary(title) {
  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${title}: ${results.length - failed.length}/${results.length} checks passed`
  );
  return failed.length === 0;
}

async function runTest(title, fn) {
  console.log(`\n=== ${title} ===`);
  results.length = 0;
  let server;
  try {
    await fn({ check });
  } catch (err) {
    check("test threw", false, err && err.stack ? err.stack.split("\n")[0] : String(err));
    console.error(err);
  } finally {
    if (server) await server.stop();
  }
  return summary(title);
}

module.exports = {
  startServer,
  signup,
  login,
  api,
  findUserDoc,
  connectSocket,
  waitConnect,
  cookieFrom,
  sleep,
  check,
  summary,
  runTest,
  AUTH_SECRET_KEY,
  ROOT,
};
