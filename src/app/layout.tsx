import "@/app/globals.css";
import { Cormorant_Garamond, Lato } from "next/font/google";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const sans = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Aura Leaf — Digital Dining",
  description: "Scan. Savour. Stay. Experience table-side ordering at The Aura Leaf.",
  generator: "Next.js",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans text-sm antialiased">
        {children}
      </body>
    </html>
  );
}
