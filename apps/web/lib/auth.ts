import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export interface AdminSession {
  email: string;
  role: "admin" | "reviewer";
  issuedAt: number;
}

const cookieName = "cosmetic_lens_session";

const secret = (): string => {
  const value = process.env["AUTH_COOKIE_SECRET"] ?? "development-only-secret-change-me-32chars";
  if (value.length < 32 && process.env["NODE_ENV"] === "production") {
    throw new Error("AUTH_COOKIE_SECRET must be at least 32 characters in production.");
  }
  return value;
};

const sign = (payload: string): string =>
  createHmac("sha256", secret()).update(payload).digest("base64url");

const encode = (session: AdminSession): string => {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  return `${payload}.${sign(payload)}`;
};

const decode = (value: string): AdminSession | undefined => {
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return undefined;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.byteLength !== right.byteLength || !timingSafeEqual(left, right)) return undefined;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
  if (Date.now() - parsed.issuedAt > 1000 * 60 * 60 * 12) return undefined;
  return parsed;
};

const validateOrigin = async (): Promise<void> => {
  if (process.env["NODE_ENV"] !== "production") return;
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  const host = headerStore.get("host");
  if (origin && host && !origin.includes(host)) {
    throw new Error("Invalid request origin.");
  }
};

export const getSession = async (): Promise<AdminSession | undefined> => {
  const cookieStore = await cookies();
  const raw = cookieStore.get(cookieName)?.value;
  return raw ? decode(raw) : undefined;
};

export const login = async (email: string, password: string): Promise<void> => {
  await validateOrigin();
  const expectedEmail = process.env["ADMIN_EMAIL"] ?? "admin@example.test";
  const expectedPassword = process.env["ADMIN_PASSWORD"] ?? "change-me-in-dev";
  if (email !== expectedEmail || password !== expectedPassword) {
    throw new Error("登入資料不正確。");
  }

  const cookieStore = await cookies();
  cookieStore.set(cookieName, encode({ email, role: "admin", issuedAt: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env["NODE_ENV"] === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
};

export const logout = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
};

export const requireAdmin = async (): Promise<AdminSession> => {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
};
