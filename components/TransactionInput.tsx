"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, Hash, Loader2, Clipboard, CheckCircle2, AlertCircle, Copy, ChevronDown, ChevronUp, Zap, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionInputProps {
  onSelectTransaction: (txHash: string) => void
}

interface ValidationResult {
  isValid: boolean
  type: 'ethereum' | 'lifi' | 'invalid'
  message: string
}

const EXAMPLE_TRANSACTIONS = [
  {
    hash: '0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f',
    type: 'Ethereum Transaction Hash',
    description: 'Standard Ethereum transaction'
  },
  {
    hash: '0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c',
    type: 'LI.FI Transaction ID',
    description: 'LI.FI cross-chain transfer ID'
  }
]

const PLACEHOLDER_MESSAGES = [
  "$ debug 0x32a4b9d9cdec66b28e660ce116fe910aa058345604334e5f560034f51ef5327c",
  "$ analyze 0xe1ffdcf09d5aa92a2d89b1b39db3f8cadf09428a296cce0d5e387595ac83d08f",
  "$ trace 0x5e9bd1e1232bcfb28e660ce116fe910aa058345604334e5f560034f51ef5327c",
  "$ inspect 0xa7f8b2c3d4e5f6789abcdef012345678901234567890abcdef0123456789abc"
]

export function TransactionInput({ onSelectTransaction }: TransactionInputProps) {
  const [input, setInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [validation, setValidation] = useState<ValidationResult>({ isValid: false, type: 'invalid', message: '' })
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showExamples, setShowExamples] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [pasteSuccess, setPasteSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Cycle through placeholder messages
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_MESSAGES.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('lifi-lens-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load recent searches:', e)
      }
    }
  }, [])

  const validateTransactionInput = (value: string): ValidationResult => {
    if (!value.trim()) {
      return { isValid: false, type: 'invalid', message: '' }
    }

    // Remove whitespace
    const cleanValue = value.trim()

    // Check for Ethereum transaction hash format (0x + 64 hex characters)
    const ethHashRegex = /^0x[a-fA-F0-9]{64}$/
    
    if (ethHashRegex.test(cleanValue)) {
      return {
        isValid: true,
        type: 'ethereum',
        message: 'Valid Ethereum transaction hash detected'
      }
    }

    // Check if it starts with 0x but has wrong length
    if (cleanValue.startsWith('0x')) {
      if (cleanValue.length < 66) {
        return {
          isValid: false,
          type: 'invalid',
          message: `Too short - need ${66 - cleanValue.length} more characters`
        }
      } else if (cleanValue.length > 66) {
        return {
          isValid: false,
          type: 'invalid',
          message: 'Too long - transaction hashes are 66 characters'
        }
      } else if (!/^0x[a-fA-F0-9]+$/.test(cleanValue)) {
        return {
          isValid: false,
          type: 'invalid',
          message: 'Contains invalid characters - only 0-9 and A-F allowed'
        }
      }
    }

    // If it doesn't start with 0x, check if it's just hex that needs 0x prefix
    if (/^[a-fA-F0-9]{64}$/.test(cleanValue)) {
      return {
        isValid: false,
        type: 'invalid',
        message: 'Add "0x" prefix to make it a valid transaction hash'
      }
    }

    return {
      isValid: false,
      type: 'invalid',
      message: 'Please enter a valid transaction hash (0x + 64 hex characters)'
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInput(value)
    setError(null)
    
    const validationResult = validateTransactionInput(value)
    setValidation(validationResult)
  }

  const handleSearch = async (txHash?: string) => {
    const searchValue = txHash || input.trim()
    
    if (!searchValue) return

    const validationResult = validateTransactionInput(searchValue)
    if (!validationResult.isValid) {
      setError(validationResult.message)
      // Shake animation
      inputRef.current?.classList.add('animate-shake')
      setTimeout(() => inputRef.current?.classList.remove('animate-shake'), 600)
      return
    }

    setIsSearching(true)
    setError(null)
    
    try {
      // Save to recent searches
      const newRecentSearches = [searchValue, ...recentSearches.filter(s => s !== searchValue)].slice(0, 5)
      setRecentSearches(newRecentSearches)
      localStorage.setItem('lifi-lens-recent-searches', JSON.stringify(newRecentSearches))
      
      onSelectTransaction(searchValue)
      setInput('')
      setValidation({ isValid: false, type: 'invalid', message: '' })
    } catch (err) {
      setError('Failed to process transaction. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
      setPasteSuccess(true)
      
      const validationResult = validateTransactionInput(text)
      setValidation(validationResult)
      
      // Auto-submit if valid
      if (validationResult.isValid) {
        setTimeout(() => handleSearch(text), 500)
      }
      
      setTimeout(() => setPasteSuccess(false), 2000)
    } catch (err) {
      setError('Unable to paste. Please check clipboard permissions or paste manually.')
    }
  }

  const handleExampleClick = (hash: string) => {
    setInput(hash)
    setValidation(validateTransactionInput(hash))
    setShowExamples(false)
  }

  const copyExample = async (hash: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(hash)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
      handlePaste()
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Terminal Window */}
      <div className="terminal-window bg-gray-900 rounded-lg shadow-2xl border border-gray-700">
        {/* Terminal Header */}
        <div className="terminal-header flex items-center justify-between px-4 py-3 bg-gray-800 rounded-t-lg border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-mono">lifi-lens@debug:~$</span>
            <div className="flex items-center gap-2">
              <div className="status-dot status-healthy"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="terminal-content p-6 font-mono text-sm">
          {/* Welcome Message */}
          <div className="text-green-400 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>●</span>
              <span>LI.FI Transaction Debugger v2.1.0</span>
            </div>
            <div className="text-gray-500 text-xs ml-4">
              Professional debugging for cross-chain transactions
            </div>
          </div>

          {/* Command History */}
          {commandHistory.length > 0 && (
            <div className="mb-4 space-y-1 text-gray-300">
              {commandHistory.slice(-3).map((cmd, index) => (
                <div key={index} className="flex items-center gap-2 opacity-70">
                  <span className="text-lifi-secondary">$</span>
                  <span className="text-xs">{cmd}</span>
                  <span className="text-green-400 text-xs">✓</span>
                </div>
              ))}
            </div>
          )}

          {/* Current Command Line */}
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lifi-secondary flex-shrink-0">$</span>
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  placeholder={PLACEHOLDER_MESSAGES[placeholderIndex]}
                  className={cn(
                    "w-full bg-transparent text-white font-mono text-base",
                    "border-none outline-none placeholder:text-gray-500",
                    "focus:outline-none caret-lifi-primary",
                    validation.isValid && "text-green-400",
                    input.trim() && !validation.isValid && "text-red-400"
                  )}
                  disabled={isSearching}
                />
                {/* Blinking Cursor */}
                {!isSearching && (
                  <span className="absolute top-0 right-0 animate-pulse text-lifi-primary">
                    |
                  </span>
                )}
                {isSearching && (
                  <span className="absolute top-0 right-0">
                    <Loader2 className="h-4 w-4 animate-spin text-lifi-accent" />
                  </span>
                )}
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center gap-6 text-xs text-gray-500 mb-4">
              <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", validation.isValid ? "bg-green-400" : "bg-gray-600")}></div>
                <span>Hash Format</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Network: Multi-chain</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-lifi-secondary rounded-full"></div>
                <span>Mode: Debug</span>
              </div>
            </div>

            {/* Command Actions */}
            <div className="flex items-center gap-4 mb-4">
              <button
                type="submit"
                disabled={!validation.isValid || isSearching}
                className={cn(
                  "px-4 py-2 text-xs font-mono rounded border transition-all duration-200",
                  validation.isValid && !isSearching
                    ? "bg-lifi-primary text-white border-lifi-primary hover:bg-lifi-primary/90"
                    : "bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed"
                )}
              >
                {isSearching ? "Analyzing..." : "Execute"}
              </button>
              
              <button
                type="button"
                onClick={handlePaste}
                className={cn(
                  "px-3 py-2 text-xs font-mono rounded border transition-colors",
                  "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600",
                  pasteSuccess && "text-green-400 border-green-400"
                )}
                title="Paste from clipboard"
              >
                {pasteSuccess ? "✓ Pasted" : "Paste"}
              </button>

              <button
                type="button"
                onClick={() => setShowExamples(!showExamples)}
                className="px-3 py-2 text-xs font-mono rounded border bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600 transition-colors"
              >
                Examples
              </button>
            </div>
          </form>

          {/* Error/Success Messages */}
          {(validation.message || error) && (
            <div className={cn(
              "mb-4 text-xs font-mono px-3 py-2 rounded border-l-2",
              validation.isValid 
                ? "text-green-400 bg-green-900/20 border-green-400" 
                : "text-red-400 bg-red-900/20 border-red-400"
            )}>
              <span className="opacity-70"># </span>
              {error || validation.message}
            </div>
          )}

          {/* Examples Section */}
          {showExamples && (
            <div className="mb-6 border border-gray-700 rounded bg-gray-800/50">
              <div className="border-b border-gray-700 px-4 py-2 bg-gray-800">
                <h4 className="text-xs font-mono text-gray-300 flex items-center gap-2">
                  <Hash className="h-3 w-3" />
                  Example Commands
                </h4>
              </div>
              <div className="p-4 space-y-3">
                {EXAMPLE_TRANSACTIONS.map((example, index) => (
                  <div
                    key={index}
                    onClick={() => handleExampleClick(example.hash)}
                    className="group p-3 bg-gray-900/50 rounded border border-gray-700 cursor-pointer hover:border-lifi-primary/50 hover:bg-gray-800/50 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-mono text-xs text-gray-300 mb-1">
                          $ debug {example.hash}
                        </p>
                        <p className="text-xs text-gray-500">
                          {example.description}
                        </p>
                      </div>
                      <button
                        onClick={(e) => copyExample(example.hash, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-lifi-primary transition-all duration-200"
                        title="Copy command"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Commands */}
      {recentSearches.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
            <Hash className="h-4 w-4" />
            <span className="font-mono">Recent Commands</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((hash) => (
              <button
                key={hash}
                onClick={() => handleSearch(hash)}
                className="group inline-flex items-center gap-2 px-3 py-2 text-xs font-mono bg-gray-800 border border-gray-700 rounded hover:border-lifi-primary/50 hover:bg-gray-700 transition-all duration-200"
              >
                <span className="text-gray-400 group-hover:text-lifi-primary">
                  $ debug {hash.slice(0, 8)}...{hash.slice(-6)}
                </span>
                <ExternalLink className="h-3 w-3 text-gray-500 group-hover:text-lifi-accent" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
