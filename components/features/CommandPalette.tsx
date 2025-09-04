"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command } from 'cmdk'
import { 
  Search, 
  Hash, 
  Zap, 
  FileText, 
  Settings, 
  Download, 
  Share2, 
  Keyboard,
  Monitor,
  Github,
  ExternalLink,
  Clock,
  Activity
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTransaction?: (txHash: string) => void
  onOpenExport?: () => void
}

const commands = [
  {
    group: 'Actions',
    items: [
      {
        id: 'analyze-transaction',
        title: 'Analyze Transaction',
        description: 'Enter transaction hash to analyze',
        icon: Zap,
        shortcut: ['⌘', 'A'],
        action: 'analyze'
      },
      {
        id: 'export-report',
        title: 'Export Analysis Report',
        description: 'Download current analysis as PDF/JSON',
        icon: Download,
        shortcut: ['⌘', 'E'],
        action: 'export'
      },
      {
        id: 'share-analysis',
        title: 'Share Analysis',
        description: 'Generate shareable link',
        icon: Share2,
        shortcut: ['⌘', 'S'],
        action: 'share'
      },
    ]
  },
  {
    group: 'Navigation',
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        description: 'View analytics dashboard',
        icon: Activity,
        href: '#dashboard'
      },
      {
        id: 'docs',
        title: 'Documentation',
        description: 'View API documentation',
        icon: FileText,
        href: '#docs'
      },
      {
        id: 'settings',
        title: 'Settings',
        description: 'Application preferences',
        icon: Settings,
        href: '#settings'
      }
    ]
  },
  {
    group: 'External Links',
    items: [
      {
        id: 'lifi-status',
        title: 'LI.FI Status',
        description: 'Check service status',
        icon: Monitor,
        href: 'https://status.li.fi',
        external: true
      },
      {
        id: 'github',
        title: 'GitHub Repository',
        description: 'View source code',
        icon: Github,
        href: 'https://github.com/lifinance/lifi-lens',
        external: true
      }
    ]
  }
]

const recentTransactions = [
  '0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f',
  '0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c'
]

export function CommandPalette({ open, onOpenChange, onSelectTransaction, onOpenExport }: CommandPaletteProps) {
  const [search, setSearch] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const handleCommandSelect = (command: any) => {
    if (command.action === 'analyze') {
      // Focus on transaction input
      onOpenChange(false)
      const input = document.querySelector('input[placeholder*="transaction"]') as HTMLInputElement
      if (input) {
        input.focus()
      }
    } else if (command.action === 'export') {
      // Open export dialog
      onOpenChange(false)
      if (onOpenExport) {
        onOpenExport()
      }
    } else if (command.href) {
      if (command.external) {
        window.open(command.href, '_blank')
      } else {
        window.location.hash = command.href
      }
      onOpenChange(false)
    }
  }

  const handleRecentTransaction = (txHash: string) => {
    if (onSelectTransaction) {
      onSelectTransaction(txHash)
    }
    onOpenChange(false)
  }

  const isTransactionHash = (value: string) => {
    return /^0x[a-fA-F0-9]{64}$/.test(value.trim())
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Command Palette */}
          <motion.div
            className="fixed top-[20vh] left-1/2 -translate-x-1/2 w-full max-w-2xl mx-4 z-50"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <Command className="w-full">
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-800">
                  <Search className="h-5 w-5 text-gray-400" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search for commands, paste transaction hash..."
                    className="flex-1 bg-transparent border-0 outline-0 text-gray-900 dark:text-gray-100 placeholder:text-gray-500"
                  />
                  <div className="flex items-center gap-1">
                    <kbd className="px-2 py-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded border">
                      Esc
                    </kbd>
                  </div>
                </div>

                <Command.List className="max-h-96 overflow-y-auto">
                  <Command.Empty className="py-8 text-center text-gray-500 dark:text-gray-400">
                    No results found.
                  </Command.Empty>

                  {/* Transaction Hash Detection */}
                  {isTransactionHash(search) && (
                    <Command.Group heading="Transaction Hash Detected">
                      <Command.Item
                        onSelect={() => handleRecentTransaction(search)}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                          <Hash className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            Analyze This Transaction
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-mono truncate">
                            {search}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          Enter
                        </div>
                      </Command.Item>
                    </Command.Group>
                  )}

                  {/* Recent Transactions */}
                  {recentTransactions.length > 0 && search.length === 0 && (
                    <Command.Group heading="Recent Transactions">
                      {recentTransactions.map((txHash) => (
                        <Command.Item
                          key={txHash}
                          onSelect={() => handleRecentTransaction(txHash)}
                          className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                        >
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                            <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-100 font-mono text-sm truncate">
                              {txHash}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Recently analyzed
                            </div>
                          </div>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Command Groups */}
                  {commands.map((group) => (
                    <Command.Group key={group.group} heading={group.group}>
                      {group.items.map((command) => {
                        const Icon = command.icon
                        return (
                          <Command.Item
                            key={command.id}
                            onSelect={() => handleCommandSelect(command)}
                            className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                          >
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                              <Icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {command.title}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {command.description}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {'shortcut' in command && command.shortcut && (
                                <div className="flex items-center gap-1">
                                  {command.shortcut.map((key: string, index: number) => (
                                    <kbd 
                                      key={index}
                                      className="px-1.5 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded border"
                                    >
                                      {key}
                                    </kbd>
                                  ))}
                                </div>
                              )}
                              {'external' in command && command.external && (
                                <ExternalLink className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </Command.Item>
                        )
                      })}
                    </Command.Group>
                  ))}
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between p-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded border">
                        ↑↓
                      </kbd>
                      <span>Navigate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded border">
                        Enter
                      </kbd>
                      <span>Select</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 font-mono bg-gray-100 dark:bg-gray-700 rounded border">
                        Esc
                      </kbd>
                      <span>Close</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Keyboard className="h-3 w-3" />
                    <span>Command Palette</span>
                  </div>
                </div>
              </Command>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
