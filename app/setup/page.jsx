"use client";
import { useEffect, useState } from "react";

export default function SetupPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const response = await fetch("/api/config/status");
      const result = await response.json();
      setConfig(result);
    } catch (error) {
      console.error("Failed to check config:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">⚙️</div>
          <div>Checking configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">WhatsApp API Setup</h1>
          <p className="text-gray-400">
            Configure your WhatsApp Business API to enable real-time messaging
          </p>
        </div>

        {/* Configuration Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📊</span>
            Current Configuration Status
          </h2>
          
          {config?.success ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span>Environment</span>
                <span className="font-mono text-sm">{config.config.environment}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span>Phone Number ID</span>
                <span className="font-mono text-sm">{config.config.whatsappApi.phoneNumberId}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span>Access Token</span>
                <span className="font-mono text-sm">{config.config.whatsappApi.accessToken}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span>Webhook Token</span>
                <span className="font-mono text-sm">{config.config.whatsappApi.webhookToken}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                <span>Webhook URL</span>
                <span className="font-mono text-sm text-blue-400">{config.config.webhookUrl}</span>
              </div>
              
              <div className={`p-4 rounded-lg border-l-4 ${
                config.config.ready 
                  ? "bg-green-900/20 border-green-500 text-green-300"
                  : config.config.developmentMode
                    ? "bg-purple-900/20 border-purple-500 text-purple-300"
                    : "bg-red-900/20 border-red-500 text-red-300"
              }`}>
                <div className="font-semibold mb-1">Status</div>
                <div>{config.message}</div>
              </div>
            </div>
          ) : (
            <div className="text-red-400">Failed to load configuration status</div>
          )}
        </div>

        {/* Setup Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔧</span>
              Environment Variables
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-400 mb-1">Create a <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> file:</div>
                <pre className="bg-gray-900 p-3 rounded text-xs overflow-x-auto">
{`# WhatsApp Business API
META_PHONE_NUMBER_ID=your_phone_number_id
META_ACCESS_TOKEN=your_access_token
META_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Development
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000`}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📱</span>
              Meta Developer Setup
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                <div>
                  <div className="font-semibold">Create Meta App</div>
                  <div className="text-gray-400">Go to developers.facebook.com</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                <div>
                  <div className="font-semibold">Add WhatsApp Product</div>
                  <div className="text-gray-400">Enable WhatsApp Business API</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                <div>
                  <div className="font-semibold">Configure Webhook</div>
                  <div className="text-gray-400">Set URL and verify token</div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">4.</span>
                <div>
                  <div className="font-semibold">Get Credentials</div>
                  <div className="text-gray-400">Copy Phone ID and Access Token</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span>⚡</span>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={checkConfig}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition text-center"
            >
              🔄 Refresh Status
            </button>
            <a
              href="/test-webhook"
              className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-medium transition text-center block"
            >
              🧪 Test Webhook
            </a>
            <a
              href="/user-dashboard"
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-3 rounded-lg font-medium transition text-center block"
            >
              📱 Go to Dashboard
            </a>
          </div>
        </div>

        {/* Development Mode Info */}
        {config?.config?.developmentMode && (
          <div className="bg-purple-900/20 border border-purple-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-300">
              <span>🧪</span>
              Development Mode Active
            </h3>
            <div className="text-purple-200 space-y-2">
              <p>
                Your app is running in development mode. Messages will be simulated locally 
                instead of being sent through WhatsApp.
              </p>
              <p>
                This allows you to test the full messaging flow without needing WhatsApp API credentials.
              </p>
              <div className="mt-4 p-3 bg-purple-900/30 rounded border border-purple-600">
                <div className="font-semibold mb-2">What works in development mode:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Send and receive messages (simulated)</li>
                  <li>Message status updates</li>
                  <li>Template status notifications</li>
                  <li>Real-time UI updates</li>
                  <li>Conversation history</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Documentation Links */}
        <div className="text-center mt-8">
          <div className="text-gray-400 mb-4">Need help?</div>
          <div className="space-x-4">
            <a
              href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              WhatsApp API Docs
            </a>
            <a
              href="/api/config/status"
              target="_blank"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              API Status
            </a>
            <a
              href="/api/messages/send"
              target="_blank"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Send API Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}