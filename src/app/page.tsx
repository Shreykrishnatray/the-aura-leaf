"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/menu?table=T12");
  }, [router]);
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-2 border-forest border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Setting up your table...</p>
      </div>
    </div>
  );
}
