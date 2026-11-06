// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 Manoj Rollo (MRJonam91)

import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";

test("CLI demo executes and exits code 0", () => {
  const output = execSync("node src/cli/index.ts demo", {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  }).trim();

  assert.ok(output.includes("Running CrowdQA End-to-End Simulation Demo"));
  assert.ok(output.includes("Participating Testers : 2"));
  assert.ok(output.includes("Quality Gate Status   : PASSED"));
});

test("CLI init scaffolds crowdqa.campaign.json", () => {
  const targetFile = "crowdqa.campaign.json";
  if (existsSync(targetFile)) unlinkSync(targetFile);

  const output = execSync("node src/cli/index.ts init my-checkout-flow", {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  }).trim();

  assert.ok(output.includes("Scaffolded new CrowdQA campaign configuration"));
  assert.ok(existsSync(targetFile));
  if (existsSync(targetFile)) unlinkSync(targetFile);
});

test("CLI check inspects campaign file", () => {
  const output = execSync("node src/cli/index.ts check --campaign examples/sample-campaign.json", {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  }).trim();

  assert.ok(output.includes("passed all linting checks") || output.includes("Campaign Lint Results"));
});

test("CLI export converts report into SARIF format", () => {
  const outFile = "test-export.sarif";
  if (existsSync(outFile)) unlinkSync(outFile);

  // Generate fresh report hermetically
  execSync("node src/cli/index.ts report --campaign examples/sample-campaign.json --findings-dir examples/findings --out-dir test-reports", {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  });

  execSync(`node src/cli/index.ts export --report test-reports/audit-report-campaign-ecommerce-checkout.json --format sarif --out ${outFile}`, {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  });

  assert.ok(existsSync(outFile));
  if (existsSync(outFile)) unlinkSync(outFile);
});

test("CLI export converts report into JUnit XML format", () => {
  const outFile = "test-export.junit.xml";
  if (existsSync(outFile)) unlinkSync(outFile);

  execSync(`node src/cli/index.ts export --report test-reports/audit-report-campaign-ecommerce-checkout.json --format junit --out ${outFile}`, {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  });

  assert.ok(existsSync(outFile));
  if (existsSync(outFile)) unlinkSync(outFile);
});

test("CLI submit --dir processes batch findings", () => {
  const output = execSync("node src/cli/index.ts submit --dir examples/findings", {
    encoding: "utf8",
    env: { ...process.env, NO_SPONSOR: "1" },
  }).trim();

  assert.ok(output.includes("Batch ingested and sanitized"));
});

