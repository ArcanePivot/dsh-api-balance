#!/usr/bin/env node

import { createHash } from "node:crypto";
import { readFileSync, renameSync, writeFileSync } from "node:fs";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function readManifest(path) {
  let value;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`cannot read backup manifest ${path}: ${error.message}`);
  }
  if (value.schemaVersion !== 1 || !Array.isArray(value.files)) {
    fail(`unsupported or malformed backup manifest: ${path}`);
  }
  return value;
}

function writeManifest(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o644,
  });
  renameSync(temporary, path);
}

function requireGroups(values, size, label) {
  if (values.length === 0 || values.length % size !== 0) {
    fail(`${label} requires argument groups of ${size}`);
  }
}

function recordFor(manifest, relativePath) {
  const records = manifest.files.filter((record) => record.path === relativePath);
  if (records.length !== 1) {
    fail(`backup manifest must contain exactly one record for ${relativePath}`);
  }
  return records[0];
}

const [command, ...args] = process.argv.slice(2);

if (command === "create") {
  const [manifestPath, patchVersion, dshVersion, platform, ...files] = args;
  if (!manifestPath || !patchVersion || !dshVersion || !platform) {
    fail("create requires manifest path, patch version, DSH version, and platform");
  }
  requireGroups(files, 3, "create");
  const records = [];
  for (let index = 0; index < files.length; index += 3) {
    const [relativePath, backupPath, sourcePath] = files.slice(index, index + 3);
    records.push({
      path: relativePath,
      originalSha256: sha256(backupPath),
      patchedSha256: sha256(sourcePath),
    });
  }
  writeManifest(manifestPath, {
    schemaVersion: 1,
    patchVersion,
    dshVersion,
    platform,
    createdAtUtc: new Date().toISOString(),
    lastInstalledAtUtc: null,
    lastUninstalledAtUtc: null,
    files: records,
  });
  process.exit(0);
}

if (command === "validate") {
  const [manifestPath, dshVersion, platform, ...files] = args;
  if (!manifestPath || !dshVersion || !platform) {
    fail("validate requires manifest path, DSH version, and platform");
  }
  requireGroups(files, 2, "validate");
  const manifest = readManifest(manifestPath);
  if (manifest.dshVersion !== dshVersion) {
    fail(`backup belongs to DSH ${manifest.dshVersion}, not ${dshVersion}`);
  }
  if (manifest.platform !== platform) {
    fail(`backup belongs to ${manifest.platform || "an unknown platform"}, not ${platform}`);
  }
  for (let index = 0; index < files.length; index += 2) {
    const [relativePath, backupPath] = files.slice(index, index + 2);
    const record = recordFor(manifest, relativePath);
    if (sha256(backupPath) !== record.originalSha256) {
      fail(`backup checksum mismatch: ${relativePath}`);
    }
  }
  process.exit(0);
}

if (command === "classify") {
  const [manifestPath, relativePath, targetPath] = args;
  if (!manifestPath || !relativePath || !targetPath) {
    fail("classify requires manifest path, relative path, and target path");
  }
  const manifest = readManifest(manifestPath);
  const record = recordFor(manifest, relativePath);
  const actual = sha256(targetPath);
  if (actual === record.originalSha256) console.log("original");
  else if (actual === record.patchedSha256) console.log("patched");
  else console.log("unknown");
  process.exit(0);
}

if (command === "mark-installed") {
  const [manifestPath, patchVersion, ...files] = args;
  if (!manifestPath || !patchVersion) {
    fail("mark-installed requires manifest path and patch version");
  }
  requireGroups(files, 2, "mark-installed");
  const manifest = readManifest(manifestPath);
  manifest.patchVersion = patchVersion;
  manifest.lastInstalledAtUtc = new Date().toISOString();
  for (let index = 0; index < files.length; index += 2) {
    const [relativePath, sourcePath] = files.slice(index, index + 2);
    recordFor(manifest, relativePath).patchedSha256 = sha256(sourcePath);
  }
  writeManifest(manifestPath, manifest);
  process.exit(0);
}

if (command === "mark-uninstalled") {
  const [manifestPath] = args;
  if (!manifestPath) fail("mark-uninstalled requires a manifest path");
  const manifest = readManifest(manifestPath);
  manifest.lastUninstalledAtUtc = new Date().toISOString();
  writeManifest(manifestPath, manifest);
  process.exit(0);
}

fail(`unknown manifest command: ${command || "(missing)"}`);
