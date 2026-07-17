import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "卡卡省-美国卡派资讯&竞对动态监控网站",
  description: "工作日更新的美国卡车运输资讯、市场信号与竞对动态监控网站。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
