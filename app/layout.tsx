import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { Toaster } from "sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LiFi Lens - Advanced Cross-Chain Debugging Tool",
  description: "Professional debugging and analysis tool for LI.FI cross-chain transactions. Get detailed insights, error analysis, and performance metrics.",
  keywords: "LiFi, cross-chain, DeFi, debugging, transaction analysis, blockchain, Ethereum",
  authors: [{ name: "LI.FI Team" }],
  creator: "LI.FI",
  openGraph: {
    title: "LiFi Lens - Advanced Cross-Chain Debugging Tool",
    description: "Professional debugging and analysis tool for LI.FI cross-chain transactions.",
    url: "https://lens.li.fi",
    siteName: "LiFi Lens",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LiFi Lens - Debug Cross-Chain Transactions",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LiFi Lens - Advanced Cross-Chain Debugging Tool",
    description: "Professional debugging and analysis tool for LI.FI cross-chain transactions.",
    creator: "@lifiprotocol",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                className: "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800",
              }}
            />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
