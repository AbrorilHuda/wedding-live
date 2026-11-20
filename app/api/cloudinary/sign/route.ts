import crypto from "node:crypto";
import { NextResponse } from "next/server";

export async function POST() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || "wedding-live";

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json(
      { configured: false, error: "Cloudinary environment variables not set" },
      { status: 503 }
    );
  }

  const timestamp = Math.round(Date.now() / 1000);
  // Parameters must be sorted alphabetically before appending api_secret
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(`${paramsToSign}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({
    configured: true,
    cloudName,
    apiKey,
    folder,
    timestamp,
    signature,
  });
}
