const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const logDir = path.join(__dirname, "logs");
const usersFile = path.join(__dirname, "users.json");

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]");

let requestCount = 0;
const bigJunk = "🧱".repeat(1000);

// 🔥 Log Helper
function logConsole(type, message) {
  console.log(`[${new Date().toISOString()}] 🔹 ${type}: ${message}`);
}

// 🌐 Global Middleware: Log every request
app.use((req, res, next) => {
  requestCount++;

  // Route-based logging
  logConsole("ROUTE HIT", `${req.method} ${req.originalUrl}`);

  if (requestCount % 10 === 0) {
    logConsole("REQ COUNT", `🔥 Total ${requestCount} requests`);
  }

  // Log to file (open)
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ua = req.headers["user-agent"];
  const now = new Date().toISOString();
  const openLog = `[OPEN] ${now} | ${ip} | ${ua}\n${bigJunk}\n${bigJunk}\n\n`;

  fs.appendFileSync(path.join(logDir, "open.log"), openLog);

  res.on("close", () => {
    const closeLog = `[CLOSE] ${new Date().toISOString()} | ${ip} | ${ua}\n${bigJunk}\n${bigJunk}\n\n`;
    fs.appendFileSync(path.join(logDir, "close.log"), closeLog);
  });

  next();
});

// 🚀 Home Route
app.get("/", (req, res) => {
  res.send("👋 Hello! Server is alive with enhanced logging.");
});

// 🔐 Signup
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    logConsole("SIGNUP ❌", `Missing username/password from ${req.ip}`);
    return res.status(400).send("Missing username or password");
  }

  const users = JSON.parse(fs.readFileSync(usersFile));
  users.push({ username, password, createdAt: new Date().toISOString() });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const log = `[SIGNUP] ${username} | ${password} | ${new Date().toISOString()}\n`;
  fs.appendFileSync(path.join(logDir, "signup.log"), log);

  logConsole("SIGNUP ✅", `New account: ${username} | ${password}`);

  res.send("✅ Fake signup success");
});

// 🔑 Login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    logConsole("LOGIN ❌", "Missing login fields");
    return res.status(400).send("Missing fields");
  }

  const users = JSON.parse(fs.readFileSync(usersFile));
  const user = users.find(u => u.username === username && u.password === password);

  const status = user ? "✅ SUCCESS" : "❌ FAIL";
  const now = new Date().toISOString();
  const log = `[LOGIN] ${username} | ${password} | ${now} | ${status}\n`;
  fs.appendFileSync(path.join(logDir, "login.log"), log);

  logConsole("LOGIN", `${username} | ${password} → ${status}`);

  if (!user) return res.status(401).send("❌ Invalid credentials");

  res.send("✅ Fake login success");
});

// 👥 Get all users
app.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile));
  logConsole("USERS", `Fetched ${users.length} users`);
  res.json(users);
});

// 📄 View Logs
app.get("/view/:type", (req, res) => {
  const file = path.join(logDir, `${req.params.type}.log`);
  if (!fs.existsSync(file)) return res.send(`${req.params.type}.log not found.`);
  res.type("text/plain").send(fs.readFileSync(file, "utf8"));
});

// 📈 Stats
app.get("/stats", (req, res) => {
  logConsole("STATS", `Request count returned: ${requestCount}`);
  res.send(`📈 Total requests: ${requestCount}`);
});

app.listen(PORT, () => {
  logConsole("SERVER", `🚀 Running on http://localhost:${PORT}`);
});
