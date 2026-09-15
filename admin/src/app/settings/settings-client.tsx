"use client";

import { useEffect, useState } from "react";

type StaffRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

type StaffUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: StaffRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

const roleLabels: Record<StaffRole, string> = {
  ADMIN: "مسؤول كامل",
  MANAGER: "مدير",
  EMPLOYEE: "موظف",
};

const roleDescriptions: Record<StaffRole, string> = {
  ADMIN: "صلاحيات كاملة على لوحة الإدارة وإدارة المسؤولين.",
  MANAGER: "إدارة الطلبات والعملاء والخدمات والتقارير.",
  EMPLOYEE: "تنفيذ ومتابعة الطلبات الموكلة إليه.",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-AE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export default function SettingsClient() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<StaffRole>("EMPLOYEE");

  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<StaffRole>("EMPLOYEE");

  const [passwordUser, setPasswordUser] = useState<StaffUser | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileRole, setProfileRole] = useState<StaffRole>("ADMIN");

  const [currentPassword, setCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileConfirmPassword, setProfileConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  async function loadProfile() {
    try {
      setProfileLoading(true);

      const response = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "تعذر تحميل بيانات الحساب");
      }

      setProfileName(data?.name || "");
      setProfileEmail(data?.email || "");
      setProfilePhone(data?.phone || "");
      setProfileRole((data?.role as StaffRole) || "ADMIN");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل بيانات الحساب");
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setProfileSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profileName,
          email: profileEmail,
          phone: profilePhone,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(backendMessage || "تعذر حفظ بيانات الحساب");
      }

      setProfileName(data?.name || "");
      setProfileEmail(data?.email || "");
      setProfilePhone(data?.phone || "");
      setProfileRole((data?.role as StaffRole) || profileRole);

      setMessage("تم تحديث بيانات الحساب بنجاح.");
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setProfileSaving(false);
    }
  }

  async function saveProfilePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (profileNewPassword !== profileConfirmPassword) {
      setError("تأكيد كلمة المرور الجديدة غير مطابق.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch("/api/auth/me/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: profileNewPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(backendMessage || "تعذر تغيير كلمة المرور");
      }

      setCurrentPassword("");
      setProfileNewPassword("");
      setProfileConfirmPassword("");
      setMessage("تم تغيير كلمة المرور بنجاح.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function loadStaff() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/account/users", {
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "تعذر تحميل فريق الإدارة");
      }

      setStaff(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    loadStaff();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/account/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          password,
          role,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(backendMessage || "تعذر إنشاء المستخدم");
      }

      setMessage("تمت إضافة عضو الفريق بنجاح.");
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setRole("EMPLOYEE");

      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(member: StaffUser) {
    setMessage("");
    setError("");
    setEditing(member);
    setEditName(member.name || "");
    setEditEmail(member.email);
    setEditPhone(member.phone || "");
    setEditRole(member.role);
  }

  function closeEditing() {
    setEditing(null);
  }

  async function saveEditing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editing) return;

    setActionId(editing.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/account/users/${editing.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editName,
            email: editEmail,
            phone: editPhone,
            role: editRole,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(backendMessage || "تعذر تحديث بيانات المستخدم");
      }

      setMessage("تم تحديث بيانات عضو الفريق.");
      setEditing(null);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setActionId(null);
    }
  }

  async function toggleActive(member: StaffUser) {
    const nextState = !member.isActive;
    const action = nextState ? "تفعيل" : "تعطيل";

    if (
      !window.confirm(
        `هل أنت متأكد من ${action} حساب ${member.name || member.email}؟`,
      )
    ) {
      return;
    }

    setActionId(member.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/account/users/${member.id}/active`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isActive: nextState,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(backendMessage || `تعذر ${action} الحساب`);
      }

      setMessage(`تم ${action} الحساب بنجاح.`);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setActionId(null);
    }
  }

  function openPasswordModal(member: StaffUser) {
    setPasswordUser(member);
    setNewPassword("");
    setMessage("");
    setError("");
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!passwordUser) return;

    if (
      !window.confirm(
        `سيتم تغيير كلمة مرور ${passwordUser.name || passwordUser.email}. هل تريد المتابعة؟`,
      )
    ) {
      return;
    }

    setActionId(passwordUser.id);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `/api/admin/account/users/${passwordUser.id}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const backendMessage = Array.isArray(data?.message)
          ? data.message.join("، ")
          : data?.message;

        throw new Error(
          backendMessage || "تعذر إعادة تعيين كلمة المرور",
        );
      }

      setMessage("تم تغيير كلمة المرور بنجاح.");
      setPasswordUser(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="dashboard settings-dashboard">
      <aside className="sidebar">
        <div className="brand">
          <strong>Dubai Fans</strong>
          <span>Administration</span>
        </div>

        <nav className="nav">
          <a className="nav-item" href="/">📊 لوحة التحكم</a>
          <a className="nav-item" href="/orders">📦 الطلبات</a>
          <a className="nav-item" href="/services">🛠️ الخدمات</a>
          <a className="nav-item" href="/customers">👥 العملاء</a>
          <a className="nav-item" href="/reports">📈 التقارير</a>
          <a className="nav-item active" href="/settings">⚙️ الإعدادات</a>
        </nav>
      </aside>

      <main className="dashboard-main settings-main">
        <header className="dashboard-header">
          <div>
            <h1>إعدادات الحساب</h1>
            <p>إدارة حساب الإدارة وفريق العمل والصلاحيات.</p>
          </div>
        </header>

        {message && <div className="settings-alert success">{message}</div>}
        {error && <div className="settings-alert error">{error}</div>}

        <section className="dashboard-card account-card">
          <div className="card-header">
            <div>
              <h2>حسابي</h2>
              <p>تعديل بيانات حسابك الشخصي وإدارة كلمة المرور.</p>
            </div>
            <span className="settings-icon">🔐</span>
          </div>

          {profileLoading ? (
            <div className="settings-empty">جاري تحميل بيانات الحساب...</div>
          ) : (
            <div className="account-settings-grid">
              <form className="settings-form" onSubmit={saveProfile}>
                <div className="form-row">
                  <label>
                    الاسم
                    <input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="اسمك"
                      required
                      minLength={2}
                    />
                  </label>

                  <label>
                    البريد الإلكتروني
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    رقم الهاتف
                    <input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+971..."
                    />
                  </label>

                  <label>
                    الصلاحية
                    <input
                      value={roleLabels[profileRole] || profileRole}
                      readOnly
                      disabled
                    />
                  </label>
                </div>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={profileSaving}
                >
                  {profileSaving ? "جاري الحفظ..." : "حفظ بيانات الحساب"}
                </button>
              </form>

              <form className="settings-form account-password-form" onSubmit={saveProfilePassword}>
                <div className="account-section-title">
                  <strong>تغيير كلمة المرور</strong>
                  <span>يجب إدخال كلمة المرور الحالية أولًا.</span>
                </div>

                <label>
                  كلمة المرور الحالية
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="كلمة المرور الحالية"
                    required
                    minLength={8}
                    autoComplete="current-password"
                  />
                </label>

                <label>
                  كلمة المرور الجديدة
                  <input
                    type="password"
                    value={profileNewPassword}
                    onChange={(e) => setProfileNewPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>

                <label>
                  تأكيد كلمة المرور الجديدة
                  <input
                    type="password"
                    value={profileConfirmPassword}
                    onChange={(e) => setProfileConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة المرور الجديدة"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </label>

                <button
                  className="secondary-button"
                  type="submit"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "جاري التغيير..." : "تغيير كلمة المرور"}
                </button>
              </form>
            </div>
          )}
        </section>

        <section className="settings-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>إضافة مسؤول / موظف</h2>
                <p>إنشاء حساب جديد للوصول إلى لوحة الإدارة.</p>
              </div>
              <span className="settings-icon">👤</span>
            </div>

            <form className="settings-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <label>
                  الاسم
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="اسم الموظف أو المسؤول"
                    required
                    minLength={2}
                  />
                </label>

                <label>
                  البريد الإلكتروني
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </label>
              </div>

              <div className="form-row">
                <label>
                  رقم الهاتف
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971..."
                  />
                </label>

                <label>
                  كلمة المرور
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 أحرف على الأقل"
                    required
                    minLength={8}
                  />
                </label>
              </div>

              <label>
                الصلاحية
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                >
                  <option value="EMPLOYEE">موظف</option>
                  <option value="MANAGER">مدير</option>
                  <option value="ADMIN">مسؤول كامل</option>
                </select>
              </label>

              <div className="role-description">
                <strong>{roleLabels[role]}</strong>
                <span>{roleDescriptions[role]}</span>
              </div>

              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "جاري الإضافة..." : "إضافة عضو الفريق"}
              </button>
            </form>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <div>
                <h2>فريق الإدارة</h2>
                <p>إدارة الحسابات والصلاحيات والحالة.</p>
              </div>
              <span className="staff-count">{staff.length}</span>
            </div>

            {loading ? (
              <div className="settings-empty">جاري تحميل الفريق...</div>
            ) : staff.length === 0 ? (
              <div className="settings-empty">لا يوجد أعضاء في فريق الإدارة.</div>
            ) : (
              <div className="staff-list">
                {staff.map((member) => (
                  <div className="staff-item" key={member.id}>
                    <div className="staff-avatar">
                      {(member.name || member.email).charAt(0).toUpperCase()}
                    </div>

                    <div className="staff-info">
                      <strong>{member.name || "بدون اسم"}</strong>
                      <span>{member.email}</span>
                      {member.phone && <small>{member.phone}</small>}

                      <div className="staff-status-row">
                        <span
                          className={`status-dot ${
                            member.isActive ? "active" : "inactive"
                          }`}
                        />
                        <span className="staff-status-text">
                          {member.isActive ? "الحساب نشط" : "الحساب معطّل"}
                        </span>
                      </div>
                    </div>

                    <div className="staff-meta">
                      <span className={`role-badge role-${member.role.toLowerCase()}`}>
                        {roleLabels[member.role]}
                      </span>

                      <small>{formatDate(member.createdAt)}</small>

                      <div className="staff-actions">
                        <button
                          type="button"
                          className="staff-action edit"
                          onClick={() => startEditing(member)}
                          disabled={actionId === member.id}
                        >
                          تعديل
                        </button>

                        <button
                          type="button"
                          className={`staff-action ${
                            member.isActive ? "disable" : "enable"
                          }`}
                          onClick={() => toggleActive(member)}
                          disabled={actionId === member.id}
                        >
                          {member.isActive ? "تعطيل" : "تفعيل"}
                        </button>

                        <button
                          type="button"
                          className="staff-action password"
                          onClick={() => openPasswordModal(member)}
                          disabled={actionId === member.id}
                        >
                          كلمة المرور
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="dashboard-card permissions-card">
          <div className="card-header">
            <div>
              <h2>مستويات الصلاحيات</h2>
              <p>التقسيم الحالي لأدوار فريق الإدارة.</p>
            </div>
          </div>

          <div className="permissions-grid">
            {(Object.keys(roleLabels) as StaffRole[]).map((item) => (
              <div className="permission-item" key={item}>
                <span className={`role-badge role-${item.toLowerCase()}`}>
                  {roleLabels[item]}
                </span>
                <p>{roleDescriptions[item]}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {editing && (
        <div className="settings-modal-backdrop" onMouseDown={closeEditing}>
          <div
            className="settings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div>
                <h2>تعديل عضو الفريق</h2>
                <p>تعديل بيانات الحساب والصلاحية.</p>
              </div>
              <button type="button" onClick={closeEditing} className="modal-close">
                ×
              </button>
            </div>

            <form className="settings-form" onSubmit={saveEditing}>
              <label>
                الاسم
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  minLength={2}
                />
              </label>

              <label>
                البريد الإلكتروني
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  required
                />
              </label>

              <label>
                رقم الهاتف
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </label>

              <label>
                الصلاحية
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as StaffRole)}
                >
                  <option value="EMPLOYEE">موظف</option>
                  <option value="MANAGER">مدير</option>
                  <option value="ADMIN">مسؤول كامل</option>
                </select>
              </label>

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeEditing}>
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={actionId === editing.id}
                >
                  {actionId === editing.id ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {passwordUser && (
        <div
          className="settings-modal-backdrop"
          onMouseDown={() => setPasswordUser(null)}
        >
          <div
            className="settings-modal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="settings-modal-header">
              <div>
                <h2>إعادة تعيين كلمة المرور</h2>
                <p>{passwordUser.name || passwordUser.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setPasswordUser(null)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form className="settings-form" onSubmit={resetPassword}>
              <label>
                كلمة المرور الجديدة
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8 أحرف على الأقل"
                  required
                  minLength={8}
                  autoFocus
                />
              </label>

              <div className="role-description">
                <strong>تنبيه أمني</strong>
                <span>
                  سيتم تغيير كلمة المرور الحالية فورًا. يجب إبلاغ العضو بكلمة
                  المرور الجديدة بطريقة آمنة.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPasswordUser(null)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={actionId === passwordUser.id}
                >
                  {actionId === passwordUser.id
                    ? "جاري التغيير..."
                    : "تغيير كلمة المرور"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
