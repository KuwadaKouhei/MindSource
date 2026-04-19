import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toaster";

export const metadata: Metadata = {
  title: "MindSource",
  description: "連想語をつなげていくマインドマップ作成アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
