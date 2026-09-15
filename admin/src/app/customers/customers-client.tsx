"use client";

import { useMemo, useState } from "react";

type Customer = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  activeOrderCount: number;
  totalSpent: number;
  lastOrder: {
    orderNo: string;
    status: string;
    total: string | number;
    createdAt: string;
    service: {
      name: string;
    };
    package: {
      name: string;
    } | null;
  } | null;
};

type Stats = {
  totalCustomers: number;
  activeCustomers: number;
  orderCount: number;
  totalRevenue: string | number;
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
  }).format(new Date(value));
}

export default function CustomersClient({
  initialCustomers,
  stats,
}: {
  initialCustomers: Customer[];
  stats: Stats;
}) {
  const [customers] = useState(initialCustomers);
  const [search, setSearch] = useState("");

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.phone,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(query),
        ),
    );
  }, [customers, search]);

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

          <a className="nav-item" href="/orders">
            <span>▤</span>
            الطلبات
          </a>

          <a className="nav-item" href="/services">
            <span>◈</span>
            الخدمات
          </a>

          <a className="nav-item active" href="/customers">
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
            <div className="breadcrumb">Dubai Fans / الإدارة / العملاء</div>
            <h1>العملاء</h1>
            <p>إدارة ومتابعة العملاء وطلباتهم ونشاطهم.</p>
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
          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon">♙</div>
            </div>
            <div className="stat-value">{stats.totalCustomers}</div>
            <div className="stat-title">إجمالي العملاء</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon">●</div>
            </div>
            <div className="stat-value">{stats.activeCustomers}</div>
            <div className="stat-title">عملاء لديهم طلبات نشطة</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon">▤</div>
            </div>
            <div className="stat-value">{stats.orderCount}</div>
            <div className="stat-title">إجمالي الطلبات</div>
          </div>

          <div className="stat-card">
            <div className="stat-card-top">
              <div className="stat-icon">د.إ</div>
            </div>
            <div className="stat-value">
              {formatAED(stats.totalRevenue)}
            </div>
            <div className="stat-title">قيمة الطلبات</div>
          </div>
        </section>

        <section className="panel customers-panel">
          <div className="orders-toolbar">
            <div>
              <h2>قائمة العملاء</h2>
              <p>
                {filteredCustomers.length} عميل
                {filteredCustomers.length !== customers.length
                  ? ` من أصل ${customers.length}`
                  : ""}
              </p>
            </div>

            <div className="orders-search customer-search">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="orders-table customers-table">
              <thead>
                <tr>
                  <th>العميل</th>
                  <th>الهاتف</th>
                  <th>الطلبات</th>
                  <th>الطلبات النشطة</th>
                  <th>إجمالي الإنفاق</th>
                  <th>آخر طلب</th>
                  <th>تاريخ الانضمام</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      لا توجد نتائج مطابقة.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="customer-cell">
                          <div className="customer-avatar">
                            {(customer.name || customer.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <strong>
                              {customer.name || "بدون اسم"}
                            </strong>
                            <span>{customer.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>{customer.phone || "—"}</td>

                      <td>
                        <strong>{customer.orderCount}</strong>
                      </td>

                      <td>
                        <strong>{customer.activeOrderCount}</strong>
                      </td>

                      <td>
                        <strong>
                          {formatAED(customer.totalSpent)}
                        </strong>
                      </td>

                      <td>
                        {customer.lastOrder ? (
                          <div className="last-order-cell">
                            <strong>
                              {customer.lastOrder.orderNo}
                            </strong>
                            <span>
                              {customer.lastOrder.service.name}
                            </span>
                            <span
                              className={
                                statusClasses[
                                  customer.lastOrder.status
                                ] || "status"
                              }
                            >
                              <i />
                              {
                                statusLabels[
                                  customer.lastOrder.status
                                ]
                              }
                            </span>
                          </div>
                        ) : (
                          "لا توجد طلبات"
                        )}
                      </td>

                      <td className="date-cell">
                        {formatDate(customer.createdAt)}
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
