import { cookies } from "next/headers";

const ADMIN_TOKEN_COOKIE = "df_admin_token";

export async function getAdminToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_TOKEN_COOKIE)?.value ?? null;
}

export const ADMIN_TOKEN_COOKIE_NAME = ADMIN_TOKEN_COOKIE;
