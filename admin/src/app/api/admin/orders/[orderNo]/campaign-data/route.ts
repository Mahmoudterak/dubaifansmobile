import { NextResponse } from "next/server";
import { getAdminToken } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL;

type RouteContext = {
  params: Promise<{
    orderNo: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const token = await getAdminToken();

    if (!token) {
      return NextResponse.json(
        { message: "غير مصرح" },
        { status: 401 },
      );
    }

    if (!BACKEND_URL) {
      return NextResponse.json(
        { message: "BACKEND_URL غير مضبوط" },
        { status: 500 },
      );
    }

    const { orderNo } = await context.params;
    const body = await request.json();


    const response = await fetch(
      `${BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNo)}/campaign-data`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { message: "تعذر الاتصال بخادم API" },
      { status: 500 },
    );
  }
}
