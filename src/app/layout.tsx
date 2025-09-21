import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConditionalNavbar from '../../components/ConditionalNavbar'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataHub Ghana - Buy Data Bundles Online",
  description: "DataHub Ghana - Your trusted platform for purchasing MTN, Telecel, and AirtelTigo data bundles instantly. Best prices, instant delivery.",
  keywords: "data bundles, MTN data, Telecel data, AirtelTigo data, buy data online, Ghana data bundles, mobile data, internet bundles",
  authors: [{ name: "DataHub Ghana" }],
  openGraph: {
    title: "DataHub Ghana - Buy Data Bundles Online",
    description: "Purchase MTN, Telecel, and AirtelTigo data bundles instantly at the best prices",
    url: "https://datahubgh.com",
    siteName: "DataHub Ghana",
    type: "website",
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "DataHub Ghana - Buy Data Bundles Online",
    description: "Purchase MTN, Telecel, and AirtelTigo data bundles instantly at the best prices",
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#0066CC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConditionalNavbar />
        {children}
      </body>
    </html>
  );
}