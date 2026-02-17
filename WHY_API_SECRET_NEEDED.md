# Why API Secret is Needed - Documentation Trail

## 🔍 The Connection Chain

The API Secret requirement is **indirect** but **necessary**. Here's the documentation trail:

---

## Step 1: Create Widget URL API Requires `access-token`

**Documentation:** https://docs.transak.com/reference/create-widget-url

Looking at the API definition, you'll see:

```json
"parameters": [
  {
    "in": "header",
    "name": "access-token",
    "required": true,  // ← REQUIRED!
    "description": "Your Partner Access Token, you can generate one using our Refresh Access Token endpoint"
  }
]
```

**Key Point:** The Create Widget URL API **requires** an `access-token` header.

---

## Step 2: To Get `access-token`, You Need Refresh Access Token API

**Documentation:** https://docs.transak.com/reference/refresh-access-token

The Create Widget URL docs say:
> "Your Partner Access Token, you can generate one using our [Refresh Access Token](https://docs.transak.com/reference/refresh-access-token#/) endpoint"

So we need to call the Refresh Access Token API first.

---

## Step 3: Refresh Access Token API Requires `api-secret`

**Documentation:** https://docs.transak.com/reference/refresh-access-token

Looking at the Refresh Access Token API definition:

```json
"parameters": [
  {
    "name": "api-secret",
    "in": "header",
    "required": true,  // ← REQUIRED!
    "description": "Your api secret, you can get it from Transak Partner Dashboard for respective environment"
  }
],
"requestBody": {
  "required": ["apiKey"],
  "properties": {
    "apiKey": {
      "type": "string",
      "description": "Your Api Key which you can get it from Transak Partner Dashboard"
    }
  }
}
```

**Key Point:** The Refresh Access Token API **requires**:
- `api-secret` in the **header** (this is your API Secret!)
- `apiKey` in the **request body** (this is your API Key)

---

## 🔗 The Complete Chain

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Create Widget URL API                                    │
│    Requires: access-token header                            │
│    Docs: https://docs.transak.com/reference/create-widget-url │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ (needs access-token)
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Refresh Access Token API                                 │
│    Requires: api-secret header + apiKey body                 │
│    Returns: access-token                                     │
│    Docs: https://docs.transak.com/reference/refresh-access-token │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ (needs api-secret)
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. You Need API Secret                                      │
│    Get from: Partner Dashboard → Staging → Developers       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Exact Documentation Quotes

### From Create Widget URL Docs:
> **"access-token"** (header, required): "Your Partner Access Token, you can generate one using our [Refresh Access Token](https://docs.transak.com/reference/refresh-access-token#/) endpoint"

### From Refresh Access Token Docs:
> **"api-secret"** (header, required): "Your api secret, you can get it from Transak Partner Dashboard for respective environment"

---

## 💡 Why It's Not Explicitly Stated

The Create Widget URL documentation doesn't say "you need API Secret" directly because:

1. **Separation of concerns**: Each API endpoint is documented separately
2. **Indirect requirement**: API Secret is needed for a **different API** (Refresh Access Token)
3. **Documentation structure**: They assume you'll follow the link to Refresh Access Token docs

But the **chain is clear**:
- Create Widget URL → needs access-token
- Refresh Access Token → needs api-secret
- Therefore: Create Widget URL → needs api-secret (indirectly)

---

## ✅ Summary

**Direct requirement:**
- Create Widget URL API needs `access-token` header ✅ (documented)

**Indirect requirement:**
- To get `access-token`, call Refresh Access Token API ✅ (documented)
- Refresh Access Token API needs `api-secret` header ✅ (documented)

**Conclusion:**
- You **must** have API Secret to use Create Widget URL API ✅

---

## 🎯 Where to Find API Secret

According to Refresh Access Token docs:
> "Your api secret, you can get it from Transak Partner Dashboard for respective environment"

**Steps:**
1. Go to https://partner.transak.com/
2. Select **Staging** environment (top right)
3. Go to **Developers** (or **API Keys**)
4. Look for **API Secret** field (separate from API Key)
5. Copy it to your `.env` file as `TRANSAK_API_SECRET`

---

**The documentation DOES say you need API Secret - it's just in the Refresh Access Token docs, not the Create Widget URL docs!**
