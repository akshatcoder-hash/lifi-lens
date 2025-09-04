"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { CommandPalette } from "@/components/features/CommandPalette"
import { ExportDialog } from "@/components/features/ExportDialog"
import { OnboardingTour } from "@/components/features/OnboardingTour"
import { TransactionInput } from "@/components/TransactionInput"
import { TransactionDetails } from "@/components/TransactionDetails"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { PageTransition } from "@/components/common/LoadingStates"
import { TerminalDemo } from "@/components/TerminalDemo"
import { NetworkStatusBar } from "@/components/NetworkStatusBar"

export default function Home() {
  const [selectedTxHash, setSelectedTxHash] = useState<string | null>(null)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const handleSelectTransaction = (txHash: string) => {
    setSelectedTxHash(txHash)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onOpenCommandPalette={() => setCommandPaletteOpen(true)} />

      <PageTransition>
        <main className="flex-1">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-7xl mx-auto">
              {/* Hero Section - Asymmetric Layout */}
              <motion.section
                className="mb-16"
                data-tour="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[600px]">
                  {/* Left Side - Content */}
                  <motion.div
                    className="space-y-8"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <div className="space-y-6">
                      <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        <span className="bg-gradient-to-r from-lifi-primary via-lifi-accent to-lifi-secondary bg-clip-text text-transparent">
                          Stop guessing
                        </span>
                        <br />
                        <span className="text-foreground">
                          why your LI.FI transactions fail
                        </span>
                      </h1>

                      <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                        Professional transaction debugging with real-time analysis, comprehensive error detection, and actionable insights for cross-chain operations.
                      </p>
                    </div>

                    {/* Network Support Badges */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
                        <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Ξ</span>
                        </div>
                        <span className="text-sm font-medium">Ethereum</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
                        <div className="w-5 h-5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">A</span>
                        </div>
                        <span className="text-sm font-medium">Arbitrum</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
                        <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">♦</span>
                        </div>
                        <span className="text-sm font-medium">Polygon</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg">
                        <div className="w-5 h-5 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">O</span>
                        </div>
                        <span className="text-sm font-medium">Optimism</span>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      <motion.button
                        className="px-6 py-3 bg-lifi-primary text-white rounded-lg font-medium hover:bg-lifi-primary/90 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          document.querySelector('[data-tour="search-input"]')?.scrollIntoView({ behavior: 'smooth' })
                        }}
                      >
                        Start Debugging
                      </motion.button>
                      <motion.button
                        className="px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-accent transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.open('https://docs.li.fi', '_blank')}
                      >
                        View Documentation
                      </motion.button>
                    </div>

                  </motion.div>

                  {/* Right Side - Terminal Demo */}
                  <motion.div
                    className="relative"
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <div className="relative">
                      {/* Floating Animation Effects */}
                      <motion.div
                        className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-r from-lifi-primary/20 to-lifi-accent/20 rounded-full blur-xl"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          repeatType: "reverse",
                        }}
                      />
                      <motion.div
                        className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-lifi-secondary/20 to-lifi-primary/20 rounded-full blur-xl"
                        animate={{
                          scale: [1.2, 1, 1.2],
                          opacity: [0.4, 0.8, 0.4],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          delay: 1,
                        }}
                      />
                      
                      <TerminalDemo />
                    </div>
                  </motion.div>
                </div>

                {/* Network Status Section */}
                <motion.div
                  className="mt-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <NetworkStatusBar />
                </motion.div>
              </motion.section>

              <ErrorBoundary>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <div data-tour="search-input">
                    <TransactionInput onSelectTransaction={handleSelectTransaction} />
                  </div>
                </motion.div>

                {selectedTxHash && (
                  <motion.div
                    className="mt-12"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <TransactionDetails txHash={selectedTxHash} />
                  </motion.div>
                )}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </PageTransition>

      <Footer />

      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onSelectTransaction={handleSelectTransaction}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        txHash={selectedTxHash || undefined}
      />

      <OnboardingTour />
    </div>
  )
}
