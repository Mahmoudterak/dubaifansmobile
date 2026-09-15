const API_BASE_URL = 'https://api.mtuaefans.com/api';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const text = await response.text();

  let data: unknown;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(
      typeof data === 'object' &&
      data !== null &&
      'message' in data
        ? String((data as { message: unknown }).message)
        : `API request failed: ${response.status}`,
    );
  }

  return data as T;
}

/* =========================
   SERVICES
========================= */

export function getServices<T>() {
  return apiRequest<T>('/services');
}

export function getServiceBySlug<T>(slug: string) {
  return apiRequest<T>(`/services/${encodeURIComponent(slug)}`);
}

/* =========================
   AUTH / PROFILE
========================= */

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone?: string | null;

  businessName?: string | null;
  businessType?: string | null;
  websiteUrl?: string | null;

  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  snapchatUrl?: string | null;
  googleBusinessUrl?: string | null;

  role: string;
  createdAt: string;
  updatedAt?: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
};

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export function googleLogin(idToken: string) {
  return apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({
      idToken,
    }),
  });
}

export function register(
  name: string,
  email: string,
  password: string,
  phone?: string,
) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      phone,
    }),
  });
}

export function forgotPassword(email: string) {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return apiRequest<{ success: boolean; message: string }>('/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getMe(token: string) {
  return apiRequest<AuthUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
  phone?: string;

  businessName?: string;
  businessType?: string;
  websiteUrl?: string;

  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  snapchatUrl?: string;
  googleBusinessUrl?: string;
};

export function updateProfile(
  token: string,
  payload: UpdateProfilePayload,
) {
  return apiRequest<AuthUser>('/auth/me', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

/* =========================
   ORDERS
========================= */

export type CreateOrderPayload = {
  serviceId: string;
  packageId?: string;
  quantity?: number;
  customerNote?: string;
  formData?: Record<string, unknown>;
};

export type OrderResponse = {
  id: string;
  orderNo: string;
  status: string;
  unitPrice: string | number;
  subtotal: string | number;
  vat: string | number;
  total: string | number;

  service?: {
    id: string;
    name: string;
    slug: string;
  };

  package?: {
    id: string;
    name: string;
    price: string | number;
  } | null;
};

export function createOrder(
  token: string,
  payload: CreateOrderPayload,
) {
  return apiRequest<OrderResponse>('/orders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

export type Order = {
  id: string;
  orderNo: string;
  status: string;
  quantity?: number | null;

  unitPrice: string | number;
  subtotal: string | number;
  vat: string | number;
  total: string | number;

  customerNote?: string | null;
  formData?: Record<string, unknown> | null;
  campaignData?: Record<string, unknown> | null;

  createdAt: string;
  updatedAt: string;

  service?: {
    id: string;
    name: string;
    slug: string;
  };

  package?: {
    id: string;
    name: string;
    price: string | number;
  } | null;
};

export function getOrders(token: string) {
  return apiRequest<Order[]>('/orders', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getOrder(token: string, orderNo: string) {
  return apiRequest<Order>(
    `/orders/${encodeURIComponent(orderNo)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function submitOrderRevision(
  token: string,
  orderNo: string,
  response: string,
  formData?: Record<string, unknown>,
) {
  return apiRequest<Order>(
    `/orders/${encodeURIComponent(orderNo)}/revision`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        response,
        ...(formData ? { formData } : {}),
      }),
    },
  );
}

export type OrderHistoryItem = {
  id: string;
  orderId: string;
  status: string;
  note?: string | null;
  changedBy?: string | null;
  createdAt: string;
};

export function getOrderHistory(
  token: string,
  orderNo: string,
) {
  return apiRequest<OrderHistoryItem[]>(
    `/orders/${encodeURIComponent(orderNo)}/history`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

/* =========================
   PAYMENTS
========================= */

export type PaymentResponse = {
  success: boolean;

  payment: {
    id: string;
    paymentIntentId: string;
    operationId: string;
    status: string;

    redirectUrl?: string | null;
    embeddedUrl?: string | null;

    amount: string | number;
    currency: string;
  };
};

export function createPayment(
  token: string,
  orderNo: string,
  message?: string,
) {
  return apiRequest<PaymentResponse>(
    `/payments/orders/${orderNo}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
      }),
    },
  );
}

export function getPayment(
  token: string,
  paymentIntentId: string,
) {
  return apiRequest<PaymentResponse>(
    `/payments/${paymentIntentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function getPaymentHistory(token: string) {
  return apiRequest<{
    id: string;
    paymentIntentId: string;
    operationId: string;
    orderNo: string;
    serviceName: string;
    packageName: string | null;
    amount: string;
    currency: string;
    status: string;
    provider: string;
    createdAt: string;
    completedAt: string | null;
    failureMessage: string | null;
  }[]>('/payments/history', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/* =========================
   NOTIFICATIONS
========================= */

export type AppNotification = {
  id: string;
  userId: string;
  orderId?: string | null;
  title: string;
  message: string;
  status?: string | null;
  isRead: boolean;
  createdAt: string;

  order?: {
    orderNo: string;
    status: string;
  } | null;
};

export function getNotifications(token: string) {
  return apiRequest<AppNotification[]>('/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getUnreadNotificationCount(token: string) {
  return apiRequest<{ count: number }>('/notifications/unread-count', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markNotificationAsRead(
  token: string,
  notificationId: string,
) {
  return apiRequest<AppNotification>(
    `/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
