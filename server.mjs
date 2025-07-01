// server.mjs
import express from "express";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import useragent from "useragent";

const app = express();
const PORT = 5000;

const logDir = path.join(process.cwd(), "logs");
await fs.ensureDir(logDir);

const openLogPath = path.join(logDir, "open.log");
const closeLogPath = path.join(logDir, "close.log");

app.use((req, res, next) => {
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "Unknown IP";
  const userAgent = useragent.parse(req.headers["user-agent"]);
  const now = new Date().toISOString();

  const logEntry = `[OPEN] ${now} | ${ip} | ${req.method} ${req.originalUrl} | ${userAgent.toString()}\n`;

  console.log(
    chalk.green("👀 VISIT"),
    chalk.cyan(`${req.method} ${req.originalUrl}`),
    chalk.gray(`@ ${now}`),
    chalk.yellow(`from ${ip}`)
  );

  fs.appendFileSync(openLogPath, logEntry);

  res.on("close", () => {
    const closeTime = new Date().toISOString();
    const closeEntry = `[CLOSE] ${closeTime} | ${ip} | ${req.method} ${req.originalUrl} | ${userAgent.toString()}\n`;

    console.log(
      chalk.red("❌ CLOSE"),
      chalk.cyan(`${req.method} ${req.originalUrl}`),
      chalk.gray(`@ ${closeTime}`),
      chalk.yellow(`from ${ip}`)
    );

    fs.appendFileSync(closeLogPath, closeEntry);
  });

  next();
});

app.get("/", (req, res) => {
  res.send("<h1>Welcome to the Logging Server</h1>");
});

app.listen(PORT, () => {
  console.log(
    chalk.blueBright("🚀 Server started on"),
    chalk.bold(`http://localhost:${PORT}`)
  );
});
