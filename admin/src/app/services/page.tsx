import { redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import ServicesClient from "./services-client";

const BACKEND_URL = process.env.BACKEND_URL || "http://backend:3000";

export default async function ServicesPage() {
  const token = await getAdminToken();

  if (!token) redirect("/login");

  const response = await fetch(
    `${BACKEND_URL}/api/admin/services?includeInactive=true`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    },
  );

  if (response.status === 401 || response.status === 403) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new Error("Failed to load services");
  }

  const services = await response.json();

  return <ServicesClient initialServices={services} />;
}
