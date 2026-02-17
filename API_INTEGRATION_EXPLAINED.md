# Transak API Integration - Beginner's Guide

## 🎯 What We're Building

We're building an app that lets users **buy cryptocurrency** (OnRamp) and **sell cryptocurrency** (OffRamp) using Transak's service. Think of it like integrating a payment gateway (like Stripe) but for crypto.

---

## 🏗️ Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │  ────>  │  Our Server │  ────>  │ Transak API │
│  (Frontend) │         │  (Backend)   │         │             │
└─────────────┘         └─────────────┘         └─────────────┘
     React                    Express              External API
```

**Why do we need a backend server?**
- Transak requires API calls to be made from a server (not directly from the browser)
- We need to keep our **API Secret** secure (never expose it to the browser)
- The browser can't directly call Transak's API due to security restrictions

---

## 📋 Step-by-Step Flow

### Step 1: User Clicks "Open Transak Widget"

**Location:** `src/components/OnRamp.tsx` (line 10)

```javascript
const openTransakWidget = async () => {
  // User enters wallet address: "0x1234..."
  // User clicks button
}
```

**What happens:**
- User enters their wallet address (e.g., `0x1234...`)
- Clicks "Open Transak Widget" button
- Frontend prepares to call our backend

---

### Step 2: Frontend Calls Our Backend

**Location:** `src/components/OnRamp.tsx` (line 25)

```javascript
const response = await fetch('/api/transak/widget-url', {
  method: 'POST',
  body: JSON.stringify({
    widgetParams: {
      walletAddress: '0x1234...',
      defaultCryptoCurrency: 'ETH',
      productsAvailed: 'BUY',
      // ... other settings
    }
  })
})
```

**What this does:**
- Frontend sends a POST request to **our backend** at `/api/transak/widget-url`
- Includes user's wallet address and preferences
- **Does NOT** include API Secret (that stays on the server!)

**Think of it like:** Ordering food online - you tell the restaurant what you want, but you don't give them your credit card number directly.

---

### Step 3: Backend Receives Request

**Location:** `server/index.ts` (line 108)

```javascript
app.post('/api/transak/widget-url', async (req, res) => {
  // Our Express server receives the request
  const { widgetParams } = req.body
  // widgetParams = { walletAddress: '0x1234...', ... }
})
```

**What this does:**
- Express server (running on port 3030) receives the request
- Extracts the `widgetParams` from the request body
- Now we need to call Transak's API

---

### Step 4: Get Access Token (The Key Step!)

**Location:** `server/index.ts` (line 27 - `getAccessToken()`)

**Why do we need this?**
Transak requires an **access token** (like a temporary password) to create widget URLs. We get this token by proving we're authorized.

**How we get it:**

```javascript
async function getAccessToken() {
  // 1. Read credentials from .env file
  const apiKey = process.env.TRANSAK_API_KEY      // "00ddb6d6-..."
  const apiSecret = process.env.TRANSAK_API_SECRET  // "secret123..."
  
  // 2. Check if we already have a valid token (cached)
  if (cachedAccessToken && notExpired) {
    return cachedAccessToken  // Use existing token
  }
  
  // 3. Call Transak's Refresh Token API
  const response = await fetch('https://api-stg.transak.com/partners/api/v2/refresh-token', {
    method: 'POST',
    headers: {
      'api-secret': apiSecret  // Send secret in header
    },
    body: JSON.stringify({ apiKey: apiKey })  // Send key in body
  })
  
  // 4. Transak returns access token
  const data = await response.json()
  // data = { data: { accessToken: "eyJhbGc...", expiresAt: 1234567890 } }
  
  // 5. Save token for reuse (valid for 7 days)
  cachedAccessToken = data.data.accessToken
  return cachedAccessToken
}
```

**Analogy:** 
- **API Key** = Your username
- **API Secret** = Your password  
- **Access Token** = A temporary pass (valid for 7 days) that proves you're logged in

**Important:** 
- We cache the token so we don't request a new one every time
- Token expires after 7 days, then we get a new one automatically

---

### Step 5: Create Widget URL

**Location:** `server/index.ts` (line 127)

```javascript
// Now we have the access token, use it to create widget URL
const widgetUrlResponse = await fetch('https://api-gateway-stg.transak.com/api/v2/auth/session', {
  method: 'POST',
  headers: {
    'access-token': accessToken,  // Use the token we got in Step 4
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    widgetParams: {
      apiKey: apiKey,
      referrerDomain: 'localhost',
      walletAddress: '0x1234...',
      defaultCryptoCurrency: 'ETH',
      productsAvailed: 'BUY',
      // ... all the user's preferences
    }
  })
})

// Transak returns a widget URL with a session ID
const widgetData = await widgetUrlResponse.json()
// widgetData = { data: { widgetUrl: "https://global-stg.transak.com?apiKey=...&sessionId=..." } }
```

**What this does:**
- Sends the access token to Transak's "Create Widget URL" API
- Includes all user preferences (wallet address, crypto type, etc.)
- Transak creates a secure widget URL with a unique `sessionId`
- This URL can only be used once (for security)

**Think of it like:** Getting a ticket to enter a concert - you show your ID (access token), they give you a ticket (widget URL) that only works once.

---

### Step 6: Send Widget URL Back to Frontend

**Location:** `server/index.ts` (line 162)

```javascript
res.json({ widgetUrl: widgetData.data.widgetUrl })
```

**What this does:**
- Backend sends the widget URL back to the frontend
- Frontend receives: `{ widgetUrl: "https://global-stg.transak.com?apiKey=...&sessionId=..." }`

---

### Step 7: Frontend Opens Transak Widget

**Location:** `src/components/OnRamp.tsx` (line 60)

```javascript
const { widgetUrl } = await response.json()

// Initialize Transak SDK with the widget URL
const transak = new Transak({
  widgetUrl: widgetUrl
})

// Set up event listeners
Transak.on(Transak.EVENTS.TRANSAK_ORDER_SUCCESSFUL, (orderData) => {
  console.log('Order successful!', orderData)
  alert(`Order successful! Transaction ID: ${orderData.id}`)
})

// Open the widget
transak.init()
```

**What this does:**
- Frontend receives the widget URL from our backend
- Uses Transak's JavaScript SDK to open the widget
- Widget appears as a popup/iframe
- User completes the purchase flow inside the widget
- When done, Transak sends events back to our app

**Think of it like:** Opening a payment popup - the widget handles everything (payment, KYC, etc.), and tells us when it's done.

---

## 🔐 Security Concepts

### Why We Can't Call Transak Directly from Browser

**Problem:** If we put API Secret in frontend code:
```javascript
// ❌ BAD - Never do this!
const apiSecret = 'secret123...'  // Anyone can see this in browser!
```

**Why it's bad:**
- Anyone can open browser DevTools and see your API Secret
- They can use your credentials to make unauthorized API calls
- Your account could be compromised

**Solution:** Keep secrets on the server
```javascript
// ✅ GOOD - Secret stays on server
// .env file (never committed to git)
TRANSAK_API_SECRET=secret123...
```

---

## 📁 File Structure Explained

```
payment-gateway-demo/
├── server/
│   └── index.ts          # Backend server (Express)
│                         # - Gets access token
│                         # - Creates widget URL
│                         # - Handles API calls
│
├── src/
│   ├── components/
│   │   ├── OnRamp.tsx    # Frontend: Buy crypto component
│   │   └── OffRamp.tsx   # Frontend: Sell crypto component
│   └── App.tsx           # Main React app
│
└── .env                   # Secrets (API Key, API Secret)
                           # Never commit this file!
```

---

## 🔄 Complete Flow Diagram

```
1. User enters wallet address
   ↓
2. Frontend: POST /api/transak/widget-url
   ↓
3. Backend: Receives request
   ↓
4. Backend: Check if access token exists & valid?
   ├─ Yes → Use cached token
   └─ No → Call Transak Refresh Token API
            ├─ Send: API Key + API Secret
            └─ Receive: Access Token (valid 7 days)
   ↓
5. Backend: Call Transak Create Widget URL API
   ├─ Send: Access Token + Widget Params
   └─ Receive: Widget URL with sessionId
   ↓
6. Backend: Send widget URL to frontend
   ↓
7. Frontend: Open Transak widget using SDK
   ↓
8. User completes purchase in widget
   ↓
9. Transak sends event: ORDER_SUCCESSFUL
   ↓
10. Frontend: Show success message
```

---

## 🛠️ Key Technologies Used

### Backend (Server)
- **Express.js**: Web server framework
- **Node.js**: JavaScript runtime
- **dotenv**: Loads `.env` file securely

### Frontend (Browser)
- **React**: UI framework
- **Transak SDK**: JavaScript library to open widget
- **Vite**: Build tool and dev server

---

## 💡 Important Concepts

### 1. **API Key vs API Secret**
- **API Key**: Public identifier (like username) - can be shared
- **API Secret**: Private password - NEVER expose to browser

### 2. **Access Token**
- Temporary credential (valid 7 days)
- Proves you're authorized
- Used to make API calls

### 3. **Widget URL**
- Special URL with embedded session ID
- Can only be used once
- Contains all user preferences

### 4. **Caching**
- We save the access token in memory
- Don't request new token every time
- Only refresh when expired

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid api-secret"
**Cause:** API Secret is wrong or same as API Key  
**Fix:** Get real API Secret from Partner Dashboard → Staging → Developers

### Issue: "Invalid or missing access-token"
**Cause:** Access token expired or invalid  
**Fix:** Server automatically refreshes token, but check API Secret is correct

### Issue: "Failed to create widget URL"
**Cause:** Wrong API endpoint or missing parameters  
**Fix:** Check server logs, verify all required params are sent

---

## 📚 Learn More

- **Transak Docs**: https://docs.transak.com/
- **Express.js**: https://expressjs.com/
- **React**: https://react.dev/
- **REST APIs**: https://restfulapi.net/

---

## 🎓 Practice Exercise

Try modifying the code to:
1. Add more widget parameters (like `defaultFiatAmount`)
2. Handle more Transak events (like `TRANSAK_ORDER_FAILED`)
3. Add a loading spinner while widget URL is being created
4. Store widget URL in localStorage for debugging

---

**Remember:** The key concept is that **secrets stay on the server**, and the **frontend only receives safe data** (like the widget URL) that it can use to open the Transak widget.
