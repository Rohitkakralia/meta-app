"use client";

import { Suspense } from "react";
import ErrorContent from "./ErrorContent";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-white p-6">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}