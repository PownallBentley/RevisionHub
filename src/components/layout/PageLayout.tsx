// src/components/layout/PageLayout.tsx

import { ReactNode } from "react";
import Footer from "./Footer";

interface PageLayoutProps {
  children: ReactNode;
  /** Set to true to hide the footer (e.g., for modals or special pages) */
  hideFooter?: boolean;
  /** Custom background color class, defaults to bg-neutral-100 */
  bgColor?: string;
}

/**
 * Standard page layout wrapper with footer
 * Use this to wrap page content to get consistent footer across the app
 */
export default function PageLayout({ 
  children, 
  hideFooter = false,
  bgColor = "bg-neutral-100"
}: PageLayoutProps) {
  return (
    <div className={`min-h-[calc(100vh-73px)] flex flex-col ${bgColor}`}>
      <div className="flex-1">
        {children}
      </div>
      {!hideFooter && <Footer />}
    </div>
  );
}