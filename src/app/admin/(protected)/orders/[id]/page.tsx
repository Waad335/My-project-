import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEGP, toNumber } from "@/lib/utils";
import { OrderStatusUpdater } from "@/components/admin/order-status-updater";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { customer: true, items: true, payments: true, promoCode: true },
  });
  if (!order) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-2xl text-mocha-700">Order {order.orderNumber}</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="card-surface p-5">
            <h2 className="mb-4 font-heading text-lg text-mocha-700">Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-mocha-700/10 text-start text-mocha-400">
                  <th className="py-2 text-start font-medium">Product</th>
                  <th className="py-2 text-start font-medium">SKU</th>
                  <th className="py-2 text-start font-medium">Qty</th>
                  <th className="py-2 text-end font-medium">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-mocha-700/5 last:border-0">
                    <td className="py-2 text-mocha-700">
                      {item.nameEnSnapshot}
                      {item.variantLabel && <span className="text-mocha-400"> ({item.variantLabel})</span>}
                    </td>
                    <td className="py-2 text-mocha-500">{item.skuSnapshot}</td>
                    <td className="py-2 text-mocha-600">{item.quantity}</td>
                    <td className="py-2 text-end text-mocha-700">{formatEGP(toNumber(item.lineTotal))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-1.5 border-t border-mocha-700/10 pt-4 text-sm">
              <div className="flex justify-between text-mocha-500">
                <span>Subtotal</span>
                <span>{formatEGP(toNumber(order.subtotal))}</span>
              </div>
              {toNumber(order.discountAmount) > 0 && (
                <div className="flex justify-between text-gold-600">
                  <span>Discount {order.promoCode ? `(${order.promoCode.code})` : ""}</span>
                  <span>−{formatEGP(toNumber(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-mocha-500">
                <span>Shipping</span>
                <span>{formatEGP(toNumber(order.shippingFee))}</span>
              </div>
              <div className="flex justify-between border-t border-mocha-700/10 pt-2 text-base font-semibold text-mocha-700">
                <span>Total</span>
                <span>{formatEGP(toNumber(order.total))}</span>
              </div>
            </div>
          </section>

          <section className="card-surface p-5">
            <h2 className="mb-4 font-heading text-lg text-mocha-700">Customer &amp; Delivery</h2>
            <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <Info label="Name" value={order.customer.name} />
              <Info label="Phone" value={order.customer.phone} />
              <Info label="WhatsApp" value={order.customer.whatsapp || order.customer.phone} />
              <Info label="Email" value={order.customer.email || "—"} />
              <Info label="Governorate" value={order.shippingGovernorate} />
              <Info label="City / Area" value={order.shippingCity} />
              <Info label="Address" value={order.shippingAddress} className="sm:col-span-2" />
              <Info label="Building/Floor/Apt" value={order.shippingBuildingInfo || "—"} />
              <Info label="Shipping Method" value={order.shippingMethodLabel} />
              <Info label="Customer Notes" value={order.customerNotes || "—"} className="sm:col-span-2" />
            </dl>
          </section>

          {order.payments.length > 0 && (
            <section className="card-surface p-5">
              <h2 className="mb-4 font-heading text-lg text-mocha-700">Payments</h2>
              <div className="flex flex-col gap-2 text-sm">
                {order.payments.map((p) => (
                  <div key={p.id} className="flex justify-between border-b border-mocha-700/5 py-1.5 last:border-0">
                    <span className="text-mocha-500">
                      {p.provider} · {p.providerReference || "—"}
                    </span>
                    <span className="text-mocha-700">
                      {formatEGP(toNumber(p.amount))} · {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="card-surface h-fit p-5">
          <h2 className="mb-4 font-heading text-lg text-mocha-700">Status</h2>
          <OrderStatusUpdater orderId={order.id} currentStatus={order.status} internalNotes={order.internalNotes || ""} />
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs text-mocha-400">{label}</dt>
      <dd className="text-mocha-700">{value}</dd>
    </div>
  );
}
