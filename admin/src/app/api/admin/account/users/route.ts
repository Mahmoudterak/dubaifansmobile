import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
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

  const response = await fetch(`${BACKEND_URL}/api/admin/account/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    next: { revalidate: 0 },
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

export async function POST(request: NextRequest) {
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

  const body = await request.json();

  const response = await fetch(`${BACKEND_URL}/api/admin/account/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => null);

  return NextResponse.json(data, { status: response.status });
}
