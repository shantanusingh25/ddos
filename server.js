const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

app.use((req, res, next) => {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const ua = req.headers["user-agent"];
  const now = new Date().toISOString();

  const openLog = `[OPEN] ${now} | ${ip} | ${ua}\n`;
  fs.appendFileSync(path.join(logDir, "open.log"), openLog);

  res.on("close", () => {
    const closeLog = `[CLOSE] ${new Date().toISOString()} | ${ip} | ${ua}\n`;
    fs.appendFileSync(path.join(logDir, "close.log"), closeLog);
  });

  next();
});

app.get("/", (req, res) => {
  res.send("👋 Hello from Render-hosted logger");
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
