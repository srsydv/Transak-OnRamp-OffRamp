# Transak OnRamp & OffRamp Integration

A modern React application for integrating Transak's cryptocurrency onramp and offramp services. This app allows users to buy and sell cryptocurrency using fiat currencies through various payment methods.

## Features

- 💰 **OnRamp (Buy Crypto)**: Buy cryptocurrency with fiat currency
- 💵 **OffRamp (Sell Crypto)**: Sell cryptocurrency and receive fiat currency
- 🎨 **Modern UI**: Beautiful, responsive design
- 🔒 **Secure**: Powered by Transak's secure infrastructure
- 🌍 **Multi-chain Support**: Ethereum, Polygon, Arbitrum, Optimism

## Prerequisites

- Node.js 18+ and npm
- A Transak API key (get one from [Transak Partner Dashboard](https://partner.transak.com/))

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   
   Edit `.env` and add your Transak **API key** and **API secret**:
   ```
   VITE_TRANSAK_API_KEY=your_staging_api_key
   TRANSAK_API_KEY=your_staging_api_key
   TRANSAK_API_SECRET=your_staging_api_secret
   VITE_TRANSAK_ENV=staging
   TRANSAK_ENV=staging
   ```
   
   **Both API key and API secret are required** (Create Widget URL API uses access tokens).

3. **Get Your Transak Credentials**
   
   - Sign up at [Transak Partner Dashboard](https://partner.transak.com/)
   - **Select "Staging"** in the top-right environment dropdown
   - Go to **Developers** → **API Keys**
   - Copy **Staging API Key** and **Staging API Secret**
   - Add both to your `.env` file (do not commit the secret)

4. **Run the Development Server**
   
   The app now runs both frontend and backend servers:
   ```bash
   npm run dev
   ```
   
   This will start:
   - Frontend server on `http://localhost:3000` (or next available port)
   - Backend proxy server on `http://localhost:3030`

5. **Open in Browser**
   
   Navigate to `http://localhost:3000`

## Important Notes

⚠️ **Transak API Migration**: Transak now requires using their Create Widget URL API instead of direct query parameters. This app includes a backend proxy server that handles the API calls securely.

- The backend server runs on port 3001
- It proxies requests to Transak's API to generate widget URLs
- Make sure both servers are running for the app to work

## Usage

### OnRamp (Buy Crypto)

1. Click on the "💰 Buy Crypto (OnRamp)" tab
2. Enter your wallet address (Ethereum or EVM-compatible)
3. Click "Open Transak Widget"
4. Complete the purchase flow:
   - Select cryptocurrency and amount
   - Choose payment method (card, bank transfer, etc.)
   - Complete KYC if required
   - Complete payment
5. Crypto will be sent to your wallet address

### OffRamp (Sell Crypto)

1. Click on the "💵 Sell Crypto (OffRamp)" tab
2. Enter your wallet address containing crypto to sell
3. Click "Open Transak Widget"
4. Complete the sell flow:
   - Select cryptocurrency and amount
   - Provide bank account details
   - Complete KYC verification
   - Confirm transaction
5. Fiat currency will be sent to your bank account

## Supported Networks

- Ethereum
- Polygon
- Arbitrum
- Optimism

## Payment Methods

### OnRamp
- Credit/Debit Card
- Bank Transfer
- Apple Pay / Google Pay
- Local payment methods (varies by country)

### OffRamp
- Bank Transfer (SEPA, ACH, Wire Transfer)
- Local bank transfers
- Other methods (varies by country)

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── OnRamp.tsx          # OnRamp component
│   │   ├── OffRamp.tsx         # OffRamp component
│   │   └── TransakWidget.css   # Widget styles
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # App styles
│   ├── main.tsx                 # Entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

## Transak SDK Integration

This app uses Transak's JavaScript SDK which is loaded dynamically. The SDK provides:

- Widget initialization
- Event handling (order success/failure)
- User data pre-filling
- Customization options

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TRANSAK_API_KEY` | Your Transak API key | Yes |
| `VITE_TRANSAK_ENV` | Environment: `staging` or `production` | Yes |

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Testing

For testing, use Transak's staging environment:
- Set `VITE_TRANSAK_ENV=staging` in your `.env` file
- Use test credentials from [Transak Test Credentials](https://docs.transak.com/docs/test-credentials)

## Documentation

- [Transak Documentation](https://docs.transak.com/docs/transak-on-ramp)
- [Transak Partner Dashboard](https://partner.transak.com/)
- [Transak API Reference](https://docs.transak.com/docs/transak-on-ramp)

## Support

For Transak-related issues:
- [Transak Support](https://support.transak.com/)
- [Transak Discord](https://discord.gg/transak)

## License

MIT
