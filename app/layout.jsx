import "./globals.css";

export const metadata = {
  title: "Agent Based Service System",
  description: "Agent Based Service System - Super Admin Dashboard",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PwaRegister from "@/components/PwaRegister";
import BottomNav from "@/components/BottomNav";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className="antialiased"
      >
        {children}
        <BottomNav />
        <PwaRegister />
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}


