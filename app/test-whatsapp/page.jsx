"use client";

import { useState, useEffect } from "react";

export default function TestWhatsAppPage() {
  const [status, setStatus] = useState("loading");
  const [logs, setLogs] = useState([]);
  const [account, setAccount] = useState(null);

  const addLog = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      addLog("Checking WhatsApp connection status...");
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      
      if (data.connected) {
        setStatus("connected");
        setAccount(data.account);
        addLog("WhatsApp is connected!", "success");
      } else {
        setStatus("disconnected");
        addLog("WhatsApp is not connected");
      }
    } catch (err) {
      addLog(`Error checking status: ${err.message}`, "error");
      setStatus("error");
    }
  };

  const testConnection = async () => {
    try {
      addLog("Testing Facebook SDK...");
      
      if (!window.FB) {
        addLog("Facebook SDK not loaded", "error");
        return;
      }
      
      addLog("Facebook SDK is loaded");
      
      // Test FB.getLoginStatus
      window.FB.getLoginStatus((response) => {
        addLog(`FB Login Status: ${response.status}`);
        if (response.authResponse) {
          addLog("User is logged into Facebook");
        } else {
          addLog("User is not logged into Facebook");
        }
      });
      
    } catch (err) {
      addLog(`Test error: ${err.message}`, "error");
    }
  };

  const testTemplateMessage = async () => {
    try {
      addLog("Testing template message integration...");
      
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: [
            {
              id: "test_contact_1",
              phone: "1234567890",
              name: "Test User"
            }
          ],
          template: {
            name: "welcome_message_test",
            language: "en_US",
            components: [
              {
                type: "HEADER",
                format: "TEXT",
                text: "Welcome to Our Service!"
              },
              {
                type: "BODY",
                text: "Hello, thank you for joining us. We're excited to have you on board!"
              },
              {
                type: "FOOTER",
                text: "Best regards, Your Team"
              }
            ]
          }
        })
      });
      
      const data = await res.json();
      
      if (data.sent > 0) {
        addLog(`✅ Template message sent successfully to ${data.sent} contact(s)`, "success");
        addLog("Check the inbox to see the template message in conversation history", "info");
      } else {
        addLog(`❌ Failed to send template message: ${data.error || "Unknown error"}`, "error");
      }
      
    } catch (error) {
      addLog(`Template test error: ${error.message}`, "error");
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">WhatsApp Business Integration Test</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Panel */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status === "connected" ? "bg-green-500/20 text-green-400" :
                  status === "disconnected" ? "bg-yellow-500/20 text-yellow-400" :
                  status === "error" ? "bg-red-500/20 text-red-400" :
                  "bg-gray-500/20 text-gray-400"
                }`}>
                  {status}
                </span>
              </div>
              
              {account && (
                <div className="bg-gray-800 rounded p-3 space-y-2">
                  <div className="text-sm"><strong>Display Name:</strong> {account.displayName}</div>
                  <div className="text-sm"><strong>Phone:</strong> {account.phoneNumber}</div>
                  <div className="text-sm"><strong>WABA ID:</strong> {account.wabaId}</div>
                  <div className="text-sm"><strong>Phone Number ID:</strong> {account.phoneNumberId}</div>
                  <div className="text-sm"><strong>Quality:</strong> {account.qualityRating}</div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={checkStatus}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  Refresh Status
                </button>
                <button 
                  onClick={testConnection}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Test SDK
                </button>
              </div>
            </div>
          </div>

          {/* Environment Check */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Environment Check</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Facebook App ID:</span>
                <span className={process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? "text-green-400" : "text-red-400"}>
                  {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID ? "✓ Set" : "✗ Missing"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Facebook SDK:</span>
                <span className={typeof window !== "undefined" && window.FB ? "text-green-400" : "text-yellow-400"}>
                  {typeof window !== "undefined" && window.FB ? "✓ Loaded" : "⏳ Loading..."}
                </span>
              </div>
            </div>
            
            {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID && (
              <div className="mt-4 p-3 bg-gray-800 rounded text-xs font-mono">
                App ID: {process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}
              </div>
            )}
          </div>
        </div>

        {/* Logs Panel */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Debug Logs</h2>
            <button 
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet...</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className={`mb-1 ${
                  log.type === "error" ? "text-red-400" :
                  log.type === "success" ? "text-green-400" :
                  log.type === "warning" ? "text-yellow-400" :
                  "text-gray-300"
                }`}>
                  <span className="text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Navigation</h3>
              <div className="flex gap-3">
                <a 
                  href="/user-dashboard" 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Go to Dashboard
                </a>
                <a 
                  href="/setup" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                >
                  API Setup
                </a>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Testing</h3>
              <div className="flex gap-3">
                <button 
                  onClick={testTemplateMessage}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                >
                  Test Template
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Load Facebook SDK */}
      <script
        async
        defer
        crossOrigin="anonymous"
        src="https://connect.facebook.net/en_US/sdk.js"
        onLoad={() => {
          if (window.FB) {
            window.FB.init({
              appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
              cookie: true,
              xfbml: false,
              version: 'v19.0'
            });
            addLog("Facebook SDK loaded and initialized");
          }
        }}
      />
    </div>
  );
}