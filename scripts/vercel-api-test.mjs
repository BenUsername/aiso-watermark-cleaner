import { mkdirSync, writeFileSync } from "node:fs";

const token = process.env.VERCEL_OIDC_TOKEN || "";
const projectId = process.env.VERCEL_PROJECT_ID || "";
const teamId = process.env.VERCEL_ORG_ID || "";
let status = "not-run";
let body = "";

try {
  const url = `https://api.vercel.com/v9/projects/${encodeURIComponent(projectId)}${teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  status = String(response.status);
  body = (await response.text()).slice(0, 1800).replace(/\"token\"\s*:\s*\"[^\"]+\"/gi, '"token":"[redacted]"');
} catch (error) {
  status = "error";
  body = String(error);
}

mkdirSync("public", { recursive: true });
writeFileSync("public/vercel-api-test.txt", [
  `token_present=${Boolean(token)}`,
  `token_length=${token.length}`,
  `project_id=${projectId}`,
  `team_id=${teamId}`,
  `status=${status}`,
  `body=${body}`,
].join("\n"));
