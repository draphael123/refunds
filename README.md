# 💊 Refund Converter

Process accurate refunds for patients who are due them.

## Features

- ✨ **Refund Calculation**: Calculate refunds based on weeks paid vs weeks received
- 💊 **Medication Management**: Add multiple medications and track their refunds
- 📊 **Live Preview**: See calculations update in real-time
- 📝 **History & Templates**: Save and reuse calculations
- 📈 **Statistics**: Track your refund calculations over time
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 💱 **Multi-Currency**: Support for USD, EUR, GBP, CAD, AUD, and more
- 📄 **Export Options**: Export calculations (coming soon)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## How to Use

1. **Enter the Amount Paid**: Enter the total amount paid (e.g., 100.00)
2. **Enter Medication/Service Dispensed**: Enter the amount of medication or service received
3. **Enter Weeks Paid**: Enter the number of weeks you paid for
4. **Enter Weeks Received**: Enter the number of weeks you actually received
5. **Click Calculate**: View your refund amount and detailed breakdown

## Refund Formula

**Refund = (Weeks Paid - Weeks Received) × Cost per Week**

If weeks received is equal to or greater than weeks paid, the refund will be $0.00.

## Technologies

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Local Storage (for persistence)

## License

MIT
