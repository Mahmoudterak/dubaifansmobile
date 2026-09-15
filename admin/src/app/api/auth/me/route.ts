import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function proxy(request: NextRequest, method: "GET" | "PATCH") {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!BACKEND_URL) {
    return NextResponse.json(
      { message: "BACKEND_URL is not configured" },
      { status: 500 },
    );
  }

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
  };

  let body: string | undefined;

  if (method === "PATCH") {
    headers["Content-Type"] = "application/json";
    body = await request.text();
  }

  const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
    method,
    headers,
    body,
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  return NextResponse.json(data, {
    status: response.status,
    headers: {
      "Cache-Control": "private, no-store, no-cache, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  return proxy(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return proxy(request, "PATCH");
}
