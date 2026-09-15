import { redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import CustomersClient from "./customers-client";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

export default async function CustomersPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  const [customersResponse, statsResponse] = await Promise.all([
    fetch(`${BACKEND_URL}/api/admin/customers`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }),
    fetch(`${BACKEND_URL}/api/admin/customers/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }),
  ]);

  if (
    customersResponse.status === 401 ||
    customersResponse.status === 403 ||
    statsResponse.status === 401 ||
    statsResponse.status === 403
  ) {
    redirect("/login");
  }

  if (!customersResponse.ok || !statsResponse.ok) {
    throw new Error("Failed to load customers");
  }

  const [customers, stats] = await Promise.all([
    customersResponse.json(),
    statsResponse.json(),
  ]);

  return (
    <CustomersClient
      initialCustomers={customers}
      stats={stats}
    />
  );
}
