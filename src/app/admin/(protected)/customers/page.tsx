import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";
import { requireAdminPage } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

const TABS = [
  { id: "buyers", label: "Buyers" },
  { id: "accounts", label: "Accounts" },
  { id: "newsletter", label: "Newsletter" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default async function AdminCustomersPage({ searchParams }: { searchParams: { tab?: string; q?: string } }) {
  await requireAdminPage("customers.view");
  const tab: Tab = TABS.some((t) => t.id === searchParams.tab) ? (searchParams.tab as Tab) : "buyers";
  const q = (searchParams.q ?? "").trim().slice(0, 80);
  const dateFmt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Customers</h1>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin/customers?tab=${t.id}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium ${tab === t.id ? "border-mocha-700 bg-mocha-700 text-ivory" : "border-mocha-700/15 text-mocha-600"}`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        <form className="flex gap-2">
          <input type="hidden" name="tab" value={tab} />
          <label htmlFor="customer-search" className="sr-only">
            Search customers
          </label>
          <input id="customer-search" name="q" defaultValue={q} placeholder="Search name, email or phone" className="input-field w-64 py-2" />
          <button className="btn-secondary py-2">Search</button>
        </form>
      </div>

      {tab === "buyers" && <Buyers q={q} dateFmt={dateFmt} />}
      {tab === "accounts" && <Accounts q={q} dateFmt={dateFmt} />}
      {tab === "newsletter" && <Newsletter q={q} dateFmt={dateFmt} />}
    </div>
  );
}

// Everyone who has checked out, grouped by phone number (the checkout stores
// contact details per order).
async function Buyers({ q, dateFmt }: { q: string; dateFmt: Intl.DateTimeFormat }) {
  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { orders: { select: { id: true, total: true, paymentStatus: true, createdAt: true, userId: true } } },
  });

  const byPhone = new Map<
    string,
    { name: string; phone: string; email: string | null; governorate: string; orders: number; spent: number; last: Date; hasAccount: boolean }
  >();
  for (const c of customers) {
    const entry = byPhone.get(c.phone) ?? {
      name: c.name,
      phone: c.phone,
      email: c.email,
      governorate: c.governorate,
      orders: 0,
      spent: 0,
      last: c.createdAt,
      hasAccount: false,
    };
    for (const o of c.orders) {
      entry.orders += 1;
      entry.spent += toNumber(o.total);
      if (o.createdAt > entry.last) entry.last = o.createdAt;
      if (o.userId) entry.hasAccount = true;
    }
    if (!entry.email && c.email) entry.email = c.email;
    byPhone.set(c.phone, entry);
  }
  const rows = Array.from(byPhone.values()).sort((a, b) => b.last.getTime() - a.last.getTime());

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mocha-700/10 text-mocha-400">
            <th className="px-5 py-3 text-start font-medium">Name</th>
            <th className="px-5 py-3 text-start font-medium">Phone</th>
            <th className="px-5 py-3 text-start font-medium">Email</th>
            <th className="px-5 py-3 text-start font-medium">Governorate</th>
            <th className="px-5 py-3 text-end font-medium">Orders</th>
            <th className="px-5 py-3 text-end font-medium">Order value</th>
            <th className="px-5 py-3 text-start font-medium">Last order</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.phone} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
              <td className="px-5 py-3 font-medium text-mocha-700">
                {r.name}
                {r.hasAccount && <span className="ms-2 rounded-full bg-blush-50 px-2 py-0.5 text-[10px] text-blush-600">Account</span>}
              </td>
              <td className="px-5 py-3 text-mocha-600" dir="ltr">
                {r.phone}
              </td>
              <td className="px-5 py-3 text-mocha-600">{r.email ?? "—"}</td>
              <td className="px-5 py-3 text-mocha-600">{r.governorate}</td>
              <td className="px-5 py-3 text-end text-mocha-700">{r.orders}</td>
              <td className="px-5 py-3 text-end text-mocha-700">{formatEGP(r.spent)}</td>
              <td className="px-5 py-3 text-mocha-600">{dateFmt.format(r.last)}</td>
            </tr>
          ))}
          {rows.length === 0 && <EmptyRow cols={7} />}
        </tbody>
      </table>
    </div>
  );
}

async function Accounts({ q, dateFmt }: { q: string; dateFmt: Intl.DateTimeFormat }) {
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      orders: { select: { total: true } },
      _count: { select: { wishlistItems: true } },
    },
  });

  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mocha-700/10 text-mocha-400">
            <th className="px-5 py-3 text-start font-medium">Name</th>
            <th className="px-5 py-3 text-start font-medium">Email</th>
            <th className="px-5 py-3 text-start font-medium">Phone</th>
            <th className="px-5 py-3 text-end font-medium">Orders</th>
            <th className="px-5 py-3 text-end font-medium">Order value</th>
            <th className="px-5 py-3 text-end font-medium">Wishlist</th>
            <th className="px-5 py-3 text-start font-medium">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
              <td className="px-5 py-3 font-medium text-mocha-700">{u.name}</td>
              <td className="px-5 py-3 text-mocha-600">{u.email}</td>
              <td className="px-5 py-3 text-mocha-600" dir="ltr">
                {u.phone ?? "—"}
              </td>
              <td className="px-5 py-3 text-end text-mocha-700">{u.orders.length}</td>
              <td className="px-5 py-3 text-end text-mocha-700">
                {formatEGP(u.orders.reduce((sum, o) => sum + toNumber(o.total), 0))}
              </td>
              <td className="px-5 py-3 text-end text-mocha-700">{u._count.wishlistItems}</td>
              <td className="px-5 py-3 text-mocha-600">{dateFmt.format(u.createdAt)}</td>
            </tr>
          ))}
          {users.length === 0 && <EmptyRow cols={7} />}
        </tbody>
      </table>
    </div>
  );
}

async function Newsletter({ q, dateFmt }: { q: string; dateFmt: Intl.DateTimeFormat }) {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: q ? { email: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  return (
    <div className="card-surface overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-mocha-700/10 text-mocha-400">
            <th className="px-5 py-3 text-start font-medium">Email</th>
            <th className="px-5 py-3 text-start font-medium">Language</th>
            <th className="px-5 py-3 text-start font-medium">Subscribed</th>
          </tr>
        </thead>
        <tbody>
          {subscribers.map((s) => (
            <tr key={s.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
              <td className="px-5 py-3 text-mocha-700">{s.email}</td>
              <td className="px-5 py-3 uppercase text-mocha-600">{s.locale}</td>
              <td className="px-5 py-3 text-mocha-600">{dateFmt.format(s.createdAt)}</td>
            </tr>
          ))}
          {subscribers.length === 0 && <EmptyRow cols={3} />}
        </tbody>
      </table>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-10 text-center text-mocha-400">
        Nothing here yet.
      </td>
    </tr>
  );
}
