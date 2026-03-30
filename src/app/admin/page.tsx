import type { Route } from "next";
import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  redirect("/admin/urns" as Route);
}
