"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { ToastProvider } from "@/components/admin/Toast";

const sidebarItems = [
  { href: "/admin", label: "Dashboard", icon: "grid" },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar" },
  { href: "/admin/billing", label: "Billing", icon: "wallet" },
  { href: "/admin/customers", label: "Customers", icon: "users" },
  { href: "/admin/stock", label: "Stock", icon: "box" },
  { href: "/admin/staff", label: "Staff", icon: "staff" },
  { href: "/admin/reports", label: "Reports", icon: "chart" },
];

const bottomTabs = [
  { href: "/admin", label: "Home", icon: "grid", exact: true },
  { href: "/admin/bookings", label: "Bookings", icon: "calendar", exact: false },
  { href: "/admin/billing", label: "Billing", icon: "wallet", exact: false },
  { href: "/admin/customers", label: "Clients", icon: "users", exact: false },
];

const moreItems = [
  { href: "/admin/stock", label: "Stock", icon: "box" },
  { href: "/admin/staff", label: "Staff", icon: "staff" },
  { href: "/admin/reports", label: "Reports", icon: "chart" },
];

function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const icons: Record<string, React.ReactNode> = {
    grid: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>,
    calendar: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>,
    users: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    wallet: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>,
    box: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
    staff: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></svg>,
    chart: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
    more: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
    external: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>,
    logout: <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  };
  return <>{icons[name]}</> || null;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthenticated(true);
      return;
    }
    fetch("/api/auth")
      .then((r) => {
        if (!r.ok) {
          router.push("/admin/login");
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
          // Load pending booking count — only count unviewed ones
          fetch("/api/bookings?status=pending")
            .then((r) => r.json())
            .then((data) => {
              if (!Array.isArray(data)) return;
              const pendingIds: number[] = data.map((b: { id: number }) => b.id);
              let viewedIds: number[] = [];
              try { viewedIds = JSON.parse(localStorage.getItem("viewedBookingIds") || "[]"); } catch {}
              if (pathname === "/admin/bookings") {
                // Admin is looking at bookings — mark all as seen
                const merged = Array.from(new Set([...viewedIds, ...pendingIds]));
                localStorage.setItem("viewedBookingIds", JSON.stringify(merged));
                setPendingCount(0);
              } else {
                setPendingCount(pendingIds.filter((id) => !viewedIds.includes(id)).length);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        router.push("/admin/login");
        setAuthenticated(false);
      });
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <ToastProvider>{children}</ToastProvider>;
  }

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderWidth: 3 }} />
          <p className="text-sm text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  const currentLabel = sidebarItems.find((i) =>
    i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
  )?.label || "Admin";

  const isMoreActive = moreItems.some((i) => pathname.startsWith(i.href));

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F5F4F0] lg:flex">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#1C1C1C] text-white fixed inset-y-0 left-0 z-40">
          <div className="p-6 border-b border-white/10">
            <Link href="/admin" className="flex items-center gap-3">
              <Image src="/logo.jpeg" alt="Uzay" width={40} height={40} className="rounded-full ring-2 ring-gold/40" />
              <div>
                <span className="font-heading text-lg font-bold text-gold block leading-tight">Uzay Admin</span>
                <span className="text-xs text-gray-400">Beauty Hub</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-gold text-white shadow-sm"
                      : "text-gray-400 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  <Icon name={item.icon} className="w-4.5 h-4.5 flex-shrink-0" />
                  {item.label}
                  {item.label === "Bookings" && pendingCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10 space-y-0.5">
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/8 transition-all">
              <Icon name="external" className="w-4 h-4" />
              View Website
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all text-left">
              <Icon name="logout" className="w-4 h-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">

          {/* Top bar */}
          <header className="bg-[#1C1C1C] lg:bg-white sticky top-0 z-30 lg:border-b lg:border-gray-100 lg:shadow-sm">
            <div className="flex items-center justify-between px-4 h-14 lg:h-16 lg:px-6">
              {/* Mobile: logo left */}
              <Link href="/admin" className="lg:hidden flex items-center gap-2.5">
                <Image src="/logo.jpeg" alt="Uzay" width={32} height={32} className="rounded-full" />
                <span className="font-heading text-base font-bold text-gold">Uzay Admin</span>
              </Link>
              {/* Desktop: page title */}
              <h1 className="hidden lg:block text-lg font-semibold text-charcoal font-heading">{currentLabel}</h1>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Desktop date */}
                <span className="hidden lg:block text-sm text-gray-400">
                  {new Date().toLocaleDateString("en-PK", { weekday: "short", day: "numeric", month: "short" })}
                </span>
                {/* Mobile logout */}
                <button
                  onClick={handleLogout}
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-red-400 active:bg-white/10 transition-all"
                  aria-label="Logout"
                >
                  <Icon name="logout" className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Mobile page title bar */}
            <div className="lg:hidden bg-[#F5F4F0] px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{currentLabel}</p>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8 pb-28 lg:pb-8">
            {children}
          </main>
        </div>

        {/* ── Mobile bottom tab bar ── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          <div className="grid grid-cols-5 h-16">
            {bottomTabs.map((tab) => {
              const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    isActive ? "text-gold" : "text-gray-400"
                  }`}
                >
                  <div className="relative">
                    <Icon name={tab.icon} className="w-5 h-5" />
                    {tab.label === "Bookings" && pendingCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-bold px-1 py-px rounded-full min-w-[14px] text-center leading-none">
                        {pendingCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium leading-none ${isActive ? "text-gold" : "text-gray-400"}`}>
                    {tab.label}
                  </span>
                </Link>
              );
            })}
            {/* More tab */}
            <button
              onClick={() => setShowMore(true)}
              className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                isMoreActive ? "text-gold" : "text-gray-400"
              }`}
            >
              <Icon name="more" className="w-5 h-5" />
              <span className={`text-[10px] font-medium leading-none ${isMoreActive ? "text-gold" : "text-gray-400"}`}>More</span>
            </button>
          </div>
        </nav>

        {/* ── More sheet (mobile) ── */}
        {showMore && (
          <>
            <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={() => setShowMore(false)} />
            <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>
              <div className="px-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">More</p>
                <div className="space-y-1 mb-3">
                  {moreItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMore(false)}
                        className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                          isActive ? "bg-gold/10 text-gold" : "text-charcoal hover:bg-gray-50"
                        }`}
                      >
                        <span className={isActive ? "text-gold" : "text-gray-500"}>
                          <Icon name={item.icon} className="w-5 h-5" />
                        </span>
                        {item.label}
                        <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    );
                  })}
                </div>
                <div className="border-t border-gray-100 pt-3 mb-3 space-y-1">
                  <Link
                    href="/"
                    onClick={() => setShowMore(false)}
                    className="flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-charcoal hover:bg-gray-50"
                  >
                    <span className="text-gray-500"><Icon name="external" className="w-5 h-5" /></span>
                    View Website
                    <svg className="w-4 h-4 text-gray-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                  <button
                    onClick={() => { setShowMore(false); handleLogout(); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50"
                  >
                    <Icon name="logout" className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
              {/* Safe area spacer */}
              <div className="h-6" />
            </div>
          </>
        )}
      </div>
    </ToastProvider>
  );
}
