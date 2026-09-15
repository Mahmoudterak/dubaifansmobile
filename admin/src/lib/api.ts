const BACKEND_URL = process.env.BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error("BACKEND_URL is not configured");
}

export async function getAdminOrdersStats(token: string) {
  const response = await fetch(`${BACKEND_URL}/api/admin/orders/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin statistics: ${response.status}`);
  }

  return response.json();
}

export async function getAdminOrders(token: string) {
  const response = await fetch(`${BACKEND_URL}/api/admin/orders`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch admin orders: ${response.status}`);
  }

  return response.json();
}
