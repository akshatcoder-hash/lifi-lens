"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Zap, TrendingUp } from 'lucide-react'

const demoCommands = [
  {
    command: "$ debug 0x32a4b9d9cdec66b1a4c8f72e8e7f...",
    output: [
      { text: "🔍 Analyzing transaction...", type: "info", delay: 500 },
      { text: "✅ Transaction found on Ethereum", type: "success", delay: 1000 },
      { text: "🔗 Cross-chain route detected", type: "info", delay: 1500 },
      { text: "⚠️  High slippage detected: 5.2%", type: "warning", delay: 2000 },
      { text: "💡 Suggestion: Use 0.5% slippage for better rates", type: "tip", delay: 2500 }
    ]
  },
  {
    command: "$ analyze --route ethereum->polygon",
    output: [
      { text: "📊 Route Analysis Complete", type: "success", delay: 3500 },
      { text: "💰 Estimated savings: $12.43", type: "success", delay: 4000 },
      { text: "⚡ Execution time: 2.3s avg", type: "info", delay: 4500 }
    ]
  }
]

interface OutputLine {
  text: string
  type: 'info' | 'success' | 'warning' | 'error' | 'tip'
  delay: number
}

export function TerminalDemo() {
  const [currentLine, setCurrentLine] = useState(0)
  const [visibleOutput, setVisibleOutput] = useState<OutputLine[]>([])
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentLine < demoCommands.length) {
        const command = demoCommands[currentLine]
        setIsTyping(true)
        
        // Show command typing
        setTimeout(() => {
          setIsTyping(false)
          // Add outputs with delays
          command.output.forEach((output, index) => {
            setTimeout(() => {
              setVisibleOutput(prev => [...prev, output as OutputLine])
            }, output.delay - (currentLine * 3000))
          })
        }, 1000)

        // Move to next command
        setTimeout(() => {
          setCurrentLine(prev => prev + 1)
        }, Math.max(...command.output.map(o => o.delay)) - (currentLine * 3000) + 1000)
      } else {
        // Reset after showing all commands
        setTimeout(() => {
          setCurrentLine(0)
          setVisibleOutput([])
        }, 3000)
      }
    }, currentLine * 6000)

    return () => clearTimeout(timer)
  }, [currentLine])

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="w-4 h-4 text-terminal-green" />
      case 'warning': return <Clock className="w-4 h-4 text-terminal-yellow" />
      case 'error': return <XCircle className="w-4 h-4 text-terminal-red" />
      case 'tip': return <Zap className="w-4 h-4 text-terminal-blue" />
      default: return <TrendingUp className="w-4 h-4 text-terminal-blue" />
    }
  }

  const getTextColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-terminal-green'
      case 'warning': return 'text-terminal-yellow'
      case 'error': return 'text-terminal-red'
      case 'tip': return 'text-terminal-blue'
      default: return 'text-terminal-fg'
    }
  }

  return (
    <div className="terminal-window w-full max-w-2xl">
      <div className="terminal-header">
        <div className="terminal-dot terminal-dot-red"></div>
        <div className="terminal-dot terminal-dot-yellow"></div>
        <div className="terminal-dot terminal-dot-green"></div>
        <span className="text-sm font-medium text-gray-300 ml-2">
          LiFi Lens Debug Console
        </span>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <div className="status-dot status-healthy"></div>
          <span>Connected</span>
        </div>
      </div>
      
      <div className="terminal-content">
        <div className="space-y-2">
          {/* Welcome message */}
          <div className="text-terminal-green">
            lifi-lens v2.1.0 - Professional Transaction Debugger
          </div>
          <div className="text-gray-400 text-sm mb-4">
            Ready to debug cross-chain transactions...
          </div>

          {/* Commands and outputs */}
          {demoCommands.slice(0, currentLine + 1).map((cmd, cmdIndex) => (
            <div key={cmdIndex} className="space-y-1">
              {/* Command line */}
              <div className="flex items-center">
                <span className="text-terminal-blue mr-2">$</span>
                <motion.span 
                  className="font-mono text-terminal-fg"
                  initial={{ width: 0 }}
                  animate={{ width: cmdIndex <= currentLine ? "auto" : 0 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                >
                  {cmdIndex === currentLine && isTyping ? (
                    <span className="relative">
                      {cmd.command}
                      <motion.span 
                        className="inline-block w-2 h-5 bg-terminal-green ml-1"
                        animate={{ opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                    </span>
                  ) : cmdIndex < currentLine ? cmd.command : ''}
                </motion.span>
              </div>

              {/* Output lines */}
              {cmdIndex < currentLine && (
                <div className="ml-4 space-y-1">
                  {cmd.output.map((output, outputIndex) => (
                    <motion.div
                      key={outputIndex}
                      className="flex items-center gap-2 text-sm"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * outputIndex }}
                    >
                      {getIcon(output.type)}
                      <span className={getTextColor(output.type)}>
                        {output.text}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Show real-time outputs for current command */}
          {visibleOutput.map((output, index) => (
            <motion.div
              key={`current-${index}`}
              className="flex items-center gap-2 text-sm ml-4"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {getIcon(output.type)}
              <span className={getTextColor(output.type)}>
                {output.text}
              </span>
            </motion.div>
          ))}

          {/* Current prompt */}
          <div className="flex items-center mt-4">
            <span className="text-terminal-blue mr-2">$</span>
            <motion.span 
              className="inline-block w-2 h-5 bg-terminal-green"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
