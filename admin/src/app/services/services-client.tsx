"use client";

import { useMemo, useState } from "react";

type PackageItem = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  price: string | number;
  unit?: string | null;
  quantity?: number | null;
  isActive: boolean;
  sortOrder: number;
};

type ServiceItem = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  type: string;
  pricingType: string;
  icon?: string | null;
  isActive: boolean;
  sortOrder: number;
  packages: PackageItem[];
};

const typeLabels: Record<string, string> = {
  ADVERTISING: "إدارة الإعلانات",
  FOLLOWERS: "المتابعين",
  VIEWS_LIKES: "المشاهدات والإعجابات",
  WEBSITE: "الموقع الإلكتروني",
  ECOMMERCE: "المتجر الإلكتروني",
  SEO_GOOGLE: "SEO & Google",
  SOCIAL_MEDIA: "إدارة السوشيال ميديا",
  PHOTOGRAPHY: "التصوير والمحتوى",
  CUSTOM: "خدمة مخصصة",
};

const pricingLabels: Record<string, string> = {
  FIXED: "سعر ثابت",
  PER_DAY: "يومي",
  PACKAGE: "باقات",
  QUOTE: "عرض سعر",
};

function money(value: string | number) {
  return `${Number(value).toLocaleString("en-US")} AED`;
}

export default function ServicesClient({
  initialServices,
}: {
  initialServices: ServiceItem[];
}) {
  const [services, setServices] = useState(initialServices);
  const [expanded, setExpanded] = useState<string | null>(
    initialServices[0]?.id ?? null,
  );
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [addingService, setAddingService] = useState(false);
  const [addingPackageFor, setAddingPackageFor] = useState<string | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => services.filter((service) => service.isActive).length,
    [services],
  );

  async function refresh() {
    const response = await fetch("/api/admin/services?includeInactive=true", {
      cache: "no-store",
    });

    if (!response.ok) throw new Error("تعذر تحميل الخدمات");
    setServices(await response.json());
  }

  async function toggleService(service: ServiceItem) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/services/${service.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !service.isActive }),
        },
      );

      if (!response.ok) throw new Error("تعذر تغيير حالة الخدمة");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function togglePackage(pkg: PackageItem) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/services/packages/${pkg.id}/active`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !pkg.isActive }),
        },
      );

      if (!response.ok) throw new Error("تعذر تغيير حالة الباقة");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function saveService(data: Record<string, unknown>) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        editing
          ? `/api/admin/services/${editing.id}`
          : "/api/admin/services",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join("، ")
            : result.message || "تعذر حفظ الخدمة",
        );
      }

      await refresh();
      setEditing(null);
      setAddingService(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  async function savePackage(
    serviceId: string,
    data: Record<string, unknown>,
    packageId?: string,
  ) {
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        packageId
          ? `/api/admin/services/packages/${packageId}`
          : `/api/admin/services/${serviceId}/packages`,
        {
          method: packageId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          Array.isArray(result.message)
            ? result.message.join("، ")
            : result.message || "تعذر حفظ الباقة",
        );
      }

      await refresh();
      setAddingPackageFor(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="page-header">
        <div>
          <div className="eyebrow">DUBAI FANS ADMIN</div>
          <h1>الخدمات والأسعار</h1>
          <p>إدارة الخدمات والباقات والأسعار المعروضة للعملاء.</p>
        </div>

        <button
          className="primary-btn"
          onClick={() => {
            setAddingService(true);
            setEditing(null);
          }}
        >
          + إضافة خدمة
        </button>
      </header>

      <section className="service-summary">
        <div>
          <span>إجمالي الخدمات</span>
          <strong>{services.length}</strong>
        </div>
        <div>
          <span>الخدمات النشطة</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>الباقات</span>
          <strong>
            {services.reduce((sum, service) => sum + service.packages.length, 0)}
          </strong>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="services-list">
        {services.map((service) => {
          const isOpen = expanded === service.id;

          return (
            <article
              key={service.id}
              className={`service-card ${!service.isActive ? "is-disabled" : ""}`}
            >
              <div
                className="service-card-head"
                onClick={() => setExpanded(isOpen ? null : service.id)}
              >
                <div className="service-icon">
                  {service.icon === "megaphone"
                    ? "📣"
                    : service.icon === "users"
                      ? "👥"
                      : service.icon === "eye"
                        ? "👁"
                        : service.icon === "globe"
                          ? "🌐"
                          : service.icon === "shopping-cart"
                            ? "🛒"
                            : service.icon === "search"
                              ? "🔎"
                              : service.icon === "share"
                                ? "📱"
                                : service.icon === "camera"
                                  ? "📷"
                                  : "💼"}
                </div>

                <div className="service-main">
                  <div className="service-title-row">
                    <h2>{service.name}</h2>
                    <span className={`status-pill ${service.isActive ? "active" : "inactive"}`}>
                      {service.isActive ? "نشطة" : "متوقفة"}
                    </span>
                  </div>
                  <p>{service.description || "لا يوجد وصف للخدمة."}</p>
                  <div className="service-meta">
                    <span>{typeLabels[service.type] || service.type}</span>
                    <span>{pricingLabels[service.pricingType] || service.pricingType}</span>
                    <span>{service.packages.length} باقة</span>
                  </div>
                </div>

                <div className="service-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="ghost-btn"
                    onClick={() => setEditing(service)}
                  >
                    تعديل
                  </button>
                  <button
                    className={`toggle-btn ${service.isActive ? "" : "off"}`}
                    disabled={busy}
                    onClick={() => toggleService(service)}
                  >
                    {service.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <button
                    className="expand-btn"
                    onClick={() => setExpanded(isOpen ? null : service.id)}
                  >
                    {isOpen ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {isOpen && (
                <div className="packages-area">
                  <div className="packages-head">
                    <div>
                      <h3>الباقات والأسعار</h3>
                      <span>Slug: {service.slug}</span>
                    </div>

                    <button
                      className="secondary-btn"
                      onClick={() => setAddingPackageFor(service.id)}
                    >
                      + إضافة باقة
                    </button>
                  </div>

                  {service.packages.length === 0 ? (
                    <div className="empty-packages">
                      هذه الخدمة تعمل بنظام <strong>عرض السعر</strong> ولا توجد
                      باقات محددة حاليًا.
                    </div>
                  ) : (
                    <div className="packages-grid">
                      {service.packages.map((pkg) => (
                        <PackageCard
                          key={pkg.id}
                          pkg={pkg}
                          busy={busy}
                          onToggle={() => togglePackage(pkg)}
                          onSave={(data) => savePackage(service.id, data, pkg.id)}
                        />
                      ))}
                    </div>
                  )}

                  {addingPackageFor === service.id && (
                    <PackageForm
                      busy={busy}
                      onCancel={() => setAddingPackageFor(null)}
                      onSave={(data) => savePackage(service.id, data)}
                    />
                  )}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {(addingService || editing) && (
        <ServiceForm
          service={editing}
          busy={busy}
          onCancel={() => {
            setAddingService(false);
            setEditing(null);
          }}
          onSave={saveService}
        />
      )}
    </main>
  );
}

function PackageCard({
  pkg,
  busy,
  onToggle,
  onSave,
}: {
  pkg: PackageItem;
  busy: boolean;
  onToggle: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <PackageForm
        initial={pkg}
        busy={busy}
        onCancel={() => setEditing(false)}
        onSave={(data) => {
          onSave(data);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className={`package-card ${!pkg.isActive ? "is-disabled" : ""}`}>
      <div className="package-top">
        <span className={`status-dot ${pkg.isActive ? "on" : "off"}`} />
        <span>{pkg.isActive ? "نشطة" : "متوقفة"}</span>
      </div>

      <h4>{pkg.name}</h4>
      {pkg.description && <p>{pkg.description}</p>}

      <div className="package-price">{money(pkg.price)}</div>

      {pkg.quantity && (
        <div className="package-quantity">
          {pkg.quantity.toLocaleString("en-US")} {pkg.unit || ""}
        </div>
      )}

      <div className="package-actions">
        <button className="ghost-btn" onClick={() => setEditing(true)}>
          تعديل
        </button>
        <button className="ghost-btn" disabled={busy} onClick={onToggle}>
          {pkg.isActive ? "إيقاف" : "تفعيل"}
        </button>
      </div>
    </div>
  );
}

function ServiceForm({
  service,
  busy,
  onCancel,
  onSave,
}: {
  service: ServiceItem | null;
  busy: boolean;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(service?.name || "");
  const [slug, setSlug] = useState(service?.slug || "");
  const [description, setDescription] = useState(service?.description || "");
  const [type, setType] = useState(service?.type || "CUSTOM");
  const [pricingType, setPricingType] = useState(service?.pricingType || "QUOTE");
  const [icon, setIcon] = useState(service?.icon || "briefcase");
  const [sortOrder, setSortOrder] = useState(String(service?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(service?.isActive ?? true);

  return (
    <div className="modal-backdrop">
      <div className="admin-modal">
        <div className="modal-head">
          <div>
            <span className="eyebrow">SERVICE</span>
            <h2>{service ? "تعديل الخدمة" : "إضافة خدمة جديدة"}</h2>
          </div>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <div className="form-grid">
          <label>
            اسم الخدمة
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>

          <label>
            Slug
            <input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>

          <label className="full">
            الوصف
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>

          <label>
            نوع الخدمة
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            نظام التسعير
            <select value={pricingType} onChange={(e) => setPricingType(e.target.value)}>
              {Object.entries(pricingLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <label>
            الأيقونة
            <input value={icon} onChange={(e) => setIcon(e.target.value)} />
          </label>

          <label>
            ترتيب العرض
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </label>
        </div>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
          />
          الخدمة نشطة للعملاء
        </label>

        <div className="modal-actions">
          <button className="secondary-btn" onClick={onCancel}>إلغاء</button>
          <button
            className="primary-btn"
            disabled={busy || !name.trim() || !slug.trim()}
            onClick={() =>
              onSave({
                name: name.trim(),
                slug: slug.trim(),
                description: description.trim() || null,
                type,
                pricingType,
                icon: icon.trim() || null,
                sortOrder: Number(sortOrder) || 0,
                isActive,
              })
            }
          >
            {busy ? "جارٍ الحفظ..." : "حفظ الخدمة"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PackageForm({
  initial,
  busy,
  onCancel,
  onSave,
}: {
  initial?: PackageItem;
  busy: boolean;
  onCancel: () => void;
  onSave: (data: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [price, setPrice] = useState(String(initial?.price ?? ""));
  const [unit, setUnit] = useState(initial?.unit || "");
  const [quantity, setQuantity] = useState(
    initial?.quantity == null ? "" : String(initial.quantity),
  );
  const [sortOrder, setSortOrder] = useState(String(initial?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  return (
    <div className={initial ? "package-card package-edit" : "package-form"}>
      <div className="form-grid">
        <label>
          اسم الباقة
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </label>

        <label>
          السعر AED
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </label>

        <label>
          الوحدة
          <input value={unit} onChange={(e) => setUnit(e.target.value)} />
        </label>

        <label>
          الكمية
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>

        <label>
          الترتيب
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          />
        </label>

        <label className="full">
          الوصف
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        الباقة نشطة
      </label>

      <div className="modal-actions">
        <button className="secondary-btn" onClick={onCancel}>إلغاء</button>
        <button
          className="primary-btn"
          disabled={busy || !name.trim() || !slug.trim() || price === ""}
          onClick={() =>
            onSave({
              name: name.trim(),
              slug: slug.trim(),
              description: description.trim() || null,
              price: Number(price),
              unit: unit.trim() || null,
              quantity: quantity === "" ? null : Number(quantity),
              sortOrder: Number(sortOrder) || 0,
              isActive,
            })
          }
        >
          {busy ? "جارٍ الحفظ..." : "حفظ الباقة"}
        </button>
      </div>
    </div>
  );
}
