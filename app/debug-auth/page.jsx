"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export default function DebugAuth() {
  const { data: session, status } = useSession();

  const handleFacebookLogin = () => {
    console.log("Attempting Facebook login...");
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL || "http://localhost:3000");
    console.log("Expected redirect URL:", `${window.location.origin}/api/auth/callback/facebook`);
    
    signIn('facebook', { 
      callbackUrl: window.location.origin + '/user-dashboard',
      redirect: true 
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">NextAuth Debug Page</h1>
        
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Session</h2>
          <pre className="text-sm text-gray-300 bg-gray-800 p-4 rounded overflow-auto">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Expected Redirect URL</h2>
          <p className="text-sm text-gray-300 bg-gray-800 p-4 rounded font-mono">
            {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/facebook` : 'Loading...'}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            This is the URL you need to add to Facebook App's "Valid OAuth Redirect URIs"
          </p>
        </div>

        <div className="space-y-4">
          {!session ? (
            <button
              onClick={handleFacebookLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Test Facebook Login
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-green-400">✅ Logged in as: {session.user?.email}</p>
              <button
                onClick={() => signOut()}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">Facebook App Configuration</h3>
          <p className="text-sm text-gray-300 mb-2">Add this URL to your Facebook App's OAuth settings:</p>
          <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
            <li>Go to Facebook Developers Console</li>
            <li>Select your app (ID: 263483085720465)</li>
            <li>Facebook Login → Settings</li>
            <li>Add the redirect URL shown above to "Valid OAuth Redirect URIs"</li>
            <li>Make sure "Client OAuth Login" and "Web OAuth Login" are ON</li>
          </ol>
        </div>
      </div>
    </div>
  );
}