import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const title = "卡卡省-美国卡派资讯&竞对动态监控网站";
const description = "工作日更新的美国卡车运输资讯、市场信号与竞对动态监控网站。";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host === "localhost" ? "http" : "https");
  const socialImage = new URL("/og.png", `${protocol}://${host}`).toString();

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      locale: "zh_CN",
      images: [{ url: socialImage, width: 1731, height: 909, alt: "卡卡省美国卡派资讯第010期" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
