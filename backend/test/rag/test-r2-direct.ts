import "dotenv/config";
import { readFileSync } from "node:fs";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

async function main() {
  const s3 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const bucket = process.env.R2_BUCKET!;
  const key = "tests/direct-test.pdf";

  console.log("local UTC now :", new Date().toISOString());

  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: "application/pdf",
    }),
    { expiresIn: 600 }
  );

  const parsed = new URL(url);
  console.log("X-Amz-Date    :", parsed.searchParams.get("X-Amz-Date"));
  console.log("X-Amz-Expires :", parsed.searchParams.get("X-Amz-Expires"));

  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: new Uint8Array(readFileSync("test/rag/arabic.pdf")),
  });

  console.log("status        :", res.status);
  console.log("R2 Date header:", res.headers.get("date"));
  if (res.status !== 200) console.log(await res.text());

  if (res.status === 200) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    console.log("test file deleted");
  }
}

main().catch(console.error);