const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json()); // To parse JSON bodies

const PORT = process.env.PORT ||5000;

// === Directories ===
const logDir = path.join(__dirname, "logs");
const usersFile = path.join(__dirname, "users.json");

if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, "[]");

// === Junk for Load ===
let requestCount = 0;
const bigJunk = "🧱".repeat(1000);

// === Logging Middleware ===
app.use((req, res, next) => {
  requestCount++;
  if (requestCount % 100 === 0) {
    console.log(`🔥 ${requestCount} requests so far`);
  }

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ua = req.headers["user-agent"];
  const now = new Date().toISOString();
  const openLine = `[OPEN] ${now} | ${ip} | ${ua}\n${bigJunk}\n${bigJunk}\n\n`;

  fs.appendFileSync(path.join(logDir, "open.log"), openLine);

  res.on("close", () => {
    const closeLine = `[CLOSE] ${new Date().toISOString()} | ${ip} | ${ua}\n${bigJunk}\n${bigJunk}\n\n`;
    fs.appendFileSync(path.join(logDir, "close.log"), closeLine);
  });

  next();
});

// === Routes ===
app.get("/", (req, res) => {
  res.send("👋 Server is running with fake login/signup and stress logging!");
});

// === Signup ===
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  const users = JSON.parse(fs.readFileSync(usersFile));
  users.push({ username, password, createdAt: new Date().toISOString() });
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));

  const log = `[SIGNUP] ${username} | ${password} | ${new Date().toISOString()}\n`;
  fs.appendFileSync(path.join(logDir, "signup.log"), log);

  console.log(`[SIGNUP] ${username} | ${password}`);  // 👈 this shows in terminal

  res.send("✅ Signup successful (fake)");
});


// === Login ===
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).send("Missing fields");

  const users = JSON.parse(fs.readFileSync(usersFile));
  const exists = users.find(u => u.username === username && u.password === password);

  const now = new Date().toISOString();
  const log = `[LOGIN] ${username} | ${password} | ${now} | ${exists ? "✅ SUCCESS" : "❌ FAIL"}\n`;
  fs.appendFileSync(path.join(logDir, "login.log"), log);

  console.log(`[LOGIN] ${username} | ${password} | ${exists ? "✅" : "❌"}`);  // 👈 this too

  if (!exists) return res.status(401).send("❌ Invalid credentials (fake)");
  res.send("✅ Login successful (fake)");
});


// === View Users ===
app.get("/users", (req, res) => {
  const users = JSON.parse(fs.readFileSync(usersFile));
  res.json(users);
});

// === Log Viewers ===
app.get("/view/:type", (req, res) => {
  const file = path.join(logDir, `${req.params.type}.log`);
  if (!fs.existsSync(file)) return res.send(`${req.params.type}.log not found.`);
  res.type("text/plain").send(fs.readFileSync(file, "utf8"));
});

// === Stats ===
app.get("/stats", (req, res) => {
  res.send(`📈 Total requests: ${requestCount}`);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
