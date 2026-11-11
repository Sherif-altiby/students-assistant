import { readFileSync } from "node:fs";

async function main() {
  const url = readFileSync("test/rag/url.txt", "utf8").trim();

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: new Uint8Array(readFileSync("test/rag/arabic.pdf")),
  });

  console.log("status:", res.status);
  if (res.status !== 200) console.log(await res.text());
}

main().catch(console.error);