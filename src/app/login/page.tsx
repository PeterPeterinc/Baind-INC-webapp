"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[--background] px-4 text-[#1f1a12]">
      Doorsturen naar de app...
    </div>
  );
}

