// src/components/layout/AppLayout.tsx

import type { ReactNode } from "react";
import AppHeader from "./AppHeader";

type Props = {
  children: ReactNode;
};

export default function AppLayout({ children }: Props) {
  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}