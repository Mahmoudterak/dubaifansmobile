"use client";

import Link from "next/link";

type ReportData = {
  summary: {
    totalOrders: number;
    completedOrders: number;
    activeOrders: number;
    totalCustomers: number;
    totalRevenue: number;
  };
  statuses: Array<{
    status: string;
    count: number;
    revenue: number;
  }>;
  services: Array<{
    serviceId: string;
    serviceName: string;
    orderCount: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    orderNo: string;
    status: string;
    total: string;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
    service: {
      name: string;
    };
    package: {
      name: string;
    } | null;
  }>;
};

const statusLabels: Record<string, string> = {
  DRAFT: "مسودة",
  PENDING_PAYMENT: "بانتظار الدفع",
  PAID: "تم الدفع",
  UNDER_REVIEW: "قيد المراجعة",
  IN_PROGRESS: "قيد التنفيذ",
  WAITING_FOR_CUSTOMER: "بانتظار العميل",
  REVISION: "مراجعة",
  COMPLETED: "مكتمل",
  CANCELLED: "ملغي",
  REFUNDED: "مسترد",
};

const statusClasses: Record<string, string> = {
  DRAFT: "status-draft",
  PENDING_PAYMENT: "status-pending",
  PAID: "status-paid",
  UNDER_REVIEW: "status-review",
  IN_PROGRESS: "status-progress",
  WAITING_FOR_CUSTOMER: "status-waiting",
  REVISION: "status-revision",
  COMPLETED: "status-completed",
  CANCELLED: "status-cancelled",
  REFUNDED: "status-refunded",
};

function formatAED(value: number | string) {
  return `${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} AED`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ar-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReportsClient({ data }: { data: ReportData }) {
  const maxServiceOrders = Math.max(
    ...data.services.map((service) => service.orderCount),
    1,
  );

  return (
    <main className="dashboard-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">DF</div>
          <div>
            <strong>Dubai Fans</strong>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link href="/">الرئيسية</Link>
          <Link href="/orders">الطلبات</Link>
          <Link href="/services">الخدمات</Link>
          <Link href="/customers">العملاء</Link>
          <Link href="/reports" className="active">التقارير</Link>
          <Link href="/settings">الإعدادات</Link>
        </nav>
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <h1>التقارير</h1>
            <p>ملخص أداء المنصة والطلبات والعملاء</p>
          </div>
        </header>

        <section className="stats-grid reports-stats">
          <div className="stat-card">
            <span className="stat-label">إجمالي الإيرادات</span>
            <strong>{formatAED(data.summary.totalRevenue)}</strong>
            <small>الطلبات غير الملغاة أو المستردة</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">إجمالي الطلبات</span>
            <strong>{data.summary.totalOrders}</strong>
            <small>جميع الطلبات</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">الطلبات النشطة</span>
            <strong>{data.summary.activeOrders}</strong>
            <small>قيد التنفيذ أو المعالجة</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">الطلبات المكتملة</span>
            <strong>{data.summary.completedOrders}</strong>
            <small>طلبات مكتملة</small>
          </div>

          <div className="stat-card">
            <span className="stat-label">العملاء</span>
            <strong>{data.summary.totalCustomers}</strong>
            <small>عملاء مسجلون</small>
          </div>
        </section>

        <section className="reports-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>الطلبات حسب الحالة</h2>
                <p>توزيع الطلبات الحالية</p>
              </div>
            </div>

            <div className="report-status-list">
              {data.statuses.length === 0 ? (
                <div className="empty-state">لا توجد بيانات حتى الآن</div>
              ) : (
                data.statuses.map((item) => (
                  <div className="report-status-row" key={item.status}>
                    <div className="report-status-info">
                      <span
                        className={`status-badge ${
                          statusClasses[item.status] || "status-default"
                        }`}
                      >
                        {statusLabels[item.status] || item.status}
                      </span>
                      <strong>{item.count}</strong>
                    </div>

                    <span>{formatAED(item.revenue)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>أداء الخدمات</h2>
                <p>عدد الطلبات والإيرادات لكل خدمة</p>
              </div>
            </div>

            <div className="service-performance-list">
              {data.services.length === 0 ? (
                <div className="empty-state">لا توجد بيانات حتى الآن</div>
              ) : (
                data.services.map((service) => (
                  <div
                    className="service-performance-row"
                    key={service.serviceId}
                  >
                    <div className="service-performance-top">
                      <strong>{service.serviceName}</strong>
                      <span>{formatAED(service.revenue)}</span>
                    </div>

                    <div className="service-bar">
                      <span
                        style={{
                          width: `${Math.max(
                            (service.orderCount / maxServiceOrders) * 100,
                            4,
                          )}%`,
                        }}
                      />
                    </div>

                    <small>
                      {service.orderCount}{" "}
                      {service.orderCount === 1 ? "طلب" : "طلبات"}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="dashboard-card">
          <div className="card-header">
            <div>
              <h2>أحدث الطلبات</h2>
              <p>آخر 10 طلبات تم إنشاؤها</p>
            </div>
            <Link href="/orders" className="card-link">
              عرض كل الطلبات
            </Link>
          </div>

          <div className="table-wrap">
            <table className="orders-table reports-orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>الخدمة</th>
                  <th>الباقة</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>

              <tbody>
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty-state">لا توجد طلبات</div>
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.orderNo}>
                      <td>
                        <Link
                          href={`/orders/${order.orderNo}`}
                          className="order-number-link"
                        >
                          {order.orderNo}
                        </Link>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <strong>{order.user.name || "بدون اسم"}</strong>
                          <span>{order.user.email}</span>
                        </div>
                      </td>
                      <td>{order.service.name}</td>
                      <td>{order.package?.name || "—"}</td>
                      <td>{formatAED(order.total)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            statusClasses[order.status] || "status-default"
                          }`}
                        >
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
