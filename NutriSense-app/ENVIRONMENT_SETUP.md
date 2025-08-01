# Environment Setup for NutriSense

## 🔐 Setting Up Environment Variables

This app uses environment variables to securely store API keys and other sensitive configuration.

### Steps:

1. **Copy the example file:**

   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file and add your actual API keys:**

   ```env
   EXPO_PUBLIC_GOOGLE_GENAI_API_KEY=your_actual_google_gemini_api_key_here
   ```

3. **Get your Google Gemini API key:**

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy it to your `.env` file

4. **Restart your development server:**
   ```bash
   npx expo start --clear
   ```

### 🚨 Important Security Notes:

- **Never commit `.env` files** - They're already in `.gitignore`
- **Use `.env.example`** to show required variables without exposing values
- **Use `EXPO_PUBLIC_` prefix** for variables that need to be available in the React Native app
- **Keep production keys separate** from development keys

### 🔍 Troubleshooting:

If you see "API key not found" errors:

1. Check that your `.env` file exists and has the correct variable name
2. Restart the Expo development server with `--clear` flag
3. Check the console logs to see which API key source is being used

### 📁 File Structure:

```
├── .env                    # Your actual API keys (not committed)
├── .env.example           # Template showing required variables
├── .gitignore            # Ensures .env is not committed
└── app/config/api.ts     # Handles loading environment variables
```
