import { prisma } from "@/lib/prisma";
import { isInstagramConfigured } from "@/lib/instagram/client";
import { serializeImport } from "@/lib/instagram/sync";
import { InstagramManager } from "@/components/admin/instagram-manager";

export const dynamic = "force-dynamic";

const CATEGORY_OPTIONS = [
  { slug: "skincare", label: "Skincare" },
  { slug: "haircare", label: "Haircare" },
  { slug: "perfumes", label: "Perfumes" },
  { slug: "accessories", label: "Accessories" },
  { slug: "bags", label: "Bags" },
];

export default async function AdminInstagramPage({
  searchParams,
}: {
  searchParams: { ig_connected?: string; ig_error?: string };
}) {
  const [connection, imports] = await Promise.all([
    prisma.instagramConnection.findUnique({ where: { id: "instagram" } }),
    prisma.instagramImport.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <InstagramManager
      configured={isInstagramConfigured()}
      connectedNotice={searchParams.ig_connected === "1"}
      errorNotice={searchParams.ig_error || null}
      connection={
        connection
          ? {
              isConnected: connection.isConnected,
              username: connection.username,
              lastSyncAt: connection.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
              lastSyncStatus: connection.lastSyncStatus,
              lastSyncError: connection.lastSyncError,
            }
          : null
      }
      imports={imports.map(serializeImport)}
      categoryOptions={CATEGORY_OPTIONS}
    />
  );
}
