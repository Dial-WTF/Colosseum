import { DashboardLayout } from "~/layout/dashboard-layout";

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
