import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

async function proxy(request: NextRequest, method: string) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body =
    method === "GET" || method === "DELETE"
      ? undefined
      : await request.text();

  const response = await fetch(`${BACKEND_URL}/api/admin/services`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body,
    cache: "no-store",
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(request: NextRequest) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const includeInactive =
    request.nextUrl.searchParams.get("includeInactive") || "true";

  const response = await fetch(
    `${BACKEND_URL}/api/admin/services?includeInactive=${encodeURIComponent(includeInactive)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") || "application/json",
    },
  });
}

export async function POST(request: NextRequest) {
  return proxy(request, "POST");
}
