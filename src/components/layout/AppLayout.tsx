// src/components/layout/AppLayout.tsx

import AppHeader from "./AppHeader";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}