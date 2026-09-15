import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          message: data.message || "فشل تسجيل الدخول",
        },
        {
          status: response.status,
        },
      );
    }

    const token = data.accessToken;

    if (!token) {
      return NextResponse.json(
        {
          message: "لم يتم استلام رمز الدخول من الخادم",
        },
        {
          status: 502,
        },
      );
    }

    const result = NextResponse.json({
      success: true,
    });

    result.cookies.set("df_admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 15,
    });

    return result;
  } catch {
    return NextResponse.json(
      {
        message: "تعذر الاتصال بخادم API",
      },
      {
        status: 500,
      },
    );
  }
}
