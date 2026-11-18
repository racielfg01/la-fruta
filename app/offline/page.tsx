import type { Metadata } from "next";
import { OfflineScreen } from "@/components/offline-screen";

export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineScreen />;
}
