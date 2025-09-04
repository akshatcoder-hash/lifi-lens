"use client"

import { motion } from 'framer-motion'
import { 
  Zap, 
  Github, 
  Twitter, 
  MessageCircle, 
  ExternalLink, 
  Mail,
  Globe,
  FileText,
  Activity,
  Shield,
  Heart,
  Keyboard,
  Clock
} from 'lucide-react'
import { cn } from '@/lib/utils'

const footerSections = [
  {
    title: 'LI.FI',
    links: [
      { label: 'Official Website', href: 'https://li.fi', icon: Globe, external: true },
      { label: 'Status Monitor', href: 'https://status.li.fi', icon: Activity, external: true },
      { label: 'REST API', href: 'https://apidocs.li.fi', icon: Globe, external: true },
      { label: 'SDK Documentation', href: 'https://docs.li.fi', icon: FileText, external: true }
    ]
  },
  {
    title: 'Project',
    links: [
      { label: 'GitHub Repository', href: 'https://github.com/akshatcoder-hash/lifi-lens', icon: Github, external: true },
      { label: 'Report Issues', href: 'https://github.com/akshatcoder-hash/lifi-lens/issues', icon: Shield, external: true }
    ]
  },
  {
    title: 'Community',
    links: [
      { label: 'Discord', href: 'https://discord.gg/lifi', icon: MessageCircle, external: true },
      { label: 'LI.FI Twitter', href: 'https://twitter.com/lifiprotocol', icon: Twitter, external: true },
      { label: 'Developer Twitter', href: 'https://twitter.com/akshatwts', icon: Twitter, external: true }
    ]
  }
]

const keyboardShortcuts = [
  { keys: ['⌘', 'K'], description: 'Open command palette' },
  { keys: ['⌘', 'V'], description: 'Paste transaction hash' },
  { keys: ['⌘', 'E'], description: 'Export analysis' },
  { keys: ['⌘', '/'], description: 'Show shortcuts' },
  { keys: ['Esc'], description: 'Close modals' }
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  const buildTime = new Date().toLocaleString()

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <motion.div 
              className="flex items-center gap-2 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LiFi Lens
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Advanced Debugging Tool
                </p>
              </div>
            </motion.div>
            
            <motion.p 
              className="text-sm text-gray-600 dark:text-gray-400 mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              Professional cross-chain transaction analysis and debugging toolkit 
              for developers building with LI.FI infrastructure.
            </motion.p>

            {/* Build Info */}
            <motion.div 
              className="text-xs text-gray-500 dark:text-gray-400 space-y-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div>Version: 0.1.0</div>
              <div>Last updated: {buildTime}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
            </motion.div>
          </div>

          {/* Links Sections */}
          {footerSections.map((section, sectionIndex) => (
            <motion.div 
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * (sectionIndex + 1) }}
            >
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => {
                  const Icon = link.icon
                  return (
                    <li key={link.label}>
                      <motion.a
                        href={link.href}
                        target={link.external ? '_blank' : undefined}
                        rel={link.external ? 'noopener noreferrer' : undefined}
                        className="group flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200"
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="h-4 w-4 opacity-60 group-hover:opacity-100 transition-opacity duration-200" />
                        <span>{link.label}</span>
                        {link.external && (
                          <ExternalLink className="h-3 w-3 opacity-40 group-hover:opacity-70 transition-opacity duration-200" />
                        )}
                      </motion.a>
                    </li>
                  )
                })}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Keyboard Shortcuts Section */}
        <motion.div 
          className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="h-4 w-4 text-gray-500" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts
            </h4>
          </div>
          <div className="flex flex-wrap gap-4">
            {keyboardShortcuts.map((shortcut, index) => (
              <motion.div 
                key={index}
                className="flex items-center gap-2 text-xs"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 * index }}
              >
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, keyIndex) => (
                    <kbd 
                      key={keyIndex}
                      className="inline-flex items-center justify-center h-5 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded"
                    >
                      {key}
                    </kbd>
                  ))}
                </div>
                <span className="text-gray-600 dark:text-gray-400">
                  {shortcut.description}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div 
          className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          {/* Social Links */}
          <div className="flex items-center gap-2">
            <motion.a
              href="https://github.com/akshatcoder-hash/lifi-lens"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="h-4 w-4" />
            </motion.a>
            <motion.a
              href="https://twitter.com/akshatwts"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Twitter className="h-4 w-4" />
            </motion.a>
            <motion.a
              href="https://discord.gg/lifi"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MessageCircle className="h-4 w-4" />
            </motion.a>
          </div>

          {/* Made with Love */}
          <div className="text-center text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center justify-center gap-1">
              <span>Built with</span>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
              >
                <Heart className="h-3 w-3 text-red-500 fill-current" />
              </motion.div>
              <span>for the LiFi community</span>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
