import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES = [
  "PENDING",
  "PAYMENT_PENDING",
  "PAID",
  "PREPARING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED_REFUNDED",
];

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const orders = await prisma.order.findMany({
    where: searchParams.status ? { status: searchParams.status as never } : undefined,
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${!searchParams.status ? "border-mocha-700 bg-mocha-700 text-ivory" : "border-mocha-700/15 text-mocha-600"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${searchParams.status === s ? "border-mocha-700 bg-mocha-700 text-ivory" : "border-mocha-700/15 text-mocha-600"}`}
          >
            {s.replace(/_/g, " ")}
          </Link>
        ))}
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
              <th className="px-4 py-3 text-start font-medium">Order</th>
              <th className="px-4 py-3 text-start font-medium">Customer</th>
              <th className="px-4 py-3 text-start font-medium">Governorate</th>
              <th className="px-4 py-3 text-start font-medium">Status</th>
              <th className="px-4 py-3 text-start font-medium">Payment</th>
              <th className="px-4 py-3 text-start font-medium">Date</th>
              <th className="px-4 py-3 text-end font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-mocha-700/5 last:border-0 hover:bg-ivory-100">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${order.id}`} className="font-medium text-mocha-700 hover:underline">
                    {order.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3 text-mocha-600">{order.customer.name}</td>
                <td className="px-4 py-3 text-mocha-600">{order.shippingGovernorate}</td>
                <td className="px-4 py-3 text-mocha-600">{order.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-3 text-mocha-600">{order.paymentStatus}</td>
                <td className="px-4 py-3 text-mocha-500">{order.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3 text-end font-medium text-mocha-700">{formatEGP(toNumber(order.total))}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-mocha-400">
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
