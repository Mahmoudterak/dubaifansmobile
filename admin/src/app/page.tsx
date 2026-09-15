import { redirect } from "next/navigation";
import { getAdminOrders, getAdminOrdersStats } from "@/lib/api";
import { getAdminToken } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

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

function StatCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: string;
  description?: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-icon">{icon}</div>
        {description && <span className="stat-description">{description}</span>}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-title">{title}</div>
    </div>
  );
}

export default async function Home() {
  const token = await getAdminToken();

  if (!token) {
    redirect("/login");
  }

  const [stats, orders] = (await Promise.all([
    getAdminOrdersStats(token),
    getAdminOrders(token),
  ])) as [Stats, Order[]];

  const recentOrders = orders.slice(0, 8);

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
          <a className="nav-item active" href="/">
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
          <LogoutButton />
        </div>
      </aside>

      <section className="content">
        <header className="header">
          <div>
            <div className="breadcrumb">Dubai Fans / الإدارة</div>
            <h1>لوحة التحكم</h1>
            <p>نظرة عامة على الطلبات والخدمات والأداء.</p>
          </div>

          <div className="header-actions">
            <div className="header-date">
              <span>آخر تحديث</span>
              <strong>بيانات مباشرة</strong>
            </div>
            <div className="notification">🔔</div>
          </div>
        </header>

        <section className="stats-grid">
          <StatCard
            title="إجمالي الطلبات"
            value={stats.total}
            icon="▤"
            description="كل الطلبات"
          />

          <StatCard
            title="قيد التنفيذ"
            value={stats.inProgress}
            icon="↻"
            description="نشطة"
          />

          <StatCard
            title="قيد المراجعة"
            value={stats.underReview}
            icon="◉"
            description="تحتاج متابعة"
          />

          <StatCard
            title="بانتظار العميل"
            value={stats.waitingForCustomer}
            icon="◌"
            description="إجراء مطلوب"
          />

          <StatCard
            title="مكتملة"
            value={stats.completed}
            icon="✓"
            description="طلبات منجزة"
          />

          <StatCard
            title="الإيرادات"
            value={formatAED(stats.revenue)}
            icon="د.إ"
            description="الإجمالي الحالي"
          />
        </section>

        <section className="dashboard-grid">
          <div className="panel orders-panel" id="orders">
            <div className="panel-header">
              <div>
                <h2>أحدث الطلبات</h2>
                <p>آخر الطلبات المسجلة في النظام</p>
              </div>

              <a href="/orders" className="panel-action">
                عرض الكل
              </a>
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
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        لا توجد طلبات حتى الآن
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
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

                        <td>
                          {order.package?.name || "—"}
                        </td>

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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="side-panels">
            <div className="panel status-panel">
              <div className="panel-header">
                <div>
                  <h2>حالة الطلبات</h2>
                  <p>التوزيع الحالي</p>
                </div>
              </div>

              <div className="status-list">
                <div>
                  <span>
                    <i className="dot progress-dot" />
                    قيد التنفيذ
                  </span>
                  <strong>{stats.inProgress}</strong>
                </div>

                <div>
                  <span>
                    <i className="dot review-dot" />
                    قيد المراجعة
                  </span>
                  <strong>{stats.underReview}</strong>
                </div>

                <div>
                  <span>
                    <i className="dot waiting-dot" />
                    بانتظار العميل
                  </span>
                  <strong>{stats.waitingForCustomer}</strong>
                </div>

                <div>
                  <span>
                    <i className="dot completed-dot" />
                    مكتملة
                  </span>
                  <strong>{stats.completed}</strong>
                </div>

                <div>
                  <span>
                    <i className="dot pending-dot" />
                    بانتظار الدفع
                  </span>
                  <strong>{stats.pendingPayment}</strong>
                </div>
              </div>
            </div>

            <div className="panel quick-panel">
              <div className="panel-header">
                <div>
                  <h2>ملخص سريع</h2>
                  <p>أهم أرقام النظام</p>
                </div>
              </div>

              <div className="quick-list">
                <div>
                  <span>تم الدفع</span>
                  <strong>{stats.paid}</strong>
                </div>

                <div>
                  <span>تحتاج تعديل</span>
                  <strong>{stats.revision}</strong>
                </div>

                <div>
                  <span>ملغاة</span>
                  <strong>{stats.cancelled}</strong>
                </div>

                <div>
                  <span>مستردة</span>
                  <strong>{stats.refunded}</strong>
                </div>
              </div>
            </div>
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
