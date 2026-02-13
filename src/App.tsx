import { useState } from 'react'
import OnRamp from './components/OnRamp'
import OffRamp from './components/OffRamp'
import './App.css'

type Tab = 'onramp' | 'offramp'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('onramp')

  return (
    <div className="app">
      <header className="app-header">
        <h1>💸 Transak Integration</h1>
        <p>Buy and Sell Cryptocurrency with Fiat</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'onramp' ? 'active' : ''}`}
          onClick={() => setActiveTab('onramp')}
        >
          💰 Buy Crypto (OnRamp)
        </button>
        <button
          className={`tab-button ${activeTab === 'offramp' ? 'active' : ''}`}
          onClick={() => setActiveTab('offramp')}
        >
          💵 Sell Crypto (OffRamp)
        </button>
      </nav>

      <main className="app-content">
        {activeTab === 'onramp' ? <OnRamp /> : <OffRamp />}
      </main>

      <footer className="app-footer">
        <p>Powered by Transak • Secure & Fast Crypto Transactions</p>
      </footer>
    </div>
  )
}

export default App
