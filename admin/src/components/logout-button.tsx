"use client";

import { useState } from "react";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);

    try {
      await fetch("/api/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="logout-button"
    >
      <span>↪</span>
      {loading ? "جاري الخروج..." : "تسجيل الخروج"}
    </button>
  );
}
