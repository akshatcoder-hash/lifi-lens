"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Download,
    FileText,
    Image,
    Copy,
    Check,
    X,
    Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    txHash?: string
}

type ExportFormat = 'json' | 'pdf' | 'png'

export function ExportDialog({ open, onOpenChange, txHash }: ExportDialogProps) {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')
    const [isExporting, setIsExporting] = useState(false)
    const [exported, setExported] = useState(false)

    useEffect(() => {
        const handleExport = () => {
            onOpenChange(true)
        }

        window.addEventListener('lifi-lens:export', handleExport)
        return () => window.removeEventListener('lifi-lens:export', handleExport)
    }, [onOpenChange])

    const formatOptions = [
        {
            id: 'json' as ExportFormat,
            name: 'JSON Report',
            description: 'Detailed debugging data in JSON format',
            icon: FileText,
            size: '~15KB'
        },
        {
            id: 'pdf' as ExportFormat,
            name: 'PDF Report',
            description: 'Professional report with charts and analysis',
            icon: FileText,
            size: '~250KB'
        },
        {
            id: 'png' as ExportFormat,
            name: 'PNG Image',
            description: 'Screenshot of the current analysis',
            icon: Image,
            size: '~500KB'
        }
    ]

    const handleExport = async () => {
        if (!txHash) {
            toast.error('No transaction selected for export')
            return
        }

        setIsExporting(true)

        try {
            switch (selectedFormat) {
                case 'json':
                    await exportJSON()
                    break
                case 'pdf':
                    await exportPDF()
                    break
                case 'png':
                    await exportPNG()
                    break
            }

            setExported(true)
            toast.success(`Analysis exported as ${selectedFormat.toUpperCase()}`)

            setTimeout(() => {
                setExported(false)
                onOpenChange(false)
            }, 2000)

        } catch (error) {
            console.error('Export failed:', error)
            toast.error('Export failed. Please try again.')
        } finally {
            setIsExporting(false)
        }
    }

    const exportJSON = async () => {
        // Generate comprehensive debug report
        const report = {
            timestamp: new Date().toISOString(),
            txHash,
            analysis: {
                // This would contain actual transaction analysis data
                summary: 'Transaction analysis data would go here',
                errors: [],
                performance: {},
                routes: []
            },
            metadata: {
                tool: 'LiFi Lens',
                version: '1.0.0',
                exported_by: 'user'
            }
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `lifi-lens-${txHash?.slice(0, 8)}-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const exportPDF = async () => {
        const pdf = new jsPDF('p', 'mm', 'a4')

        // Add header
        pdf.setFontSize(20)
        pdf.text('LiFi Lens Analysis Report', 20, 20)

        pdf.setFontSize(12)
        pdf.text(`Transaction: ${txHash}`, 20, 35)
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 20, 45)

        // Add content (this would include actual analysis data)
        pdf.text('Analysis Summary:', 20, 65)
        pdf.text('This is a sample PDF export. In a real implementation,', 20, 75)
        pdf.text('this would contain detailed transaction analysis.', 20, 85)

        pdf.save(`lifi-lens-${txHash?.slice(0, 8)}-${Date.now()}.pdf`)
    }

    const exportPNG = async () => {
        const element = document.querySelector('[data-export-target]') as HTMLElement
        if (!element) {
            throw new Error('Export target not found')
        }

        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
        })

        const link = document.createElement('a')
        link.download = `lifi-lens-${txHash?.slice(0, 8)}-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => onOpenChange(false)}
                >
                    <motion.div
                        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md mx-4"
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Export Analysis
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Download your transaction analysis
                                </p>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                {formatOptions.map((format) => {
                                    const Icon = format.icon
                                    return (
                                        <motion.button
                                            key={format.id}
                                            onClick={() => setSelectedFormat(format.id)}
                                            className={cn(
                                                "w-full p-4 rounded-lg border-2 text-left transition-all duration-200",
                                                selectedFormat === format.id
                                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                            )}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg",
                                                    selectedFormat === format.id
                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                )}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                                            {format.name}
                                                        </h3>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {format.size}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {format.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => onOpenChange(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                disabled={isExporting}
                            >
                                Cancel
                            </button>

                            <motion.button
                                onClick={handleExport}
                                disabled={isExporting || !txHash}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                    exported
                                        ? "bg-green-500 text-white"
                                        : isExporting || !txHash
                                            ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                            : "bg-blue-500 hover:bg-blue-600 text-white"
                                )}
                                whileHover={!isExporting && !exported ? { scale: 1.05 } : {}}
                                whileTap={!isExporting && !exported ? { scale: 0.95 } : {}}
                            >
                                {isExporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : exported ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Download className="h-4 w-4" />
                                )}
                                {isExporting ? 'Exporting...' : exported ? 'Exported!' : 'Export'}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
