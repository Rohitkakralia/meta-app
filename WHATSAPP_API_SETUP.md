# WhatsApp Business API Setup Guide

## Required Environment Variables

Add these variables to your `.env.local` file:

```env
# WhatsApp Business API Configuration
META_PHONE_NUMBER_ID=your_phone_number_id_here
META_ACCESS_TOKEN=your_access_token_here
META_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token_here

# Optional - for development
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
```

## How to Get These Values

### 1. Meta Phone Number ID
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add WhatsApp Business API product
4. Go to WhatsApp > API Setup
5. Copy the "Phone number ID" from the test number

### 2. Access Token
1. In the same API Setup page
2. Copy the temporary access token (24 hours)
3. For production, generate a permanent token:
   - Go to WhatsApp > Configuration
   - Generate a permanent access token

### 3. Webhook Verify Token
1. Create a random string (e.g., `my_webhook_verify_token_123`)
2. Use this same token when configuring the webhook URL in Meta

## Webhook Configuration

1. In Meta for Developers > WhatsApp > Configuration
2. Set webhook URL: `https://yourdomain.com/api/webhook`
3. Set verify token: (same as META_WEBHOOK_VERIFY_TOKEN)
4. Subscribe to these webhook fields:
   - `messages`
   - `message_template_status_update`

## Development Mode

If you don't have WhatsApp API credentials yet, the app will run in development mode:
- Messages are simulated (not actually sent)
- All functionality works for testing
- Check console for "🧪 Development mode" messages

## Testing Your Setup

1. **Test webhook verification**:
   ```bash
   curl "http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test"
   ```

2. **Test message sending**:
   - Go to `/test-webhook`
   - Try sending a message
   - Check console for success/error messages

3. **Test incoming messages**:
   - Use the test webhook page
   - Send test messages to see real-time updates

## Production Checklist

- [ ] Set up permanent access token
- [ ] Configure webhook URL with HTTPS
- [ ] Add phone numbers to allow list
- [ ] Submit app for review (if needed)
- [ ] Test with real phone numbers

## Troubleshooting

### "Missing WhatsApp API configuration"
- Check that all environment variables are set
- Restart your development server after adding env vars

### "Webhook verification failed"
- Ensure META_WEBHOOK_VERIFY_TOKEN matches the token in Meta dashboard
- Check that your webhook URL is accessible

### "Failed to send message"
- Verify your access token is valid
- Check that the recipient phone number is in the correct format
- Ensure the phone number is in your allow list (for test numbers)

## Environment Variables Template

Create a `.env.local` file with:

```env
# Copy this template and fill in your values

# WhatsApp Business API (Required for production)
META_PHONE_NUMBER_ID=
META_ACCESS_TOKEN=
META_WEBHOOK_VERIFY_TOKEN=

# Development settings
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000

# Optional: Database URL (if using database storage)
DATABASE_URL=

# Optional: Redis URL (for real-time features)
REDIS_URL=
```

## Next Steps

1. **Development**: The app works without API credentials for testing
2. **Production**: Set up actual WhatsApp Business API credentials
3. **Scaling**: Consider adding database storage and WebSocket for real-time updates
4. **Features**: Add message templates, media support, and contact management