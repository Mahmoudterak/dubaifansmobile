import { NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET() {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "BACKEND_URL is not configured" },
        { status: 500 },
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/admin/reports/overview`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error("Reports API error:", error);

    return NextResponse.json(
      { message: "Failed to load reports" },
      { status: 500 },
    );
  }
}
