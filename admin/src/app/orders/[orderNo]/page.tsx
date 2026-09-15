import { notFound, redirect } from "next/navigation";
import { getAdminToken } from "@/lib/auth";
import { getAdminOrders } from "@/lib/api";
import OrderDetailsClient from "./order-details-client";

type Order = {
  id: string;
  orderNo: string;
  status: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  vat: string | number;
  total: string | number;
  customerNote: string | null;
  formData: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    phone: string | null;
    role: string;
  };
  service: {
    id: string;
    name: string;
    description?: string | null;
  };
  package: {
    id: string;
    name: string;
    price?: string | number;
  } | null;
};

type HistoryItem = {
  id: string;
  status: string;
  note: string | null;
  changedBy: string | null;
  createdAt: string;
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_PAYMENT: "بانتظار الدفع",
  PAID: "تم الدفع",
  UNDER_REVIEW: "قيد المراجعة",
  IN_PROGRESS: "قيد التنفيذ",
  WAITING_FOR_CUSTOMER: "بانتظار العميل",
  REVISION: "تعديل مطلوب",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

async function getOrder(orderNo: string, token: string): Promise<Order | null> {
  const response = await fetch(
    `${process.env.BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNo)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch order: ${response.status}`);
  }

  return response.json();
}

async function getHistory(
  orderNo: string,
  token: string,
): Promise<HistoryItem[]> {
  const response = await fetch(
    `${process.env.BACKEND_URL}/api/admin/orders/${encodeURIComponent(orderNo)}/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch order history: ${response.status}`);
  }

  return response.json();
}

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderNo: string }>;
}) {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  const { orderNo } = await params;

  const [order, history] = await Promise.all([
    getOrder(orderNo, token),
    getHistory(orderNo, token),
  ]);

  if (!order) {
    notFound();
  }

  return (
    <main className="order-details-page">
      <div className="order-details-header">
        <div>
          <a href="/" className="back-link">
            ← العودة إلى لوحة التحكم
          </a>

          <div className="order-title-row">
            <div>
              <div className="breadcrumb">Dubai Fans / الطلبات / التفاصيل</div>
              <h1>{order.orderNo}</h1>
              <p>تفاصيل الطلب وسجل التنفيذ</p>
            </div>

            <span className={`status ${order.status.toLowerCase()}`}>
              <i />
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>
      </div>

      <OrderDetailsClient
        order={order}
        history={history}
        statusLabels={statusLabels}
      />
    </main>
  );
}
