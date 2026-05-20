import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const title = process.argv.slice(2).join(" ").trim() || "work log";

function getKstTimestamp() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const value = (type) => parts.find((part) => part.type === type)?.value;
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    time: `${value("hour")}:${value("minute")}`,
    compactTime: `${value("hour")}${value("minute")}`,
  };
}

function slugify(input) {
  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "work-log";
}

const timestamp = getKstTimestamp();
const logsDir = path.join(process.cwd(), "work_logs");
const fileName = `${timestamp.date}_${timestamp.compactTime}_${slugify(title)}.md`;
const filePath = path.join(logsDir, fileName);

if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

if (existsSync(filePath)) {
  console.error(`Work log already exists: ${filePath}`);
  process.exit(1);
}

const body = `# ${timestamp.date} ${timestamp.time} KST - ${title}

## Request

- TODO

## Context Docs Consulted

- TODO

## Summary

- TODO

## Changed Files

- TODO

## Verification

- TODO

## Decisions

- TODO

## Follow-Ups

- TODO
`;

writeFileSync(filePath, body, "utf8");
console.log(filePath);
