import type { Metadata } from "next";
import Link from "next/link";
import { Camera, Database, Search, ShieldCheck } from "lucide-react";
import { appConfig } from "@cosmetic-lens/shared";
import "./globals.css";

const siteDescription =
  "搜尋化妝品及成分、上載產品標籤相片、核對 OCR 結果，並從健康、致敏、環境、法規及證據可信度等角度理解成分資料。";

export const metadata: Metadata = {
  applicationName: appConfig.productName,
  title: {
    default: `${appConfig.productName} | ${appConfig.productEnglishName}`,
    template: `%s | ${appConfig.productName}`,
  },
  description: siteDescription,
  openGraph: {
    title: `${appConfig.productName} | ${appConfig.productEnglishName}`,
    description: siteDescription,
    siteName: appConfig.productName,
    locale: "zh_HK",
    type: "website",
  },
};

const navItems = [
  { href: "/search", label: "搜尋", icon: Search },
  { href: "/products", label: "瀏覽產品", icon: Database },
  { href: "/submit", label: "上載產品相片", icon: Camera },
  { href: "/methodology", label: "評估方法", icon: ShieldCheck },
  { href: "/sources", label: "來源", icon: Database },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: appConfig.productName,
    alternateName: appConfig.productEnglishName,
    applicationCategory: "HealthApplication",
    inLanguage: appConfig.locale,
    description: siteDescription,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "HKD",
    },
  };

  return (
    <html lang={appConfig.locale}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <a className="skip-link" href="#main">
          跳到主要內容
        </a>
        <header className="border-b border-[var(--line)] bg-white/92 backdrop-blur">
          <div className="container-shell flex min-h-16 flex-wrap items-center justify-between gap-3 py-3">
            <Link
              href="/"
              className="group flex items-baseline gap-2"
              aria-label={`${appConfig.productName}首頁`}
            >
              <span className="text-xl font-semibold tracking-normal text-[var(--accent-strong)]">
                {appConfig.productName}
              </span>
              <span className="text-sm text-[var(--muted)]">{appConfig.productEnglishName}</span>
            </Link>
            <nav aria-label="主要導覽" className="flex flex-wrap items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-[var(--surface-soft)]"
                  >
                    <Icon aria-hidden="true" size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="mt-16 border-t border-[var(--line)] bg-white">
          <div className="container-shell grid gap-6 py-8 text-sm text-[var(--muted)] md:grid-cols-[1.3fr_1fr]">
            <p>
              {appConfig.productName}{" "}
              報告潛在關注、證據可信度、資料完整度及適用條件。此評估不等同醫療診斷。
            </p>
            <div className="flex flex-wrap gap-4 md:justify-end">
              <Link href="/privacy">私隱政策</Link>
              <Link href="/terms">使用條款</Link>
              <Link href="/disclaimer">免責聲明</Link>
              <Link href="/contribution-policy">提交政策</Link>
              <Link href="/admin">管理</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
