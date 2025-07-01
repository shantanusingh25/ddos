const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

// Create logs directory if not exists
const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

// Log each request
app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ua = req.headers["user-agent"];
  const now = new Date().toISOString();

  fs.appendFileSync(path.join(logDir, "open.log"), `[OPEN] ${now} | ${ip} | ${ua}\n`);

  res.on("close", () => {
    fs.appendFileSync(path.join(logDir, "close.log"), `[CLOSE] ${new Date().toISOString()} | ${ip} | ${ua}\n`);
  });

  next();
});

// Main route
app.get("/", (req, res) => {
  res.send("👋 Hello from the public logging server");
});

// View open log
app.get("/view/open", (req, res) => {
  const file = path.join(logDir, "open.log");
  if (!fs.existsSync(file)) return res.send("open.log does not exist yet.");
  res.type("text/plain").send(fs.readFileSync(file, "utf-8"));
});

// View close log
app.get("/view/close", (req, res) => {
  const file = path.join(logDir, "close.log");
  if (!fs.existsSync(file)) return res.send("close.log does not exist yet.");
  res.type("text/plain").send(fs.readFileSync(file, "utf-8"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
