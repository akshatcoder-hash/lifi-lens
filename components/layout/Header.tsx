"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Menu, 
  X, 
  Github, 
  ExternalLink, 
  Zap, 
  Monitor, 
  Moon, 
  Sun,
  Command,
  Activity,
  FileText,
  Settings
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onOpenCommandPalette?: () => void
}

const navigationItems = [
  { 
    label: 'Analyze', 
    href: '#analyze', 
    icon: Zap,
    description: 'Debug transactions' 
  },
  { 
    label: 'Dashboard', 
    href: '#dashboard', 
    icon: Activity,
    description: 'Analytics & insights' 
  },
  { 
    label: 'Docs', 
    href: '#docs', 
    icon: FileText,
    description: 'API documentation' 
  },
  { 
    label: 'API Status', 
    href: 'https://status.li.fi', 
    icon: Monitor,
    description: 'LI.FI service status',
    external: true 
  }
]

export function Header({ onOpenCommandPalette }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline'>('online')

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen)

  return (
    <motion.header 
      className="sticky top-0 z-50 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-lifi-primary to-lifi-accent rounded-xl">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-lifi-primary via-lifi-accent to-lifi-secondary bg-clip-text text-transparent">
                  LiFi Lens
                </h1>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>v2.1.0</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className="group relative flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                  {item.external && (
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  )}
                  
                  {/* Tooltip */}
                  <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                    {item.description}
                  </div>
                </motion.a>
              )
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Command Palette */}
            <motion.button
              onClick={onOpenCommandPalette}
              data-tour="command-palette"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground bg-card hover:bg-accent rounded-lg transition-all duration-200 border border-border hover:border-lifi-primary/50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Command className="h-4 w-4" />
              <span>Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </motion.button>

            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              data-tour="theme-toggle"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 border border-transparent hover:border-border"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </motion.button>

            {/* GitHub Link */}
            <motion.a
              href="https://github.com/akshatcoder-hash/lifi-lens"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-muted-foreground hover:text-lifi-primary hover:bg-accent rounded-lg transition-all duration-200 border border-transparent hover:border-lifi-primary/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="h-4 w-4" />
            </motion.a>

            {/* Settings */}
            <motion.button
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200 border border-transparent hover:border-border"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Settings className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </motion.button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-gray-200 dark:border-gray-800"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target={item.external ? '_blank' : undefined}
                    rel={item.external ? 'noopener noreferrer' : undefined}
                    className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    </div>
                    {item.external && (
                      <ExternalLink className="h-3 w-3 opacity-50 ml-auto" />
                    )}
                  </a>
                )
              })}

              <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Theme
                  </span>
                  <button
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all duration-200"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
