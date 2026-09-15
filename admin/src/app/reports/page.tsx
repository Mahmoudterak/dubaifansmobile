import { redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import ReportsClient from "./reports-client";

const BACKEND_URL = process.env.BACKEND_URL;

export default async function ReportsPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not configured");
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

  if (!response.ok) {
    throw new Error("Failed to load reports");
  }

  const data = await response.json();

  return <ReportsClient data={data} />;
}
