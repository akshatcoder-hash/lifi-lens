# LiFi Lens - Advanced Cross-Chain Transaction Debugging Tool

A powerful debugging tool for LI.FI cross-chain transactions that provides 10x better insights than scan.li.fi.

## Features

- **Real-time Transaction Status**: Track cross-chain transfers with live status updates
- **Detailed Error Analysis**: Comprehensive error messages with actionable suggestions
- **Fee Breakdown**: Complete breakdown of all fees involved in the transaction
- **Transaction Timeline**: Visual representation of source and destination transactions
- **Chain Support**: Support for 30+ EVM chains
- **Recent Searches**: Quick access to previously searched transactions
- **Dark Mode**: Built-in dark mode support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with shadcn/ui patterns
- **API**: LI.FI API v1
- **Deployment**: Optimized for Vercel

## Getting Started

1. Install dependencies:
```bash
pnpm install
```

2. Run the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Integration

The tool integrates with the following LI.FI endpoints:

- `/v1/status` - Check transaction status
- Error handling for all documented error codes
- Support for transaction hash, step ID, and bridge transaction ID

## Project Structure

```
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions and API client
├── types/           # TypeScript type definitions
└── public/          # Static assets
```

## Key Components

- **TransactionSearch**: Search interface with recent searches
- **TransactionDetails**: Main status display with refresh capability
- **TransactionTimeline**: Visual source/destination transaction flow
- **TransactionError**: Detailed error analysis and suggestions
- **FeeBreakdown**: Itemized fee display

## Development

- Follows Next.js 14 best practices
- Server and client components properly separated
- Type-safe with full TypeScript coverage
- Error boundaries for resilient error handling
- Responsive design for all screen sizes