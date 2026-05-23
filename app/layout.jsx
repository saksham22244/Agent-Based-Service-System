import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Agent Based Service System",
  description: "Agent Based Service System - Super Admin Dashboard",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
};

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PwaRegister from "@/components/PwaRegister";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaRegister />
        <ToastContainer position="top-right" autoClose={3000} />
      </body>
    </html>
  );
}


