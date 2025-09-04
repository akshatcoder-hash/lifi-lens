"use client"

import { useState } from 'react'
import { Search, Hash, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TransactionSearchProps {
  onSelectTransaction: (txHash: string) => void
}

export function TransactionSearch({ onSelectTransaction }: TransactionSearchProps) {
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const trimmedInput = searchInput.trim()
    if (!trimmedInput) return

    setIsSearching(true)
    
    try {
      onSelectTransaction(trimmedInput)
      
      // Add to recent searches
      setRecentSearches(prev => {
        const updated = [trimmedInput, ...prev.filter(s => s !== trimmedInput)]
        return updated.slice(0, 5) // Keep only last 5
      })
      
      setSearchInput('')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="relative">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {isSearching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </div>
          
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Enter transaction hash, LI.FI step ID, or bridge transaction ID..."
            className={cn(
              "w-full pl-10 pr-4 py-3 text-sm",
              "border border-gray-300 dark:border-gray-700",
              "rounded-lg",
              "bg-white dark:bg-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
              "placeholder-gray-500 dark:placeholder-gray-400"
            )}
            disabled={isSearching}
          />
        </div>

        <button
          type="submit"
          disabled={!searchInput.trim() || isSearching}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "px-4 py-1.5 text-sm font-medium",
            "bg-blue-600 text-white",
            "rounded-md",
            "hover:bg-blue-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors"
          )}
        >
          Search
        </button>
      </form>

      {recentSearches.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            Recent searches
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((hash) => (
              <button
                key={hash}
                onClick={() => {
                  setSearchInput(hash)
                  onSelectTransaction(hash)
                }}
                className={cn(
                  "inline-flex items-center gap-1.5",
                  "px-3 py-1.5 text-xs",
                  "bg-gray-100 dark:bg-gray-800",
                  "text-gray-700 dark:text-gray-300",
                  "rounded-md",
                  "hover:bg-gray-200 dark:hover:bg-gray-700",
                  "transition-colors"
                )}
              >
                <Hash className="h-3 w-3" />
                <span className="font-mono">{hash.slice(0, 8)}...{hash.slice(-6)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}