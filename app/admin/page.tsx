"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser } from "@/actions/auth";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    getAuthUser().then((user) => {
      if (user?.is_admin) {
        router.replace("/admin/rifas");
      } else {
        router.replace("/login");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Redirigiendo...</p>
    </div>
  );
}
