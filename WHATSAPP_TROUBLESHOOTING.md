# WhatsApp Business Integration Troubleshooting Guide

## Common Issues and Solutions

### 1. Facebook SDK Not Loading
**Symptoms:** "Facebook SDK not ready" error
**Solutions:**
- Check that `NEXT_PUBLIC_FACEBOOK_APP_ID` is set in your `.env` file
- Verify the Facebook App ID is correct in Meta Developer Console
- Check browser console for JavaScript errors
- Test at: http://localhost:3000/test-whatsapp

### 2. Missing WhatsApp Business Permissions
**Symptoms:** "Token exchange failed" or "Failed to fetch phone details"
**Solutions:**
- Go to Meta Developer Console → Your App → App Review
- Request these permissions:
  - `whatsapp_business_management`
  - `whatsapp_business_messaging`
  - `business_management`
- Ensure your app is in "Live" mode for production

### 3. No WhatsApp Business Account Found
**Symptoms:** "Could not determine phone number ID"
**Solutions:**
- Verify you have a WhatsApp Business Account set up
- Check that your Facebook account is an admin of the WhatsApp Business Account
- Go to business.facebook.com and verify your WhatsApp Business setup

### 4. Embedded Signup Configuration Missing
**Symptoms:** Login popup doesn't show WhatsApp options
**Solutions:**
- In Meta Developer Console, go to WhatsApp → Configuration
- Set up Embedded Signup with your domain
- Add your callback URL: `http://localhost:3000/api/whatsapp/callback`
- Configure webhook URL: `http://localhost:3000/api/whatsapp/webhook`

### 5. Environment Variables
Required variables in `.env`:
```
NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
```

Optional (for advanced configuration):
```
NEXT_PUBLIC_FACEBOOK_CONFIG_ID=your_config_id
NEXT_PUBLIC_EXTERNAL_BUSINESS_ID=your_business_id
```

## Meta Developer Console Setup Checklist

### 1. Create Facebook App
- Go to developers.facebook.com
- Create new app → Business → Continue
- Add WhatsApp product

### 2. Configure WhatsApp Business
- Go to WhatsApp → Getting Started
- Add phone number
- Verify phone number
- Set up webhook (optional for basic connection)

### 3. App Review (for production)
- Submit app for review
- Request required permissions
- Provide use case description

### 4. Embedded Signup Setup
- Go to WhatsApp → Configuration → Embedded Signup
- Add your domain: `localhost:3000` (development)
- Set callback URL: `http://localhost:3000/api/whatsapp/callback`

## Testing Steps

1. **Test Environment Setup**
   ```bash
   cd saas-meta
   npm run dev
   ```
   Visit: http://localhost:3000/test-whatsapp

2. **Test Facebook SDK**
   - Check if Facebook SDK loads
   - Verify App ID is correct
   - Test login status

3. **Test WhatsApp Connection**
   - Go to integrations page
   - Click "Connect WhatsApp Business"
   - Check browser console for errors
   - Verify API responses in Network tab

## Debug Information

### Browser Console Logs
Look for these log messages:
- "Facebook SDK initialized with App ID: ..."
- "FB Login response: ..."
- "Connect API response: ..."

### Server Logs
Check terminal for:
- "Received connection request: ..."
- "Token exchange response: ..."
- "Connection saved successfully"

### API Testing
Test endpoints manually:
```bash
# Check status
curl http://localhost:3000/api/whatsapp/status

# Test with sample data (replace with real values)
curl -X POST http://localhost:3000/api/whatsapp/connect \
  -H "Content-Type: application/json" \
  -d '{"code":"your_code","wabaId":"your_waba_id","phoneNumberId":"your_phone_id"}'
```

## Common Error Messages

### "Facebook SDK not ready"
- Facebook SDK failed to load
- Check internet connection and App ID

### "Token exchange failed"
- Invalid authorization code
- Check Facebook app credentials
- Verify app is in correct mode (development/live)

### "Failed to fetch phone details"
- Phone number ID is invalid
- Missing WhatsApp Business permissions
- WhatsApp Business Account not properly set up

### "Missing authorization code from Facebook"
- Facebook login was cancelled
- Embedded signup not configured correctly
- User doesn't have access to WhatsApp Business Account

## Next Steps

1. **For Development:**
   - Use test phone numbers from Meta Developer Console
   - Test with sandbox mode first

2. **For Production:**
   - Submit app for review
   - Get production WhatsApp Business Account approved
   - Update environment variables for production domain

3. **Advanced Features:**
   - Set up webhooks for receiving messages
   - Implement message templates
   - Add contact management