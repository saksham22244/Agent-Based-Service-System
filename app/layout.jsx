import "./globals.css";

// App information
export const metadata = {
  title: "Agent Based Service System",
  description: "Agent Based Service System - Super Admin Dashboard",
  manifest: "/manifest.json", // PWA manifest file
};

// Screen settings
export const viewport = {
  themeColor: "#000000", //themeColor is used by the browser, not by your website pages.
  width: "device-width",
  initialScale: 1,  //initial zoom 100%
  maximumScale: 1,  //prevent beyond zoom 100%
};

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PwaRegister from "@/components/PwaRegister";
import BottomNav from "@/components/BottomNav";

// Main layout for all pages
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="antialiased">
        {children} {/* Page content */}
        <BottomNav /> {/* Bottom menu */}
        <PwaRegister /> {/* PWA setup */}
        <ToastContainer position="top-right" autoClose={2000} /> {/* Notifications */}
      </body>
    </html>
  );
}