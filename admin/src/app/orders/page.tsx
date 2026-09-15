import { redirect } from "next/navigation";
import OrdersClient from "./orders-client";
import { getAdminOrders, getAdminOrdersStats } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";

export default async function OrdersPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  const [orders, stats] = await Promise.all([
    getAdminOrders(token),
    getAdminOrdersStats(token),
  ]);

  return <OrdersClient initialOrders={orders} stats={stats} />;
}
