import { NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

export async function GET() {
  const token = await getAdminToken();

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(
    `${BACKEND_URL}/api/admin/customers/stats`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
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
