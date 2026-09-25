import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sunzen 沙盘",
  description: "Sunzen Group sandbox planning & tracking system",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
