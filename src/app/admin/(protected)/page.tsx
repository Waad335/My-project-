import Link from "next/link";
import { ShoppingCart, Clock, Banknote, AlertTriangle, Package, Users, Mail } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";
import { StatCard } from "@/components/admin/stat-card";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    totalOrders,
    pendingOrders,
    paidOrdersAgg,
    lowStockCount,
    activeProducts,
    totalProducts,
    accounts,
    guestPhones,
    subscribers,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "PAYMENT_PENDING"] } } }),
    prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
    // Products with "no fixed inventory" (trackStock = false) never count as low stock.
    prisma.product.count({ where: { isActive: true, trackStock: true, stock: { lt: 10 } } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count(),
    prisma.user.count(),
    // Checkout customers are stored per order, so count distinct phone numbers.
    prisma.customer.groupBy({ by: ["phone"] }).then((rows) => rows.length),
    prisma.newsletterSubscriber.count(),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { customer: true },
    }),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Orders" value={String(totalOrders)} icon={ShoppingCart} hint={`${pendingOrders} pending`} />
        <StatCard label="Revenue (Paid)" value={formatEGP(toNumber(paidOrdersAgg._sum.total))} icon={Banknote} />
        <StatCard label="Products" value={String(activeProducts)} icon={Package} hint={`${totalProducts} total · ${activeProducts} live`} />
        <StatCard label="Customers (buyers)" value={String(guestPhones)} icon={Users} hint={`${accounts} registered accounts`} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Orders" value={String(pendingOrders)} icon={Clock} tone={pendingOrders > 0 ? "warning" : "default"} />
        <StatCard label="Low Stock Products" value={String(lowStockCount)} icon={AlertTriangle} tone={lowStockCount > 0 ? "warning" : "default"} />
        <StatCard label="Newsletter Subscribers" value={String(subscribers)} icon={Mail} />
      </div>

      <div className="card-surface mt-8 overflow-x-auto">
        <div className="flex items-center justify-between border-b border-mocha-700/10 p-5">
          <h2 className="font-heading text-lg text-mocha-700">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-gold-600 hover:underline">
            View all
          </Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-5 py-3 text-start font-medium">Order</th>
              <th className="px-5 py-3 text-start font-medium">Customer</th>
              <th className="px-5 py-3 text-start font-medium">Status</th>
              <th className="px-5 py-3 text-start font-medium">Payment</th>
              <th className="px-5 py-3 text-end font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
                <td className="px-5 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-mocha-700 hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-5 py-3 text-mocha-600">{order.customer.name}</td>
                <td className="px-5 py-3 text-mocha-600">{order.status}</td>
                <td className="px-5 py-3 text-mocha-600">{order.paymentStatus}</td>
                <td className="px-5 py-3 text-end font-medium text-mocha-700">{formatEGP(toNumber(order.total))}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mocha-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
