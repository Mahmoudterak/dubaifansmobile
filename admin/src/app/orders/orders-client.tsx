"use client";

import { useMemo, useState } from "react";

type Order = {
  id: string;
  orderNo: string;
  status: string;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  vat: string | number;
  total: string | number;
  createdAt: string;
  user: {
    name: string | null;
    email: string;
    phone: string | null;
  };
  service: {
    name: string;
  };
  package: {
    name: string;
  } | null;
};

type Stats = {
  total: number;
  pendingPayment: number;
  paid: number;
  underReview: number;
  inProgress: number;
  waitingForCustomer: number;
  revision: number;
  completed: number;
  cancelled: number;
  refunded: number;
  revenue: string | number;
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

const statusClasses: Record<string, string> = {
  DRAFT: "status draft",
  PENDING_PAYMENT: "status pending",
  PAID: "status paid",
  UNDER_REVIEW: "status review",
  IN_PROGRESS: "status progress",
  WAITING_FOR_CUSTOMER: "status waiting",
  REVISION: "status revision",
  COMPLETED: "status completed",
  CANCELLED: "status cancelled",
  REFUNDED: "status refunded",
};

function formatAED(value: string | number) {
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} AED`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-AE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function OrdersClient({
  initialOrders,
  stats,
}: {
  initialOrders: Order[];
  stats: Stats;
}) {
  const [orders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus =
        status === "ALL" || order.status === status;

      if (!matchesStatus) return false;
      if (!query) return true;

      return [
        order.orderNo,
        order.user.name,
        order.user.email,
        order.user.phone,
        order.service.name,
        order.package?.name,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        );
    });
  }, [orders, search, status]);

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">DF</div>
          <div>
            <strong>Dubai Fans</strong>
            <span>Administration</span>
          </div>
        </div>

        <nav className="nav">
          <a className="nav-item" href="/">
            <span>▦</span>
            الرئيسية
          </a>

          <a className="nav-item active" href="/orders">
            <span>▤</span>
            الطلبات
          </a>

          <a className="nav-item" href="/services">
            <span>◈</span>
            الخدمات
          </a>

          <a className="nav-item" href="/customers">
            <span>♙</span>
            العملاء
          </a>

          <a className="nav-item" href="/reports">
            <span>◒</span>
            التقارير
          </a>

          <a className="nav-item" href="/settings">
            <span>⚙</span>
            الإعدادات
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>مدير النظام</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="header">
          <div>
            <div className="breadcrumb">Dubai Fans / الإدارة / الطلبات</div>
            <h1>الطلبات</h1>
            <p>متابعة وإدارة جميع طلبات العملاء.</p>
          </div>

          <div className="header-actions">
            <div className="header-date">
              <span>الحالة</span>
              <strong>بيانات مباشرة</strong>
            </div>
            <div className="notification">🔔</div>
          </div>
        </header>

        <section className="stats-grid">
          <Stat title="إجمالي الطلبات" value={stats.total} icon="▤" />
          <Stat title="قيد التنفيذ" value={stats.inProgress} icon="↻" />
          <Stat title="قيد المراجعة" value={stats.underReview} icon="◉" />
          <Stat
            title="بانتظار العميل"
            value={stats.waitingForCustomer}
            icon="◌"
          />
          <Stat title="مكتملة" value={stats.completed} icon="✓" />
          <Stat
            title="الإيرادات"
            value={formatAED(stats.revenue)}
            icon="د.إ"
          />
        </section>

        <section className="panel orders-page-panel">
          <div className="orders-toolbar">
            <div>
              <h2>كل الطلبات</h2>
              <p>
                {filteredOrders.length} طلب
                {filteredOrders.length !== orders.length
                  ? ` من أصل ${orders.length}`
                  : ""}
              </p>
            </div>

            <div className="orders-filters">
              <div className="orders-search">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="بحث برقم الطلب أو العميل أو الخدمة..."
                />
              </div>

              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">كل الحالات</option>
                <option value="DRAFT">مسودة</option>
                <option value="PENDING_PAYMENT">بانتظار الدفع</option>
                <option value="PAID">تم الدفع</option>
                <option value="UNDER_REVIEW">قيد المراجعة</option>
                <option value="IN_PROGRESS">قيد التنفيذ</option>
                <option value="WAITING_FOR_CUSTOMER">
                  بانتظار العميل
                </option>
                <option value="REVISION">تعديل مطلوب</option>
                <option value="COMPLETED">مكتمل</option>
                <option value="CANCELLED">ملغي</option>
                <option value="REFUNDED">مسترد</option>
              </select>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الخدمة</th>
                  <th>الباقة</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="empty-state">
                      لا توجد طلبات مطابقة للبحث أو الفلتر.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="clickable-order"
                      onClick={() =>
                        (window.location.href = `/orders/${encodeURIComponent(
                          order.orderNo,
                        )}`)
                      }
                    >
                      <td>
                        <strong className="order-number">
                          {order.orderNo}
                        </strong>
                      </td>

                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {(order.user.name || order.user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>
                              {order.user.name || "بدون اسم"}
                            </strong>
                            <span>{order.user.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>{order.service.name}</td>

                      <td>{order.package?.name || "—"}</td>

                      <td>
                        <strong>{formatAED(order.total)}</strong>
                      </td>

                      <td>
                        <span
                          className={
                            statusClasses[order.status] || "status"
                          }
                        >
                          <i />
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>

                      <td className="date-cell">
                        {formatDate(order.createdAt)}
                      </td>

                      <td>
                        <span className="order-open">←</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="dashboard-footer">
          <span>Dubai Fans Administration</span>
          <span>نظام إدارة الخدمات والطلبات</span>
        </footer>
      </section>
    </main>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string | number;
  icon: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}
