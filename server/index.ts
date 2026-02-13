import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

// Simple CORS middleware
const corsMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  next()
}

const app = express()
const PORT = 3030

app.use(corsMiddleware)
app.use(express.json())

// Cached access token (valid ~7 days; refresh when expired)
let cachedAccessToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
  const apiKey = process.env.VITE_TRANSAK_API_KEY || process.env.TRANSAK_API_KEY
  const apiSecret = process.env.TRANSAK_API_SECRET
  const environment = process.env.VITE_TRANSAK_ENV || process.env.TRANSAK_ENV || 'staging'

  if (!apiSecret) {
    throw new Error('TRANSAK_API_SECRET is required. Add it in .env from Partner Dashboard → Developers (Staging).')
  }
  if (!apiKey) {
    throw new Error('Transak API key not configured')
  }

  // API Secret must be different from API Key (Partner Dashboard shows them as separate fields)
  if (apiSecret === apiKey) {
    throw new Error('TRANSAK_API_SECRET must be your API Secret, not the API Key. In Partner Dashboard → Developers, copy the "API Secret" field (different from API Key).')
  }

  // Use cached token if still valid (with 5 min buffer)
  if (cachedAccessToken && Date.now() / 1000 < tokenExpiresAt - 300) {
    return cachedAccessToken
  }

  const gatewayBaseUrl = environment === 'production'
    ? 'https://api-gateway.transak.com'
    : 'https://api-gateway-stg.transak.com'
  const partnersBaseUrl = environment === 'production'
    ? 'https://api.transak.com'
    : 'https://api-stg.transak.com'

  const refreshPayload = {
    headers: {
      'Content-Type': 'application/json',
      'api-secret': apiSecret.trim(),
    },
    body: JSON.stringify({ apiKey: apiKey.trim() }),
  }

  // Try gateway refresh first (same host as session API)
  let tokenResponse = await fetch(`${gatewayBaseUrl}/api/v2/auth/refresh-token`, {
    method: 'POST',
    ...refreshPayload,
  })

  // Fallback to partners API if gateway has no refresh endpoint
  if (tokenResponse.status === 404) {
    tokenResponse = await fetch(`${partnersBaseUrl}/partners/api/v2/refresh-token`, {
      method: 'POST',
      ...refreshPayload,
    })
  }

  if (!tokenResponse.ok) {
    const errText = await tokenResponse.text()
    console.error('Refresh token error:', tokenResponse.status, errText)
    throw new Error(`Failed to get access token (${tokenResponse.status}): ${errText}`)
  }

  const tokenData = await tokenResponse.json()
  cachedAccessToken = tokenData.data?.accessToken
  tokenExpiresAt = tokenData.data?.expiresAt ?? 0
  if (!cachedAccessToken) {
    throw new Error('No access token in response. Check Partner Dashboard → Staging → API Secret.')
  }
  console.log('Transak access token obtained successfully')
  return cachedAccessToken
}

// Proxy endpoint to create Transak widget URL
app.post('/api/transak/widget-url', async (req, res) => {
  try {
    const apiKey = process.env.VITE_TRANSAK_API_KEY || process.env.TRANSAK_API_KEY
    const environment = process.env.VITE_TRANSAK_ENV || process.env.TRANSAK_ENV || 'staging'

    if (!apiKey) {
      return res.status(400).json({ error: 'Transak API key not configured' })
    }

    const gatewayBaseUrl = environment === 'production'
      ? 'https://api-gateway.transak.com'
      : 'https://api-gateway-stg.transak.com'

    const accessToken = await getAccessToken()

    // Get widget params from request
    const { widgetParams } = req.body

    // Create widget URL (requires access-token header per Transak docs)
    const widgetUrlResponse = await fetch(`${gatewayBaseUrl}/api/v2/auth/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'access-token': accessToken.trim(),
      },
      body: JSON.stringify({
        widgetParams: {
          apiKey: apiKey,
          referrerDomain: widgetParams?.referrerDomain || 'localhost',
          ...widgetParams
        }
      })
    })

    if (!widgetUrlResponse.ok) {
      const errorText = await widgetUrlResponse.text()
      console.error('Transak API Error:', widgetUrlResponse.status, errorText)
      if (widgetUrlResponse.status === 401) {
        cachedAccessToken = null
        const hint = 'Use the correct API Secret from Partner Dashboard → Staging → Developers (it is different from the API Key).'
        return res.status(401).json({
          error: 'Invalid or missing access-token',
          details: errorText,
          hint
        })
      }
      return res.status(widgetUrlResponse.status).json({
        error: 'Failed to create widget URL',
        details: errorText
      })
    }

    const widgetData = await widgetUrlResponse.json()
    res.json({ widgetUrl: widgetData.data?.widgetUrl })
  } catch (error: any) {
    console.error('Server error:', error)
    res.status(500).json({ error: 'Internal server error', message: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Transak proxy server running on http://localhost:${PORT}`)
  console.log(`📝 Required in .env: VITE_TRANSAK_API_KEY, TRANSAK_API_SECRET, VITE_TRANSAK_ENV`)
})
