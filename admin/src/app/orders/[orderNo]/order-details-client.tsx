"use client";

import { useState } from "react";

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
  campaignData?: Record<string, unknown> | null;
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

const statuses = [
  "PENDING_PAYMENT",
  "PAID",
  "UNDER_REVIEW",
  "IN_PROGRESS",
  "WAITING_FOR_CUSTOMER",
  "REVISION",
  "COMPLETED",
  "CANCELLED",
  "REFUNDED",
];

export default function OrderDetailsClient({
  order,
  history,
  statusLabels,
}: {
  order: Order;
  history: HistoryItem[];
  statusLabels: Record<string, string>;
}) {
  const [currentStatus, setCurrentStatus] = useState(order.status);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const campaignData = order.campaignData ?? {};

  const [campaignName, setCampaignName] = useState(
    String(campaignData.campaignName ?? ""),
  );
  const [campaignPlatform, setCampaignPlatform] = useState(
    String(campaignData.platform ?? ""),
  );
  const [campaignUrl, setCampaignUrl] = useState(
    String(campaignData.campaignUrl ?? ""),
  );
  const [campaignBudget, setCampaignBudget] = useState(
    campaignData.budget !== undefined && campaignData.budget !== null
      ? String(campaignData.budget)
      : "",
  );
  const [campaignStartDate, setCampaignStartDate] = useState(
    String(campaignData.startDate ?? ""),
  );
  const [campaignEndDate, setCampaignEndDate] = useState(
    String(campaignData.endDate ?? ""),
  );
  const [campaignResult, setCampaignResult] = useState(
    String(campaignData.result ?? ""),
  );
  const [campaignNotes, setCampaignNotes] = useState(
    String(campaignData.notes ?? ""),
  );
  const [campaignSaving, setCampaignSaving] = useState(false);

  async function updateStatus() {
    if (selectedStatus === currentStatus) return;

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.orderNo)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: selectedStatus,
            note: note.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر تحديث حالة الطلب");
      }

      setCurrentStatus(data.status);
      setSelectedStatus(data.status);
      setNote("");
      setMessage("تم تحديث حالة الطلب بنجاح.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحديث الطلب",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateCampaignData() {
    setCampaignSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        `/api/admin/orders/${encodeURIComponent(order.orderNo)}/campaign-data`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            campaignName: campaignName.trim() || undefined,
            platform: campaignPlatform.trim() || undefined,
            campaignUrl: campaignUrl.trim() || undefined,
            budget: campaignBudget.trim()
              ? Number(campaignBudget)
              : undefined,
            startDate: campaignStartDate.trim() || undefined,
            endDate: campaignEndDate.trim() || undefined,
            result: campaignResult.trim() || undefined,
            notes: campaignNotes.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "تعذر حفظ بيانات الحملة");
      }

      setMessage("تم حفظ بيانات الحملة بنجاح.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء حفظ بيانات الحملة",
      );
    } finally {
      setCampaignSaving(false);
    }
  }

  function renderValue(value: unknown) {
    if (value === null || value === undefined || value === "") {
      return "—";
    }

    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  }

  return (
    <>
      <section className="order-summary-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <h2>بيانات العميل</h2>
          </div>

          <div className="detail-list">
            <div>
              <span>الاسم</span>
              <strong>{order.user.name || "بدون اسم"}</strong>
            </div>

            <div>
              <span>البريد الإلكتروني</span>
              <strong dir="ltr">{order.user.email}</strong>
            </div>

            <div>
              <span>الهاتف</span>
              <strong dir="ltr">{order.user.phone || "—"}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-header">
            <h2>الخدمة</h2>
          </div>

          <div className="detail-list">
            <div>
              <span>الخدمة</span>
              <strong>{order.service.name}</strong>
            </div>

            <div>
              <span>الباقة</span>
              <strong>{order.package?.name || "—"}</strong>
            </div>

            <div>
              <span>تاريخ الطلب</span>
              <strong>{formatDate(order.createdAt)}</strong>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-header">
            <h2>الملخص المالي</h2>
          </div>

          <div className="detail-list">
            <div>
              <span>الكمية</span>
              <strong>{order.quantity}</strong>
            </div>

            <div>
              <span>سعر الوحدة</span>
              <strong>{formatAED(order.unitPrice)}</strong>
            </div>

            <div>
              <span>المجموع</span>
              <strong className="total-value">
                {formatAED(order.total)}
              </strong>
            </div>
          </div>
        </div>
      </section>

      <section className="order-main-grid">
        <div className="detail-card">
          <div className="detail-card-header">
            <div>
              <h2>تفاصيل الطلب</h2>
              <p>البيانات التي أرسلها العميل عند إنشاء الطلب</p>
            </div>
          </div>

          {order.customerNote && (
            <div className="customer-note">
              <strong>ملاحظة العميل</strong>
              <p>{order.customerNote}</p>
            </div>
          )}

          <div className="form-data">
            {order.formData &&
            Object.keys(order.formData).length > 0 ? (
              Object.entries(order.formData).map(([key, value]) => (
                <div className="form-data-row" key={key}>
                  <span>{key}</span>
                  <strong>{renderValue(value)}</strong>
                </div>
              ))
            ) : (
              <div className="empty-detail">
                لا توجد بيانات إضافية لهذا الطلب.
              </div>
            )}
          </div>
        </div>

        {currentStatus === "IN_PROGRESS" && (
          <div className="detail-card status-management">
            <div className="detail-card-header">
              <div>
                <h2>بيانات الحملة</h2>
                <p>بيانات التنفيذ التي ستظهر للعميل</p>
              </div>
            </div>

            <label>
              اسم الحملة
              <input
                type="text"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
                placeholder="اسم الحملة"
                disabled={campaignSaving}
              />
            </label>

            <label>
              المنصة
              <input
                type="text"
                value={campaignPlatform}
                onChange={(event) => setCampaignPlatform(event.target.value)}
                placeholder="Facebook / Instagram / TikTok / Google"
                disabled={campaignSaving}
              />
            </label>

            <label>
              رابط الحملة / الإعلان
              <input
                type="url"
                value={campaignUrl}
                onChange={(event) => setCampaignUrl(event.target.value)}
                placeholder="رابط الحملة أو الإعلان"
                disabled={campaignSaving}
                dir="ltr"
              />
            </label>

            <label>
              الميزانية
              <input
                type="number"
                value={campaignBudget}
                onChange={(event) => setCampaignBudget(event.target.value)}
                placeholder="0"
                disabled={campaignSaving}
                min="0"
                step="0.01"
              />
            </label>

            <label>
              تاريخ البداية
              <input
                type="date"
                value={campaignStartDate}
                onChange={(event) => setCampaignStartDate(event.target.value)}
                disabled={campaignSaving}
              />
            </label>

            <label>
              تاريخ النهاية
              <input
                type="date"
                value={campaignEndDate}
                onChange={(event) => setCampaignEndDate(event.target.value)}
                disabled={campaignSaving}
              />
            </label>

            <label>
              الحالة / النتيجة
              <input
                type="text"
                value={campaignResult}
                onChange={(event) => setCampaignResult(event.target.value)}
                placeholder="مثال: الحملة تعمل بشكل جيد"
                disabled={campaignSaving}
              />
            </label>

            <label>
              ملاحظات فريق التنفيذ
              <textarea
                value={campaignNotes}
                onChange={(event) => setCampaignNotes(event.target.value)}
                placeholder="ملاحظات تظهر للعميل..."
                rows={4}
                disabled={campaignSaving}
              />
            </label>

            <button
              type="button"
              className="primary-action"
              onClick={updateCampaignData}
              disabled={campaignSaving}
            >
              {campaignSaving ? "جاري الحفظ..." : "حفظ بيانات الحملة"}
            </button>

            {message && <div className="action-message">{message}</div>}
          </div>
        )}

        <div className="detail-card status-management">
          <div className="detail-card-header">
            <div>
              <h2>إدارة الحالة</h2>
              <p>تغيير حالة الطلب وإضافة ملاحظة</p>
            </div>
          </div>

          <label>
            الحالة الجديدة
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              disabled={saving}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label>
            ملاحظة إدارية
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="اكتب ملاحظة مرتبطة بتغيير الحالة..."
              rows={4}
              disabled={saving}
            />
          </label>

          <button
            type="button"
            className="primary-action"
            onClick={updateStatus}
            disabled={saving || selectedStatus === currentStatus}
          >
            {saving ? "جاري الحفظ..." : "حفظ تغيير الحالة"}
          </button>

          {message && <div className="action-message">{message}</div>}
        </div>
      </section>

      <section className="detail-card timeline-card">
        <div className="detail-card-header">
          <div>
            <h2>سجل الطلب</h2>
            <p>التغييرات المسجلة على حالة الطلب</p>
          </div>
        </div>

        <div className="timeline">
          {history.length === 0 ? (
            <div className="empty-detail">لا يوجد سجل لهذا الطلب.</div>
          ) : (
            history.map((item) => (
              <div className="timeline-item" key={item.id}>
                <div className="timeline-dot" />

                <div className="timeline-content">
                  <div className="timeline-top">
                    <strong>
                      {statusLabels[item.status] || item.status}
                    </strong>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>

                  {item.note && (
                    <p>{item.note}</p>
                  )}

                  {item.changedBy && (
                    <small>تم التحديث بواسطة: {item.changedBy}</small>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
