// import { useState } from "react";

// // ─── Integration Card Data ────────────────────────────────────────────────────
// const INTEGRATIONS = [
//   {
//     id: "whatsapp",
//     name: "WhatsApp",
//     description: "Connect your WhatsApp Business account to send messages, import contacts, and automate conversations directly from your dashboard.",
//     icon: (
//       <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
//         <rect width="32" height="32" rx="8" fill="#25D366" />
//         <path d="M16 5C10.477 5 6 9.477 6 15c0 1.9.53 3.674 1.45 5.188L6 27l6.977-1.423A9.953 9.953 0 0016 26c5.523 0 10-4.477 10-10S21.523 5 16 5z" fill="white" fillOpacity=".15"/>
//         <path d="M22.003 19.232c-.277-.14-1.637-.813-1.89-.906-.254-.092-.439-.139-.624.14-.185.277-.717.905-.879 1.09-.162.185-.323.208-.6.07-.277-.14-1.17-.433-2.228-1.381-.824-.737-1.38-1.647-1.542-1.924-.162-.277-.017-.427.122-.565.124-.124.277-.323.416-.485.138-.162.185-.277.277-.462.093-.185.047-.347-.023-.485-.07-.139-.624-1.503-.854-2.058-.225-.54-.454-.467-.624-.476l-.531-.009c-.185 0-.485.07-.739.347-.254.277-.97.948-.97 2.312 0 1.363.993 2.681 1.131 2.866.138.185 1.955 2.985 4.737 4.187.662.285 1.178.456 1.58.583.663.211 1.267.181 1.744.11.532-.08 1.637-.67 1.868-1.317.231-.647.231-1.202.162-1.317-.07-.116-.254-.185-.531-.324z" fill="white"/>
//       </svg>
//     ),
//     color: "emerald",
//     badge: "Popular",
//     badgeColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
//     features: ["Auto-import contacts", "Send bulk messages", "Two-way sync", "Message templates"],
//     connected: false,
//   },
//   {
//     id: "facebook",
//     name: "Facebook",
//     description: "Sync contacts from your Facebook Page and Messenger. Manage leads and conversations from one place.",
//     icon: (
//       <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
//         <rect width="32" height="32" rx="8" fill="#1877F2" />
//         <path d="M22 16c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 2.994 2.193 5.477 5.063 5.93V17.89h-1.524V16h1.524v-1.322c0-1.504.896-2.334 2.267-2.334.657 0 1.344.117 1.344.117v1.477h-.757c-.746 0-.977.463-.977.938V16h1.664l-.266 1.89h-1.398v4.04C19.807 21.477 22 18.994 22 16z" fill="white"/>
//       </svg>
//     ),
//     color: "blue",
//     badge: "Available",
//     badgeColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
//     features: ["Page contact sync", "Messenger integration", "Lead ads import", "Comment tracking"],
//     connected: false,
//   },
//   {
//     id: "instagram",
//     name: "Instagram",
//     description: "Connect Instagram Business to capture DMs, story replies, and follower interactions as contacts.",
//     icon: (
//       <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
//         <rect width="32" height="32" rx="8" fill="url(#ig-grad)"/>
//         <defs>
//           <linearGradient id="ig-grad" x1="0" y1="32" x2="32" y2="0">
//             <stop offset="0%" stopColor="#F58529"/>
//             <stop offset="50%" stopColor="#DD2A7B"/>
//             <stop offset="100%" stopColor="#8134AF"/>
//           </linearGradient>
//         </defs>
//         <rect x="9" y="9" width="14" height="14" rx="4" stroke="white" strokeWidth="1.5" fill="none"/>
//         <circle cx="16" cy="16" r="3.5" stroke="white" strokeWidth="1.5" fill="none"/>
//         <circle cx="20.5" cy="11.5" r="1" fill="white"/>
//       </svg>
//     ),
//     color: "pink",
//     badge: "Available",
//     badgeColor: "bg-pink-500/15 text-pink-400 border-pink-500/30",
//     features: ["DM capture", "Story reply tracking", "Follower import", "Comment monitoring"],
//     connected: false,
//   },
//   {
//     id: "telegram",
//     name: "Telegram",
//     description: "Link your Telegram bot to manage group contacts, collect subscriber info, and send automated messages.",
//     icon: (
//       <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
//         <rect width="32" height="32" rx="8" fill="#229ED9"/>
//         <path d="M23.5 9.5L6.5 16.1c-.8.3-.8.8-.1 1l4.3 1.3 1.7 5.2c.2.6.5.8.9.8.3 0 .5-.1.8-.4l2.4-2.3 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.5-1.8-1.6-1.3z" fill="white" fillOpacity=".9"/>
//         <path d="M13.5 19.8l-.4 4c.5 0 .8-.2 1.1-.5l2.5-2.4-3.2-1.1z" fill="white" fillOpacity=".6"/>
//       </svg>
//     ),
//     color: "sky",
//     badge: "Coming Soon",
//     badgeColor: "bg-gray-500/15 text-gray-400 border-gray-700",
//     features: ["Bot integration", "Group sync", "Broadcast lists", "Auto-replies"],
//     connected: false,
//     disabled: true,
//   },
// ];

// // ─── WhatsApp Connect Modal ───────────────────────────────────────────────────
// const WhatsAppModal = ({ onClose, onConnected }) => {
//   const [step, setStep]       = useState(1); // 1=intro, 2=qr, 3=success
//   const [scanning, setScanning] = useState(false);

//   const startScan = () => {
//     setScanning(true);
//     // Simulate QR scan after 3s
//     setTimeout(() => { setStep(3); setScanning(false); }, 3000);
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
//       <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md mx-4 shadow-2xl overflow-hidden animate-scaleIn" onClick={(e) => e.stopPropagation()}>

//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
//           <div className="flex items-center gap-3">
//             <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
//               <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
//                 <path d="M22.003 19.232c-.277-.14-1.637-.813-1.89-.906-.254-.092-.439-.139-.624.14-.185.277-.717.905-.879 1.09-.162.185-.323.208-.6.07-.277-.14-1.17-.433-2.228-1.381-.824-.737-1.38-1.647-1.542-1.924-.162-.277-.017-.427.122-.565.124-.124.277-.323.416-.485.138-.162.185-.277.277-.462.093-.185.047-.347-.023-.485-.07-.139-.624-1.503-.854-2.058-.225-.54-.454-.467-.624-.476l-.531-.009c-.185 0-.485.07-.739.347-.254.277-.97.948-.97 2.312 0 1.363.993 2.681 1.131 2.866.138.185 1.955 2.985 4.737 4.187.662.285 1.178.456 1.58.583.663.211 1.267.181 1.744.11.532-.08 1.637-.67 1.868-1.317.231-.647.231-1.202.162-1.317-.07-.116-.254-.185-.531-.324z" fill="#25D366"/>
//                 <path d="M16 5C10.477 5 6 9.477 6 15c0 1.9.53 3.674 1.45 5.188L6 27l6.977-1.423A9.953 9.953 0 0016 26c5.523 0 10-4.477 10-10S21.523 5 16 5z" fill="none" stroke="#25D366" strokeWidth="1.5"/>
//               </svg>
//             </div>
//             <div>
//               <h3 className="font-bold text-sm text-white">Connect WhatsApp</h3>
//               <p className="text-xs text-gray-500">Step {step} of 3</p>
//             </div>
//           </div>
//           <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">✕</button>
//         </div>

//         {/* Step Indicator */}
//         <div className="flex gap-1.5 px-6 pt-4">
//           {[1,2,3].map((s) => (
//             <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-emerald-500" : "bg-gray-700"}`} />
//           ))}
//         </div>

//         {/* Step 1 — Intro */}
//         {step === 1 && (
//           <div className="px-6 py-5 flex flex-col gap-5">
//             <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col gap-3">
//               <p className="text-sm font-semibold text-gray-200">Before you connect, make sure:</p>
//               {[
//                 "You have WhatsApp Business installed on your phone",
//                 "Your number is active and verified",
//                 "You have stable internet on both devices",
//               ].map((item, i) => (
//                 <div key={i} className="flex items-start gap-2.5 text-sm text-gray-400">
//                   <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
//                   {item}
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => setStep(1)} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
//               Continue → 
//             </button>
//           </div>
//         )}

//         {/* Step 2 — QR */}
//         {step === 2 && (
//           <div className="px-6 py-5 flex flex-col gap-4 items-center">
//             <p className="text-sm text-gray-400 text-center">Open WhatsApp → Linked Devices → Scan this QR code</p>

//             {/* QR Placeholder */}
//             <div className="relative w-48 h-48 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
//               {/* Fake QR pattern */}
//               <div className="grid grid-cols-7 gap-0.5 p-3">
//                 {Array.from({ length: 49 }).map((_, i) => (
//                   <div key={i} className={`w-4 h-4 rounded-sm ${[0,1,2,3,4,5,6,7,13,14,20,21,27,28,29,30,31,32,33,34,41,42,43,44,45,46,47,48,8,15,22,10,17,24,38,11,18,25,37].includes(i) ? "bg-gray-900" : "bg-white"}`} />
//                 ))}
//               </div>
//               {scanning && (
//                 <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center gap-2">
//                   <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
//                   <span className="text-xs text-gray-500 font-mono">Verifying…</span>
//                 </div>
//               )}
//             </div>

//             <p className="text-xs text-gray-500 font-mono text-center">QR expires in 60 seconds</p>
//             <div className="flex gap-3 w-full">
//               <button onClick={() => setStep(1)} className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors">Back</button>
//               <button onClick={startScan} disabled={scanning}
//                 className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60">
//                 {scanning ? "Scanning…" : "Simulate Scan ✓"}
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Step 3 — Success */}
//         {step === 3 && (
//           <div className="px-6 py-8 flex flex-col items-center gap-5">
//             <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/40 flex items-center justify-center animate-scaleIn">
//               <span className="text-3xl">✓</span>
//             </div>
//             <div className="text-center">
//               <h4 className="font-bold text-lg text-white">WhatsApp Connected!</h4>
//               <p className="text-sm text-gray-400 mt-1">Your WhatsApp Business account is now linked and ready to use.</p>
//             </div>
//             <div className="w-full bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
//               {["Contacts will sync automatically", "You can now send messages", "Import existing chats"].map((f) => (
//                 <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
//                   <span className="text-emerald-400 text-xs">✓</span> {f}
//                 </div>
//               ))}
//             </div>
//             <button onClick={() => { onConnected("whatsapp"); onClose(); }}
//               className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity">
//               Done
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// // ─── Integration Card ─────────────────────────────────────────────────────────
// const IntegrationCard = ({ integration, onConnect, onDisconnect }) => {
//   const isConnected = integration.connected;
//   const isDisabled  = integration.disabled;

//   const colorMap = {
//     emerald: { glow: "hover:border-emerald-500/40 hover:shadow-emerald-900/20", connected: "border-emerald-500/30 bg-emerald-500/5" },
//     blue:    { glow: "hover:border-blue-500/40 hover:shadow-blue-900/20",       connected: "border-blue-500/30 bg-blue-500/5" },
//     pink:    { glow: "hover:border-pink-500/40 hover:shadow-pink-900/20",       connected: "border-pink-500/30 bg-pink-500/5" },
//     sky:     { glow: "hover:border-sky-500/40",                                 connected: "border-sky-500/30 bg-sky-500/5" },
//   };
//   const c = colorMap[integration.color] || colorMap.emerald;

//   return (
//     <div className={`relative bg-gray-900 border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:shadow-lg
//       ${isConnected ? c.connected : "border-gray-800 " + c.glow}
//       ${isDisabled ? "opacity-60" : ""}`}>

//       {/* Connected glow dot */}
//       {isConnected && (
//         <span className="absolute top-4 right-4 flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
//           <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//           Connected
//         </span>
//       )}

//       {/* Header */}
//       <div className="flex items-start gap-4">
//         <div className="flex-shrink-0">{integration.icon}</div>
//         <div className="flex-1 min-w-0">
//           <div className="flex items-center gap-2 flex-wrap">
//             <h3 className="font-bold text-base text-white">{integration.name}</h3>
//             <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${integration.badgeColor}`}>
//               {integration.badge}
//             </span>
//           </div>
//           <p className="text-sm text-gray-400 mt-1 leading-relaxed">{integration.description}</p>
//         </div>
//       </div>

//       {/* Features */}
//       <div className="grid grid-cols-2 gap-1.5">
//         {integration.features.map((f) => (
//           <div key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
//             <span className="text-gray-600">▸</span> {f}
//           </div>
//         ))}
//       </div>

//       {/* Divider */}
//       <div className="border-t border-gray-800" />

//       {/* Action */}
//       {isConnected ? (
//         <div className="flex gap-2">
//           <div className="flex-1 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold text-center">
//             ✓ Active
//           </div>
//           <button
//             onClick={() => onDisconnect(integration.id)}
//             className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all">
//             Disconnect
//           </button>
//         </div>
//       ) : (
//         <button
//           disabled={isDisabled}
//           onClick={() => !isDisabled && onConnect(integration.id)}
//           className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all
//             ${isDisabled
//               ? "bg-gray-800 text-gray-600 cursor-not-allowed border border-gray-700"
//               : integration.color === "emerald"
//                 ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:opacity-90 shadow-lg shadow-emerald-900/20"
//                 : integration.color === "blue"
//                   ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90"
//                   : "bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:opacity-90"
//             }`}>
//           {isDisabled ? "Coming Soon" : `Connect ${integration.name}`}
//         </button>
//       )}
//     </div>
//   );
// };

// // ─── Main Integrations Page ───────────────────────────────────────────────────
// export default function Integrations() {
//   const [integrations, setIntegrations] = useState(INTEGRATIONS);
//   const [activeModal,  setActiveModal]  = useState(null);

//   const handleConnect = (id) => {
//     if (id === "whatsapp") setActiveModal("whatsapp");
//   };

//   const handleConnected = (id) => {
//     setIntegrations((prev) =>
//       prev.map((i) => i.id === id ? { ...i, connected: true } : i)
//     );
//   };

//   const handleDisconnect = (id) => {
//     setIntegrations((prev) =>
//       prev.map((i) => i.id === id ? { ...i, connected: false } : i)
//     );
//   };

//   const connectedCount = integrations.filter((i) => i.connected).length;

//   return (
//     <div className="min-h-screen text-gray-100 p-6">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
//         * { font-family: 'Plus Jakarta Sans', sans-serif; }
//         @keyframes scaleIn { from { opacity:0; transform:scale(.96); } to { opacity:1; transform:scale(1); } }
//         @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
//         .animate-scaleIn { animation: scaleIn .2s ease both; }
//         .animate-fadeUp  { animation: fadeUp  .2s ease both; }
//       `}</style>

//       <div className="max-w-4xl mx-auto flex flex-col gap-7">

//         {/* ── Page Header ── */}
//         <div className="flex items-start justify-between flex-wrap gap-4 animate-fadeUp">
//           <div>
            
//             <h1 className="text-2xl font-extrabold tracking-tight text-white">Integrations</h1>
//             <p className="text-sm text-gray-400 mt-1">Connect your messaging platforms to sync contacts and automate outreach.</p>
//           </div>

//           {/* Summary Badge */}
//           <div className="flex items-center gap-3">
//             <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-center">
//               <div className="text-lg font-black text-white">{connectedCount}</div>
//               <div className="text-xs text-gray-500 font-mono">Connected</div>
//             </div>
//             <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-center">
//               <div className="text-lg font-black text-white">{integrations.length - connectedCount}</div>
//               <div className="text-xs text-gray-500 font-mono">Available</div>
//             </div>
//           </div>
//         </div>

//         {/* ── Info Banner ── */}
//         <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl px-5 py-3.5 flex items-start gap-3 animate-fadeUp">
//           <span className="text-violet-400 text-lg mt-0.5 flex-shrink-0">ℹ</span>
//           <p className="text-sm text-gray-300">
//             Connected integrations will automatically sync new contacts and allow sending messages directly from your dashboard.
//             <span className="text-violet-400 font-semibold cursor-pointer ml-1 hover:underline">Learn more →</span>
//           </p>
//         </div>

//         {/* ── Grid ── */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           {integrations.map((integration, i) => (
//             <div key={integration.id} style={{ animationDelay: `${i * 60}ms` }} className="animate-fadeUp">
//               <IntegrationCard
//                 integration={integration}
//                 onConnect={handleConnect}
//                 onDisconnect={handleDisconnect}
//               />
//             </div>
//           ))}
//         </div>

//         {/* ── Request Integration ── */}
//         <div className="border border-dashed border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left animate-fadeUp">
//           <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-2xl flex-shrink-0">🔌</div>
//           <div className="flex-1">
//             <h4 className="font-bold text-sm text-white">Need a different integration?</h4>
//             <p className="text-xs text-gray-500 mt-0.5">Tell us which platform you want and we'll prioritize it in our roadmap.</p>
//           </div>
//           <button className="flex-shrink-0 px-4 py-2 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all whitespace-nowrap">
//             Request Integration
//           </button>
//         </div>
//       </div>

//       {/* ── WhatsApp Modal ── */}
//       {activeModal === "whatsapp" && (
//         <WhatsAppModal
//           onClose={() => setActiveModal(null)}
//           onConnected={handleConnected}
//         />
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

// ─── WhatsApp Business Integration Component ──────────────────────────────────
export default function WhatsAppIntegration() {
  const { data: session, status } = useSession();
  const [integrationStatus, setIntegrationStatus] = useState("disconnected"); // disconnected | connecting | connected
  const [showModal, setShowModal] = useState(false);
  const [fbAccount, setFbAccount] = useState(null);
  const [waNumber,  setWaNumber]  = useState(null);
  const [step,      setStep]      = useState(1); // 1=auth, 2=select, 3=confirm
  const [loading,   setLoading]   = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);

  // Check existing Facebook integration on component mount
  useEffect(() => {
    if (session) {
      checkFacebookIntegration();
    }
  }, [session]);

  const checkFacebookIntegration = async () => {
    try {
      const response = await fetch('/api/facebook/connect');
      const data = await response.json();
      
      if (data.connected) {
        setIntegrationStatus("connected");
        setFbAccount({ 
          name: data.pageName, 
          id: data.pageId, 
          avatar: data.pageName?.substring(0, 2).toUpperCase() || "FB" 
        });
        setWaNumber({ phone: "+91 98765 43210", display: "+91 98765 43210", verified: true });
      }
    } catch (error) {
      console.error("Error checking Facebook integration:", error);
    }
  };

  // ── Handle Facebook OAuth ─────────────────────────────────────────────────
  const handleFacebookAuth = async () => {
    setLoading(true);
    
    try {
      // Sign in with Facebook using NextAuth
      const result = await signIn('facebook', { 
        redirect: false,
        callbackUrl: window.location.href
      });
      
      if (result?.ok) {
        // After successful auth, fetch user's pages
        await fetchFacebookPages();
        setStep(2);
      } else {
        console.error("Facebook auth failed:", result?.error);
      }
    } catch (error) {
      console.error("Facebook auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacebookPages = async () => {
    try {
      // Get access token from session (you might need to modify this based on your NextAuth setup)
      const response = await fetch('/api/facebook/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: session?.accessToken })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFbPages(data.pages);
      }
    } catch (error) {
      console.error("Error fetching Facebook pages:", error);
    }
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setFbAccount({ name: page.name, id: page.id, avatar: page.name.substring(0, 2).toUpperCase() });
    setWaNumber({ phone: "+91 98765 43210", display: "+91 98765 43210", verified: true });
    setStep(3);
  };

  const handleSaveConnection = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/facebook/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: selectedPage.accessToken,
          pageId: selectedPage.id,
          pageName: selectedPage.name
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIntegrationStatus("connected");
        setShowModal(false);
        setStep(1);
      }
    } catch (error) {
      console.error("Error saving Facebook connection:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/facebook/connect', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setIntegrationStatus("disconnected");
        setFbAccount(null);
        setWaNumber(null);
        setSelectedPage(null);
        setStep(1);
        
        // Also sign out from NextAuth if needed
        await signOut({ redirect: false });
      }
    } catch (error) {
      console.error("Error disconnecting Facebook:", error);
    }
  };

  const openModal = () => { setShowModal(true); setStep(integrationStatus === "connected" ? 2 : 1); };
  const closeModal = () => { if (!loading) { setShowModal(false); } };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6 flex items-start justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn { from{opacity:0;transform:scale(.96)}      to{opacity:1;transform:scale(1)} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        .animate-fadeUp  { animation: fadeUp  .22s ease both }
        .animate-scaleIn { animation: scaleIn .2s  ease both }
        .spin { animation: spin 1s linear infinite }
      `}</style>

      <div className="w-full max-w-2xl flex flex-col gap-6 animate-fadeUp">

        {/* ── Page Title ── */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-gray-500 uppercase tracking-widest">
            Integrations <span className="text-gray-700">/</span> <span className="text-green-400">WhatsApp</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Connect WhatsApp Business</h1>
          <p className="text-sm text-gray-400 mt-1">Connect with customers on their favorite messaging app. Send updates, support messages, and more directly through WhatsApp.</p>
        </div>

        {/* ── Featured Card ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

          {/* Card Header Label */}
          <div className="px-5 pt-4 pb-1">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Featured</span>
          </div>

          {/* Main Card */}
          <div className="p-5">
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">

              {/* Top Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* WA Icon */}
                  <div className="w-14 h-14 rounded-2xl bg-[#128C7E] flex items-center justify-center shadow-lg shadow-green-900/30 flex-shrink-0">
                    <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
                      <path d="M22.003 19.232c-.277-.14-1.637-.813-1.89-.906-.254-.092-.439-.139-.624.14-.185.277-.717.905-.879 1.09-.162.185-.323.208-.6.07-.277-.14-1.17-.433-2.228-1.381-.824-.737-1.38-1.647-1.542-1.924-.162-.277-.017-.427.122-.565.124-.124.277-.323.416-.485.138-.162.185-.277.277-.462.093-.185.047-.347-.023-.485-.07-.139-.624-1.503-.854-2.058-.225-.54-.454-.467-.624-.476l-.531-.009c-.185 0-.485.07-.739.347-.254.277-.97.948-.97 2.312 0 1.363.993 2.681 1.131 2.866.138.185 1.955 2.985 4.737 4.187.662.285 1.178.456 1.58.583.663.211 1.267.181 1.744.11.532-.08 1.637-.67 1.868-1.317.231-.647.231-1.202.162-1.317-.07-.116-.254-.185-.531-.324z" fill="white"/>
                      <path d="M16 4C9.373 4 4 9.373 4 16c0 2.126.557 4.123 1.532 5.855L4 28l6.347-1.505A11.944 11.944 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z" fill="none" stroke="white" strokeWidth="1.5"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-white">WhatsApp Business</h2>
                    <p className="text-sm text-gray-400 mt-0.5 max-w-xs">
                      Connect with customers on their favorite messaging app. Send updates, support messages, and more…
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                {integrationStatus === "connected" && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full flex-shrink-0 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Connected
                  </div>
                )}
              </div>

              {/* Connected Info */}
              {integrationStatus === "connected" && fbAccount && (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 animate-fadeUp">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                    {fbAccount.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{fbAccount.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{waNumber?.phone}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-500/15 text-green-400 rounded-full border border-green-500/30 font-semibold">Verified ✓</span>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-gray-800" />

              {/* Action Buttons */}
              <div className="flex gap-3">
                {integrationStatus === "connected" ? (
                  <>
                    <button onClick={openModal}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 hover:border-gray-600 transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/></svg>
                      Manage
                    </button>
                    <button onClick={handleDisconnect}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/></svg>
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button onClick={openModal}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors shadow-lg shadow-orange-900/30">
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── What you can do ── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">What you can do with WhatsApp Business</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: "📣", label: "Broadcast Campaigns", desc: "Send bulk messages to your contact list" },
              { icon: "🔄", label: "Auto-sync Contacts", desc: "Import WhatsApp contacts automatically" },
              { icon: "💬", label: "Two-way Messaging", desc: "Receive and reply to customer messages" },
              { icon: "📊", label: "Campaign Analytics", desc: "Track delivery, read rates and replies" },
            ].map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl">
                <span className="text-xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-200">{f.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Connection Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn overflow-hidden" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
              <div className="w-8 h-8 rounded-lg bg-[#128C7E] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
                  <path d="M22.003 19.232c-.277-.14-1.637-.813-1.89-.906-.254-.092-.439-.139-.624.14-.185.277-.717.905-.879 1.09-.162.185-.323.208-.6.07-.277-.14-1.17-.433-2.228-1.381-.824-.737-1.38-1.647-1.542-1.924-.162-.277-.017-.427.122-.565.124-.124.277-.323.416-.485.138-.162.185-.277.277-.462.093-.185.047-.347-.023-.485-.07-.139-.624-1.503-.854-2.058-.225-.54-.454-.467-.624-.476l-.531-.009c-.185 0-.485.07-.739.347-.254.277-.97.948-.97 2.312 0 1.363.993 2.681 1.131 2.866.138.185 1.955 2.985 4.737 4.187.662.285 1.178.456 1.58.583.663.211 1.267.181 1.744.11.532-.08 1.637-.67 1.868-1.317.231-.647.231-1.202.162-1.317-.07-.116-.254-.185-.531-.324z" fill="white"/>
                  <path d="M16 4C9.373 4 4 9.373 4 16c0 2.126.557 4.123 1.532 5.855L4 28l6.347-1.505A11.944 11.944 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z" fill="none" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">WhatsApp Business</h3>
                <p className="text-xs text-gray-500">
                  {status === "connected" ? "Manage your connection" : step === 1 ? "Authenticate via Facebook" : "Confirm connection"}
                </p>
              </div>
              <button onClick={closeModal} disabled={loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-40">✕</button>
            </div>

            {/* Step Progress */}
            <div className="flex gap-1 px-6 pt-4">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? "bg-green-500" : "bg-gray-800"}`} />
              ))}
            </div>

            {/* ── STEP 1: Facebook Auth ── */}
            {step === 1 && (
              <div className="px-6 py-5 flex flex-col gap-5 animate-fadeUp">
                <div className="flex flex-col gap-2 text-center">
                  <div className="text-3xl">🔐</div>
                  <h4 className="font-bold text-base text-white">Authenticate with Facebook</h4>
                  <p className="text-sm text-gray-400">WhatsApp Business API requires a Facebook Business account. Sign in to continue.</p>
                </div>

                {/* Permissions list */}
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Permissions requested</p>
                  {[
                    { icon: "📱", text: "Access WhatsApp Business Account" },
                    { icon: "📋", text: "Read & manage contacts" },
                    { icon: "📤", text: "Send messages on your behalf" },
                    { icon: "📊", text: "View message analytics" },
                  ].map((p) => (
                    <div key={p.text} className="flex items-center gap-2.5 text-sm text-gray-300">
                      <span className="text-base">{p.icon}</span>
                      {p.text}
                    </div>
                  ))}
                </div>

                {/* Facebook Auth Button */}
                <button onClick={handleFacebookAuth} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#1565D8] text-white font-bold text-sm transition-colors disabled:opacity-60 shadow-lg shadow-blue-900/30">
                  {loading ? (
                    <svg className="w-5 h-5 spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity=".3" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  {loading ? "Connecting to Facebook…" : "Continue with Facebook"}
                </button>

                <p className="text-xs text-gray-600 text-center">
                  By connecting, you agree to WhatsApp's{" "}
                  <span className="text-gray-400 hover:text-white cursor-pointer underline underline-offset-2">Terms of Service</span>
                </p>

                <button onClick={closeModal} disabled={loading}
                  className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors disabled:opacity-40">
                  Cancel
                </button>
              </div>
            )}

            {/* ── STEP 2: Select Facebook Page ── */}
            {step === 2 && (
              <div className="px-6 py-5 flex flex-col gap-4 animate-fadeUp">
                <p className="text-sm text-gray-400">Select a Facebook Page to connect with WhatsApp Business.</p>

                {/* Pages List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {fbPages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => handlePageSelect(page)}
                      className="w-full bg-gray-800/60 border border-gray-700 hover:border-blue-500/40 rounded-xl p-4 flex items-center gap-3 transition-all text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                        {page.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{page.name}</div>
                        <div className="text-xs text-gray-400">{page.category}</div>
                      </div>
                      <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full font-semibold">Page</span>
                    </button>
                  ))}
                </div>

                {fbPages.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-3xl mb-2">📄</div>
                    <p className="text-sm">No Facebook Pages found</p>
                    <p className="text-xs mt-1">Make sure you have admin access to at least one Facebook Page.</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: Confirm Connection ── */}
            {step === 3 && fbAccount && (
              <div className="px-6 py-5 flex flex-col gap-4 animate-fadeUp">
                <p className="text-sm text-gray-400">We found the following WhatsApp Business account linked to your Facebook profile.</p>

                {/* FB Account Row */}
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                    {fbAccount.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white">{fbAccount.name}</div>
                    <div className="text-xs text-gray-400 font-mono">{fbAccount.id}</div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full font-semibold">Facebook</span>
                </div>

                {/* WA Number Row */}
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 flex flex-col gap-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">WhatsApp Business Number</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#128C7E] flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
                        <path d="M22.003 19.232c-.277-.14-1.637-.813-1.89-.906-.254-.092-.439-.139-.624.14-.185.277-.717.905-.879 1.09-.162.185-.323.208-.6.07-.277-.14-1.17-.433-2.228-1.381-.824-.737-1.38-1.647-1.542-1.924-.162-.277-.017-.427.122-.565.124-.124.277-.323.416-.485.138-.162.185-.277.277-.462.093-.185.047-.347-.023-.485-.07-.139-.624-1.503-.854-2.058-.225-.54-.454-.467-.624-.476l-.531-.009c-.185 0-.485.07-.739.347-.254.277-.97.948-.97 2.312 0 1.363.993 2.681 1.131 2.866.138.185 1.955 2.985 4.737 4.187.662.285 1.178.456 1.58.583.663.211 1.267.181 1.744.11.532-.08 1.637-.67 1.868-1.317.231-.647.231-1.202.162-1.317-.07-.116-.254-.185-.531-.324z" fill="white"/>
                        <path d="M16 4C9.373 4 4 9.373 4 16c0 2.126.557 4.123 1.532 5.855L4 28l6.347-1.505A11.944 11.944 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z" fill="none" stroke="white" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-white font-mono">{waNumber.phone}</div>
                      <div className="text-xs text-gray-400">WhatsApp Business API</div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full font-semibold">✓ Verified</span>
                  </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                  <span className="text-yellow-400 flex-shrink-0 mt-0.5">⚠</span>
                  Saving this connection will allow your dashboard to send messages using this WhatsApp number.
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button onClick={closeModal} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-40">
                    Cancel
                  </button>
                  <button onClick={handleSaveConnection} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-teal-600 text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity=".3" strokeWidth="3"/>
                          <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                        </svg>
                        Saving…
                      </>
                    ) : "Save Connection"}
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3 handled inline via status === connected ── */}
          </div>
        </div>
      )}
    </div>
  );
}