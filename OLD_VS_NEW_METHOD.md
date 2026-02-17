# Transak Integration: Old vs New Method

## 🤔 Why the Confusion?

You're seeing documentation that says "only API key needed" because Transak has **two different methods**:

1. **OLD METHOD (Deprecated)** - Direct query parameters with just API key
2. **NEW METHOD (Required)** - Create Widget URL API with access token

The documentation you're looking at (`sdk-on-ramp-and-off-ramp`) shows the **old method**, but Transak has **mandated migration** to the new method.

---

## 📊 Comparison

### OLD METHOD (Deprecated) ❌

**What it looks like:**
```javascript
// Frontend directly creates widget URL
const widgetUrl = `https://global-stg.transak.com?apiKey=YOUR_API_KEY&walletAddress=0x123...&productsAvailed=BUY`

// Open widget directly
const transak = new Transak({ widgetUrl })
transak.init()
```

**Requirements:**
- ✅ Only API Key needed
- ❌ **Deprecated** - Will stop working soon
- ❌ Less secure
- ❌ No server-side validation

**Why it's deprecated:**
- Security concerns (API key exposed in URL)
- No server-side validation
- Harder to track and manage

---

### NEW METHOD (Required) ✅

**What it looks like:**
```javascript
// 1. Frontend asks backend for widget URL
const response = await fetch('/api/transak/widget-url', {
  method: 'POST',
  body: JSON.stringify({ widgetParams: {...} })
})

// 2. Backend gets access token (using API Secret)
const accessToken = await getAccessToken() // Uses API Secret

// 3. Backend creates widget URL via Transak API
const widgetUrl = await createWidgetUrl(accessToken, widgetParams)

// 4. Frontend receives widget URL and opens it
const transak = new Transak({ widgetUrl })
transak.init()
```

**Requirements:**
- ✅ API Key (in widgetParams)
- ✅ **API Secret** (to get access token)
- ✅ Backend server (to call Transak API)
- ✅ **This is what we're using!**

**Why it's better:**
- ✅ More secure (API Secret never exposed)
- ✅ Server-side validation
- ✅ Better tracking and management
- ✅ Required by Transak going forward

---

## 🔄 Migration Timeline

According to Transak's migration notice:

> **"All partners are required to migrate their integration to use the Create Widget URL API"**
> 
> **"Previous methods of embedding query parameter configuration directly in the widget URL are deprecated and will no longer be supported."**

This means:
- Old method still works **for now** (legacy support)
- But Transak will **stop supporting it** in the future
- New integrations **must** use the new method
- Existing integrations **should** migrate

---

## 💡 Why We're Using the New Method

Our implementation uses the **new method** because:

1. **Future-proof**: Won't break when Transak removes old method
2. **More secure**: API Secret stays on server
3. **Better practice**: Follows Transak's current recommendations
4. **Required**: For new integrations

---

## 🛠️ If You Want to Try the Old Method (Not Recommended)

If you really want to use the old method (just for testing), you could modify the frontend:

```javascript
// OLD METHOD - Direct URL (deprecated)
const widgetUrl = `https://global-stg.transak.com?apiKey=${apiKey}&walletAddress=${walletAddress}&productsAvailed=BUY`

const transak = new Transak({ widgetUrl })
transak.init()
```

**But:**
- ⚠️ This will stop working when Transak removes support
- ⚠️ Less secure
- ⚠️ Not recommended for production

---

## 📚 Documentation References

- **Old Method Docs**: https://docs.transak.com/docs/sdk-on-ramp-and-off-ramp (what you're seeing)
- **Migration Notice**: https://docs.transak.com/docs/migration-to-api-based-transak-widget-url (explains why we need new method)
- **Create Widget URL API**: https://docs.transak.com/reference/create-widget-url (new method)
- **Refresh Access Token**: https://docs.transak.com/reference/refresh-access-token (needed for new method)

---

## ✅ Summary

| Aspect | Old Method | New Method (What We Use) |
|--------|-----------|-------------------------|
| **API Key** | ✅ Required | ✅ Required |
| **API Secret** | ❌ Not needed | ✅ **Required** (for access token) |
| **Backend Server** | ❌ Not needed | ✅ **Required** |
| **Status** | ⚠️ Deprecated | ✅ Current & Required |
| **Security** | ⚠️ Lower | ✅ Higher |
| **Future Support** | ❌ Will be removed | ✅ Supported |

---

**Bottom Line:** The documentation showing "only API key" is for the **old deprecated method**. We're using the **new required method** which needs both API Key and API Secret. This is why you need the API Secret in your `.env` file!
