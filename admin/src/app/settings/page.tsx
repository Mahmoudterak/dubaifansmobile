import { redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  return <SettingsClient />;
}
