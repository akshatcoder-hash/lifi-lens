"use client"

import { useState, useEffect } from 'react'
import Joyride, { STATUS, ACTIONS, EVENTS, Step, CallBackProps } from 'react-joyride'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingTourProps {
  onComplete?: () => void
}

const tourSteps: Step[] = [
  {
    target: '[data-tour="welcome"]',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Welcome to LiFi Lens!</h3>
        </div>
        <p>
          Your professional debugging tool for LI.FI cross-chain transactions.
          Let's take a quick tour to get you started.
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This tour will take about 2 minutes
        </div>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="search-input"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Start with a Transaction Hash</h3>
        <p>
          Paste any LI.FI transaction hash here to begin analysis.
          We'll fetch comprehensive data about the transaction's journey across chains.
        </p>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <strong>Pro tip:</strong> You can also use Ctrl/Cmd + V to paste directly!
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="command-palette"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Command Palette</h3>
        <p>
          Press <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Cmd+K</kbd> or click here
          to open the command palette. Quickly search transactions, access features, and navigate.
        </p>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Power users love keyboard shortcuts!
        </div>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="theme-toggle"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Dark Mode</h3>
        <p>
          Toggle between light and dark themes. Perfect for those late-night debugging sessions.
        </p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="features"]',
    content: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Powerful Analysis Features</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span>Real-time transaction status tracking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span>Detailed error analysis and debugging</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span>Performance metrics and gas optimization</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span>Visual transaction flow diagrams</span>
          </div>
        </div>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    content: (
      <div className="space-y-4 text-center">
        <div className="text-6xl">🚀</div>
        <h3 className="text-xl font-semibold">You're Ready to Go!</h3>
        <p>
          You now know the basics of LiFi Lens. Start by pasting a transaction hash
          and exploring the detailed analysis we provide.
        </p>
        <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg text-sm">
          <strong>Need help?</strong> Check the footer for documentation links and support.
        </div>
      </div>
    ),
    placement: 'center',
  }
]

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const completed = localStorage.getItem('lifi-lens-onboarding-completed')
    if (!completed) {
      // Small delay to ensure the page is fully loaded
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setHasCompletedOnboarding(true)
    }
  }, [])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data

    if (type === EVENTS.STEP_AFTER) {
      setCurrentStep(index + 1)
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsVisible(false)
      localStorage.setItem('lifi-lens-onboarding-completed', 'true')
      setHasCompletedOnboarding(true)
      onComplete?.()

      if (status === STATUS.FINISHED) {
        toast.success('Welcome to LiFi Lens! 🎉', {
          description: 'You\'re all set to start debugging transactions.',
          duration: 5000,
        })
      }
    }
  }

  const restartTour = () => {
    setCurrentStep(0)
    setIsVisible(true)
    localStorage.removeItem('lifi-lens-onboarding-completed')
    setHasCompletedOnboarding(false)
  }

  // Don't render anything if onboarding is not visible
  if (!isVisible && hasCompletedOnboarding) {
    return (
      <button
        onClick={restartTour}
        className="fixed bottom-4 left-4 z-40 p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110 group"
        title="Restart Tour"
      >
        <Sparkles className="h-5 w-5" />
        <span className="absolute left-full ml-3 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Restart Tour
        </span>
      </button>
    )
  }

  return (
    <>
      <Joyride
        steps={tourSteps}
        run={isVisible}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            width: 400,
            zIndex: 10000,
          },
          tooltip: {
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
          },
          tooltipContent: {
            padding: '20px',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '8px 16px',
            outline: 'none',
          },
          buttonBack: {
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            marginRight: 'auto',
            padding: '8px 16px',
            outline: 'none',
          },
          buttonSkip: {
            color: '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            padding: '8px 16px',
            outline: 'none',
          },
          beacon: {
            color: '#3b82f6',
          },
          spotlight: {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
          },
        }}
        locale={{
          back: 'Previous',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />

      {/* Custom progress indicator */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed top-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3"
          >
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-blue-500" />
              <span className="font-medium">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
            <div className="w-32 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// Hook for managing onboarding state
export function useOnboarding() {
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false)
  const [showHints, setShowHints] = useState(false)

  useEffect(() => {
    const completed = localStorage.getItem('lifi-lens-onboarding-completed')
    setHasCompletedOnboarding(!!completed)

    // Show hints for new users
    if (!completed) {
      setShowHints(true)
    }
  }, [])

  const markOnboardingComplete = () => {
    localStorage.setItem('lifi-lens-onboarding-completed', 'true')
    setHasCompletedOnboarding(true)
    setShowHints(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('lifi-lens-onboarding-completed')
    setHasCompletedOnboarding(false)
    setShowHints(true)
  }

  return {
    hasCompletedOnboarding,
    showHints,
    markOnboardingComplete,
    resetOnboarding,
  }
}
