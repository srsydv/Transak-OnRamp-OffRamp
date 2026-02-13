# Troubleshooting Transak API Key Issues

## Error: "Invalid API key. Please double check your API key and your environment name"

This error typically occurs when:

### 1. **API Key and Environment Mismatch**

The most common cause is using a **production API key** with **staging environment** (or vice versa).

**Solution:**
1. Go to [Transak Partner Dashboard](https://partner.transak.com/)
2. Check the **Environment dropdown** in the top right corner
3. Make sure it's set to **"Staging"** (not Production)
4. Click **"Developers"** in the left navigation
5. Copy the **Staging API Key** (not the Production one)
6. Update your `.env` file:
   ```
   VITE_TRANSAK_API_KEY=your_staging_api_key_here
   VITE_TRANSAK_ENV=staging
   ```
7. **Restart your dev server** (`npm run dev`)

### 2. **Vite Not Picking Up Environment Variables**

Vite requires a **server restart** when `.env` files change.

**Solution:**
1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

### 3. **Wrong API Key Format**

Transak API keys are UUIDs (e.g., `00ddb6d6-e7be-4aa1-b78b-d56f8fc08eaf`)

**Check:**
- No extra spaces
- Correct format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Copied completely from the dashboard

### 4. **Verify Your API Key**

1. Log into [Partner Dashboard](https://partner.transak.com/)
2. Select **"Staging"** from the environment dropdown (top right)
3. Go to **Developers** → **API Keys**
4. Verify you're copying the **Staging API Key**
5. Make sure the key is active/enabled

### 5. **Check Browser Console**

Open browser DevTools (F12) and check the console for:
- The API key being used (first 10 characters)
- The environment setting
- The base URL (should be `https://global-stg.transak.com` for staging)

### Quick Checklist

- [ ] Using **Staging API Key** (not Production)
- [ ] Environment dropdown in Partner Dashboard is set to **"Staging"**
- [ ] `.env` file has `VITE_TRANSAK_ENV=staging` (lowercase)
- [ ] `.env` file has `VITE_TRANSAK_API_KEY=your_staging_key`
- [ ] Dev server was **restarted** after changing `.env`
- [ ] Browser was **hard refreshed** (Ctrl+Shift+R)
- [ ] API key has no extra spaces or characters

### Still Having Issues?

1. Double-check the API key in Partner Dashboard
2. Try generating a new API key
3. Contact Transak Support: https://support.transak.com/
