import { NextRequest, NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

type Context = {
  params: Promise<{ path: string[] }>;
};

async function handle(request: NextRequest, context: Context) {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { path } = await context.params;
  const backendPath = path.map(encodeURIComponent).join("/");
  const body =
    request.method === "GET" || request.method === "DELETE"
      ? undefined
      : await request.text();

  const response = await fetch(
    `${BACKEND_URL}/api/admin/services/${backendPath}`,
    {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
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

export async function GET(request: NextRequest, context: Context) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: Context) {
  return handle(request, context);
}

export async function PATCH(request: NextRequest, context: Context) {
  return handle(request, context);
}
