import { Suspense } from "react";
import AdminDashboardClient from "./AdminDashboardClient";

export default function AdminPage() {
  return (
    <Suspense>
      <AdminDashboardClient />
    </Suspense>
  );
}
