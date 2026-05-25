import { Suspense } from "react";
import AdminUsersClient from "./AdminUsersClient";

export default function AdminUsersPage() {
  return (
    <Suspense>
      <AdminUsersClient />
    </Suspense>
  );
}
