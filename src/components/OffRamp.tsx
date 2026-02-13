import { useEffect, useRef, useState } from 'react'
import { Transak } from '@transak/ui-js-sdk'
import './TransakWidget.css'

const OffRamp = () => {
  const [walletAddress, setWalletAddress] = useState('')
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)
  const transakRef = useRef<Transak | null>(null)

  const openTransakWidget = async () => {
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address')
      return
    }

    // Close existing widget if open
    if (transakRef.current) {
      transakRef.current.close()
    }

    setIsWidgetOpen(true)

    try {
      // Call backend API to generate widget URL
      const response = await fetch('/api/transak/widget-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          widgetParams: {
            walletAddress: walletAddress.trim(),
            defaultCryptoCurrency: 'ETH',
            defaultFiatCurrency: 'USD',
            networks: 'ethereum,arbitrum,optimism,polygon',
            themeColor: '2563eb',
            widgetHeight: '600px',
            widgetWidth: '500px',
            productsAvailed: 'SELL', // OffRamp only
            referrerDomain: window.location.hostname || 'localhost'
          }
        })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to create widget URL'
        try {
          const errorData = await response.json()
          const hint = errorData.hint ? `\n\n${errorData.hint}` : ''
          errorMessage = (errorData.details || errorData.error || errorMessage) + hint
        } catch {
          errorMessage = await response.text() || errorMessage
        }
        throw new Error(errorMessage)
      }

      const { widgetUrl } = await response.json()

      if (!widgetUrl) {
        throw new Error('No widget URL returned from server')
      }

      console.log('Widget URL generated successfully')

      // Initialize Transak SDK with the generated widget URL
      const transak = new Transak({
        widgetUrl: widgetUrl
      })

      transakRef.current = transak

      // Set up event listeners using static Transak.on() method
      // This will trigger when the user closes the widget
      Transak.on(Transak.EVENTS.TRANSAK_WIDGET_CLOSE, () => {
        console.log('Widget closed')
        setIsWidgetOpen(false)
      })

      // This will trigger when the user confirms an order
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_CREATED, (orderData: any) => {
        console.log('Order created:', orderData)
      })

      // This will trigger when the user marks payment is made
      // Safe point to close/navigate away
      Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData: any) => {
        console.log('Order successful:', orderData)
        alert(`Order successful! Transaction ID: ${orderData.status?.id || orderData.id || 'N/A'}`)
        setIsWidgetOpen(false)
        if (transakRef.current) {
          transakRef.current.close()
        }
      })

      transak.init()
    } catch (error: any) {
      console.error('Error opening Transak widget:', error)
      const isNetworkError = error?.message === 'Failed to fetch' || error?.name === 'TypeError'
      const message = isNetworkError
        ? 'Cannot reach the backend. Run "npm run dev" so both frontend and backend start.'
        : error.message
      alert(`Error: ${message}`)
      setIsWidgetOpen(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transakRef.current) {
        transakRef.current.close()
      }
    }
  }, [])

  return (
    <div className="transak-container">
      <div className="widget-section">
        <h2>💵 Sell Cryptocurrency</h2>
        <p className="description">
          Enter your wallet address to sell crypto and receive fiat currency directly to your bank account or other payment methods.
        </p>

        <div className="input-group">
          <label htmlFor="wallet-address-offramp">Wallet Address</label>
          <input
            id="wallet-address-offramp"
            type="text"
            placeholder="0x..."
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="wallet-input"
          />
          <small>Enter your Ethereum wallet address containing the crypto you want to sell</small>
        </div>

        <button
          onClick={openTransakWidget}
          disabled={!walletAddress.trim() || isWidgetOpen}
          className="transak-button"
        >
          {isWidgetOpen ? 'Widget is Open' : 'Open Transak Widget'}
        </button>

        <div className="info-box">
          <h3>Supported Networks:</h3>
          <ul>
            <li>Ethereum</li>
            <li>Polygon</li>
            <li>Arbitrum</li>
            <li>Optimism</li>
          </ul>
        </div>

        <div className="info-box">
          <h3>Withdrawal Methods:</h3>
          <ul>
            <li>Bank Transfer (SEPA, ACH, Wire Transfer)</li>
            <li>Local Bank Transfer</li>
            <li>Other payment methods (varies by country)</li>
          </ul>
        </div>

        <div className="info-box warning">
          <h3>⚠️ Important:</h3>
          <ul>
            <li>Make sure your wallet has sufficient crypto balance</li>
            <li>You'll need to complete KYC verification for off-ramp transactions</li>
            <li>Fiat will be sent to your verified bank account</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default OffRamp
