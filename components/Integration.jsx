"use client";
// app/(dashboard)/integrations/page.jsx

import { useState, useEffect, useCallback } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

// ─── WhatsAppConnect (inline — no separate file import needed) ────────────────
// If you have WhatsAppConnect as a separate file, replace this with:
// import WhatsAppConnect from "@/components/WhatsAppConnect";
function WhatsAppConnect({
  onConnected,
  onDisconnected,
  onPhonesUpdate,
  initialBusinesses = [],
  initialPhones = {},
}) {
  const [sdkReady, setSdkReady] = useState(false);
  // If parent already has businesses, show connected immediately
  const [status, setStatus] = useState(
    initialBusinesses.length > 0 ? "connected" : "loading"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [businesses, setBusinesses] = useState(initialBusinesses); // ← seeded from parent
  const [phones, setPhones] = useState(initialPhones); // ← seeded from parent (includes any already-fetched numbers)
  const [loadingBiz, setLoadingBiz] = useState(null);

  // Load FB SDK
  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = () => {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: "v19.0",
        status: true,
        oauth: true,
      });
      setSdkReady(true);
    };
    if (window.FB) {
      init();
      return;
    }
    window.fbAsyncInit = init;
    if (!document.getElementById("facebook-jssdk")) {
      const s = document.createElement("script");
      s.id = "facebook-jssdk";
      s.src = "https://connect.facebook.net/en_US/sdk.js";
      s.async = true;
      s.defer = true;
      s.crossOrigin = "anonymous";
      document.body.appendChild(s);
    }
  }, []);

  // Check existing connection on mount — skip if parent already gave us businesses
  useEffect(() => {
    if (initialBusinesses.length > 0) {
      // Parent already has businesses, we're in "manage" mode
      return;
    }
    fetch("/api/whatsapp/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.connected && d.businesses) {
          setBusinesses(d.businesses);
          setStatus("connected");
          onConnected?.(d.businesses);
        } else {
          setStatus("disconnected");
        }
      })
      .catch(() => setStatus("disconnected"));
  }, [initialBusinesses.length, onConnected]);

  // Connect — calls API which uses stored system token (no popup in this flow)
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/whatsapp/connect");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      setBusinesses(data.businesses);
      setStatus("connected");
      onConnected?.(data.businesses); // ← notify parent immediately
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch phone numbers for a business
  const handleGetNumbers = async (businessId) => {
    setLoadingBiz(businessId);
    try {
      const wabaRes = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const wabaData = await wabaRes.json();
      const wabaId = wabaData.wabas?.[0]?.id;
      if (!wabaId) throw new Error("No WABA found for this business");

      const phoneRes = await fetch("/api/whatsapp/connect", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wabaId }),
      });
      const phoneData = await phoneRes.json();
      const updatedPhones = phoneData.phones;
      setPhones((prev) => ({ ...prev, [businessId]: updatedPhones }));
      onPhonesUpdate?.(businessId, updatedPhones); // ← lift to parent so it persists
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBiz(null);
    }
  };

  // Disconnect — clears everything, parent must call connect again to see businesses
  const handleDisconnect = useCallback(async () => {
    await fetch("/api/whatsapp/connect", { method: "DELETE" }).catch(() => {});
    setStatus("disconnected");
    setBusinesses([]); // ← clear businesses; user must reconnect to see them again
    setPhones({});
    setError(null);
    onDisconnected?.(); // ← notify parent
  }, [onDisconnected]);

  return (
    <>
      <style>{WA_CSS}</style>
      <div className="wa-card">
        {/* Header */}
        <div className="wa-header">
          <div className="wa-logo">
            <WaIconLg />
          </div>
          <div className="wa-header-copy">
            <div className="wa-title">WhatsApp Business</div>
            <div className="wa-sub">
              Connect your account via Meta Embedded Signup
            </div>
          </div>
          {status === "connected" && (
            <div className="wa-live-badge">
              <span className="wa-pulse-dot" /> Live
            </div>
          )}
        </div>

        <div className="wa-rule" />

        {/* Error */}
        {error && (
          <div className="wa-alert">
            <svg
              width="15"
              height="15"
              viewBox="0 0 20 20"
              fill="currentColor"
              style={{ flexShrink: 0 }}
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Skeleton */}
        {status === "loading" && (
          <div className="wa-shimmer-wrap">
            <div className="wa-shimmer" style={{ width: "55%" }} />
            <div className="wa-shimmer" style={{ width: "38%" }} />
          </div>
        )}

        {/* Business list — shown immediately after connect, cleared after disconnect */}
        {status === "connected" && businesses.length > 0 && (
          <div className="wa-biz-section">
            <div className="wa-label">
              CONNECTED BUSINESSES ({businesses.length})
            </div>
            <div className="wa-biz-grid">
              {businesses.map((biz, i) => (
                <div
                  key={biz.id}
                  className="wa-biz-card"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className="wa-biz-header">
                    <div className="wa-biz-avatar">
                      {biz.name?.substring(0, 2).toUpperCase() || "WA"}
                    </div>
                    <div className="wa-biz-info">
                      <div className="wa-biz-name">{biz.name}</div>
                      <span className="wa-status-badge">Active</span>
                    </div>
                  </div>

                  <div className="wa-biz-content">
                    {phones[biz.id] ? (
                      phones[biz.id].length > 0 ? (
                        <div className="wa-phone-list">
                          <div className="wa-phone-label">Phone Numbers:</div>
                          {phones[biz.id].map((p) => (
                            <div key={p.id} className="wa-phone-item">
                              <PhoneIconSm />
                              <span className="wa-phone-number">
                                {p.display_phone_number}
                              </span>
                              <span className="wa-phone-status">Verified</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="wa-phone-list">
                          <div className="wa-phone-label">Phone Numbers:</div>
                          <div className="wa-no-phones">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="wa-no-phones-icon"
                            >
                              <path
                                fillRule="evenodd"
                                d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span>No numbers found</span>
                          </div>
                        </div>
                      )
                    ) : (
                      <button
                        className="wa-load-phones-btn"
                        onClick={() => handleGetNumbers(biz.id)}
                        disabled={loadingBiz === biz.id}
                      >
                        {loadingBiz === biz.id ? (
                          <>
                            <WaSpin size={14} /> Loading numbers...
                          </>
                        ) : (
                          <>
                            <PhoneIconSm /> Load phone numbers
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connected but no businesses */}
        {status === "connected" && businesses.length === 0 && (
          <div className="wa-empty">
            <div style={{ fontSize: 28 }}>🏢</div>
            <div className="wa-empty-msg">
              No businesses found on this account.
            </div>
          </div>
        )}

        {/* Actions */}
        {status === "connected" ? (
          <div className="wa-actions-connected">
            <button 
              className="wa-btn wa-btn-secondary" 
              onClick={() => window.open('/templates', '_blank')}
            >
              <TemplateIconSm /> View Templates
            </button>
            <button className="wa-btn wa-btn-danger" onClick={handleDisconnect}>
              <DisconnectIconSm /> Disconnect Account
            </button>
          </div>
        ) : status === "disconnected" ? (
          <div className="wa-cta">
            <button
              className="wa-btn wa-btn-primary"
              onClick={handleConnect}
              disabled={loading || !sdkReady}
            >
              {loading ? (
                <>
                  <WaSpin /> Connecting…
                </>
              ) : !sdkReady ? (
                <>
                  <WaSpin /> Loading SDK…
                </>
              ) : (
                <>
                  <WaIconSm /> Connect WhatsApp Business
                </>
              )}
            </button>
            <p className="wa-hint">
              A secure Meta popup will open — choose your existing WhatsApp
              Business account.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATIONS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function IntegrationsPage() {
  return (
    <div className="min-h-screen text-gray-100 p-6 flex items-start justify-center">
      <style>{PAGE_CSS}</style>
      <div className="w-full max-w-2xl flex flex-col gap-6 animate-fadeUp">
        {/* Breadcrumb + Title */}
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs font-mono text-gray-500 uppercase tracking-widest">
            Settings <span className="text-gray-700">/</span>
            <span className="text-blue-400">Integrations</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Integrations
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Connect your accounts to enable messaging and campaign features.
          </p>
        </div>

        {/* Facebook */}
        <FacebookIntegration />

        {/* WhatsApp Business */}
        <WhatsAppBusinessCard />

        {/* Feature grid */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white mb-3">
            What you can do once connected
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                icon: "📣",
                label: "Broadcast Campaigns",
                desc: "Send bulk messages to your contact list",
              },
              {
                icon: "🔄",
                label: "Auto-sync Contacts",
                desc: "Import contacts automatically",
              },
              {
                icon: "💬",
                label: "Two-way Messaging",
                desc: "Receive and reply to customer messages",
              },
              {
                icon: "📊",
                label: "Campaign Analytics",
                desc: "Track delivery, read rates and replies",
              },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-xl"
              >
                <span className="text-xl flex-shrink-0">{f.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-200">
                    {f.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FACEBOOK INTEGRATION CARD
// ═══════════════════════════════════════════════════════════════════════════════
function FacebookIntegration() {
  const { data: session, status } = useSession();
  const [integrationStatus, setIntegrationStatus] = useState("disconnected");
  const [showModal, setShowModal] = useState(false);
  const [fbAccount, setFbAccount] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fbPages, setFbPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);

  useEffect(() => {
    if (session?.user && status === "authenticated") {
      setIntegrationStatus("connected");
      setFbAccount({
        name: session.user.name || "Facebook User",
        id: session.user.id || "facebook_user",
        avatar: session.user.name?.substring(0, 2).toUpperCase() || "FB",
        email: session.user.email,
      });
      fetchFacebookPages();
    } else if (status === "unauthenticated") {
      setIntegrationStatus("disconnected");
      setFbAccount(null);
      setFbPages([]);
    }
  }, [session, status]);

  const fetchFacebookPages = async () => {
    try {
      const res = await fetch("/api/facebook/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) setFbPages(data.pages);
    } catch {}
  };

  const handleFacebookAuth = async () => {
    setLoading(true);
    try {
      const result = await signIn("facebook", {
        redirect: false,
        callbackUrl: window.location.href,
      });
      if (result?.ok) {
        await fetchFacebookPages();
        setStep(2);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handlePageSelect = (page) => {
    setSelectedPage(page);
    setFbAccount({
      name: page.name,
      id: page.id,
      avatar: page.name.substring(0, 2).toUpperCase(),
    });
    setStep(3);
  };

  const handleSaveConnection = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/facebook/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: selectedPage.accessToken,
          pageId: selectedPage.id,
          pageName: selectedPage.name,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIntegrationStatus("connected");
        setShowModal(false);
        setStep(1);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const res = await fetch("/api/facebook/connect", { method: "DELETE" });
      if (res.ok) {
        setIntegrationStatus("disconnected");
        setFbAccount(null);
        setSelectedPage(null);
        setStep(1);
        await signOut({ redirect: false });
      }
    } catch {}
  };

  return (
    <>
      <IntegrationCard
        icon={<FbIcon />}
        iconBg="#1877F2"
        iconShadow="shadow-blue-900/30"
        title="Facebook Integration"
        desc={
          integrationStatus === "connected"
            ? `Connected as ${fbAccount?.name}.`
            : "Connect your Facebook account to access pages."
        }
        isConnected={integrationStatus === "connected"}
        connectedBadge="Connected"
        account={
          fbAccount
            ? {
                name: fbAccount.name,
                sub: fbAccount.email,
                initials: fbAccount.avatar,
              }
            : null
        }
        onManage={() => {
          setShowModal(true);
          setStep(integrationStatus === "connected" ? 2 : 1);
        }}
        onDisconnect={handleDisconnect}
        onConnect={() => {
          setShowModal(true);
          setStep(1);
        }}
        connectLabel="Connect with Facebook"
        connectBg="#1877F2"
        connectHover="#1565D8"
        connectShadow="shadow-blue-900/30"
        connectIcon={<FbIcon sm />}
      />

      {showModal && (
        <Modal
          onClose={() => {
            if (!loading) setShowModal(false);
          }}
          icon={
            <div className="w-8 h-8 rounded-lg bg-[#1877F2] flex items-center justify-center">
              <FbIcon />
            </div>
          }
          title="Facebook Integration"
          subtitle={
            step === 1
              ? "Authenticate via Facebook"
              : step === 2
              ? "Select a page"
              : "Confirm"
          }
          steps={3}
          currentStep={step}
        >
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-fadeUp">
              <div className="text-center">
                <div className="text-3xl mb-2">🔐</div>
                <h4 className="font-bold text-base text-white">
                  Authenticate with Facebook
                </h4>
                <p className="text-sm text-gray-400 mt-1">
                  Sign in to link your Facebook Business account.
                </p>
              </div>
              <button
                onClick={handleFacebookAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-[#1877F2] hover:bg-[#1565D8] text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {loading ? <Spinner /> : <FbIcon />}
                {loading ? "Connecting…" : "Continue with Facebook"}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {step === 2 && (
            <div className="flex flex-col gap-4 animate-fadeUp">
              <p className="text-sm text-gray-400">
                Select a Facebook Page to connect.
              </p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {fbPages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => handlePageSelect(page)}
                    className="w-full bg-gray-800/60 border border-gray-700 hover:border-blue-500/40 rounded-xl p-4 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-sm font-black">
                      {page.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {page.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {page.category}
                      </div>
                    </div>
                  </button>
                ))}
                {fbPages.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No pages found. Make sure you have admin access.
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
          {step === 3 && fbAccount && (
            <div className="flex flex-col gap-4 animate-fadeUp">
              <p className="text-sm text-gray-400">Confirm the connection.</p>
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-sm font-black">
                  {fbAccount.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">
                    {fbAccount.name}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 rounded-xl p-3 border border-gray-700">
                <span className="text-yellow-400 mt-0.5">⚠</span>
                This will allow your dashboard to send messages using this
                account.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConnection}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Spinner /> Saving…
                    </>
                  ) : (
                    "Save Connection"
                  )}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WHATSAPP BUSINESS CARD
// ═══════════════════════════════════════════════════════════════════════════════
function WhatsAppBusinessCard() {
  const [showModal, setShowModal] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  // Businesses + phones live HERE so they survive modal open/close
  const [businesses, setBusinesses] = useState([]);
  const [phones, setPhones] = useState({}); // { [bizId]: [{ id, display_phone_number }] }

  // WhatsAppConnect calls this when connection succeeds — businesses arrive immediately
  const handleConnected = useCallback((bizList) => {
    setIsConnected(true);
    setBusinesses(bizList || []);
    // Don't auto-close modal - let user see the businesses and close manually
  }, []);

  // WhatsAppConnect calls this when phone numbers are fetched for a business
  // We lift the phones map up so it persists when modal reopens
  const handlePhonesUpdate = useCallback((bizId, phoneList) => {
    setPhones((prev) => ({ ...prev, [bizId]: phoneList }));
  }, []);

  // WhatsAppConnect calls this on disconnect — clear everything, require fresh connect
  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setBusinesses([]);
    setPhones({});
  }, []);

  const handleCardDisconnect = async () => {
    await fetch("/api/whatsapp/connect", { method: "DELETE" }).catch(() => {});
    handleDisconnected();
  };

  return (
    <>
      <IntegrationCard
        icon={<WaIconSm />}
        iconBg="#25D366"
        iconShadow="shadow-green-900/30"
        title="WhatsApp Business"
        desc={
          isConnected && businesses.length > 0
            ? `${businesses.length} business${
                businesses.length > 1 ? "es" : ""
              } connected`
            : isConnected
            ? "Connected — no businesses found"
            : "Connect your WhatsApp Business account via Meta."
        }
        isConnected={isConnected}
        connectedBadge="Connected"
        account={
          isConnected && businesses.length > 0
            ? {
                name: businesses[0].name,
                sub: `${businesses.length} business${
                  businesses.length > 1 ? "es" : ""
                }`,
                initials:
                  businesses[0].name?.substring(0, 2).toUpperCase() || "WA",
                green: true,
              }
            : null
        }
        onManage={() => setShowModal(true)}
        onDisconnect={handleCardDisconnect}
        onConnect={() => setShowModal(true)}
        connectLabel="Connect WhatsApp Business"
        connectBg="#25D366"
        connectHover="#20b857"
        connectShadow="shadow-green-900/30"
        connectIcon={<WaIconSm />}
      />

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          icon={
            <div className="w-8 h-8 rounded-lg bg-[#25D366] flex items-center justify-center">
              <WaIconSm />
            </div>
          }
          title="WhatsApp Business"
          subtitle={
            isConnected
              ? "Manage your connection"
              : "Connect via Meta Embedded Signup"
          }
        >
          {/* Info steps — only shown before first connect */}
          {!isConnected && (
            <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 flex flex-col gap-2 mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                What happens next
              </p>
              {[
                {
                  icon: "🔐",
                  text: "A Meta popup opens — log in with Facebook",
                },
                {
                  icon: "📱",
                  text: "Select your existing WhatsApp Business Account",
                },
                {
                  icon: "✅",
                  text: "Businesses appear immediately, no extra steps",
                },
                {
                  icon: "🚀",
                  text: "Start sending & receiving messages instantly",
                },
              ].map((p) => (
                <div
                  key={p.text}
                  className="flex items-start gap-2.5 text-sm text-gray-300"
                >
                  <span className="flex-shrink-0">{p.icon}</span> {p.text}
                </div>
              ))}
            </div>
          )}

          {/*
            Pass initialBusinesses + initialPhones so the modal always shows
            the already-fetched data when opened via "Manage".
            onPhonesUpdate lifts newly fetched phone numbers back to parent.
          */}
          <WhatsAppConnect
            initialBusinesses={businesses}
            initialPhones={phones}
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
            onPhonesUpdate={handlePhonesUpdate}
          />

          {/* Close button when connected */}
          {isConnected && (
            <div className="mt-4 pt-4 border-t border-gray-800">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </Modal>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Reusable integration card shell */
function IntegrationCard({
  icon,
  iconBg,
  iconShadow,
  title,
  desc,
  isConnected,
  connectedBadge,
  account,
  onManage,
  onDisconnect,
  onConnect,
  connectLabel,
  connectBg,
  connectHover,
  connectShadow,
  connectIcon,
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 pt-4 pb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Featured
        </span>
      </div>
      <div className="p-5">
        <div className="bg-gray-950 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}
                style={{ background: iconBg }}
              >
                {icon}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-white">{title}</h2>
                <p className="text-sm text-gray-400 mt-0.5 max-w-xs">{desc}</p>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/30 px-3 py-1.5 rounded-full flex-shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />{" "}
                {connectedBadge}
              </div>
            )}
          </div>

          {/* Account preview */}
          {isConnected && account && (
            <div
              className={`border rounded-xl p-4 flex items-center gap-3 animate-fadeUp ${
                account.green
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-green-500/5 border-green-500/20"
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-xs font-black flex-shrink-0">
                {account.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">
                  {account.name}
                </div>
                {account.sub && (
                  <div className="text-xs text-gray-400">{account.sub}</div>
                )}
              </div>
              <span className="text-xs px-2 py-1 bg-green-500/15 text-green-400 rounded-full border border-green-500/30 font-semibold">
                Verified ✓
              </span>
            </div>
          )}

          <div className="border-t border-gray-800" />

          {/* Action buttons */}
          <div className="flex gap-3">
            {isConnected ? (
              <>
                <button
                  onClick={onManage}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-700 text-sm font-semibold text-gray-300 hover:bg-gray-800 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Manage
                </button>
                {title === "WhatsApp Business" && (
                  <button
                    onClick={() => window.open('/templates', '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-500/30 text-sm font-semibold text-green-400 hover:bg-green-500/10 transition-all"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
                      <path d="M6 8h8v1H6V8zm0 2h8v1H6v-1zm0 2h5v1H6v-1z"/>
                    </svg>
                    Templates
                  </button>
                )}
                <button
                  onClick={onDisconnect}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Disconnect
                </button>
              </>
            ) : (
              <button
                onClick={onConnect}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white text-sm font-bold transition-colors shadow-lg ${connectShadow}`}
                style={{ background: connectBg }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = connectHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = connectBg)
                }
              >
                {connectIcon} {connectLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reusable modal */
function Modal({
  onClose,
  icon,
  title,
  subtitle,
  steps,
  currentStep,
  children,
}) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/75 backdrop-blur-sm p-4 pt-24 pb-8"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[70vh] shadow-2xl animate-scaleIn overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-800">
          {icon}
          <div className="flex-1">
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step progress bar */}
        {steps && (
          <div className="flex gap-1 px-6 pt-4">
            {Array.from({ length: steps }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                  currentStep > i ? "bg-blue-500" : "bg-gray-800"
                }`}
              />
            ))}
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}

// ── Small icon components ──────────────────────────────────────────────────────
function FbIcon({ sm } = {}) {
  const s = sm ? "w-4 h-4" : "w-8 h-8";
  return (
    <svg viewBox="0 0 32 32" fill="none" className={s}>
      <path
        d="M22 16c0-3.314-2.686-6-6-6s-6 2.686-6 6c0 2.994 2.193 5.477 5.063 5.93V17.89h-1.524V16h1.524v-1.322c0-1.504.896-2.334 2.267-2.334.657 0 1.344.117 1.344.117v1.477h-.757c-.746 0-.977.463-.977.938V16h1.664l-.266 1.89h-1.398v4.04C19.807 21.477 22 18.994 22 16z"
        fill="white"
      />
    </svg>
  );
}
function WaIconSm() {
  return (
    <svg width="18" height="18" viewBox="0 0 36 36" fill="none">
      <path
        d="M24.5 11.5A9.46 9.46 0 0018 9C12.477 9 8 13.477 8 19a9.948 9.948 0 001.38 5.02L8 27l3.08-1.35A9.947 9.947 0 0018 27c5.523 0 10-4.477 10-10a9.46 9.46 0 00-3.5-7.5z"
        stroke="white"
        strokeWidth="1.8"
        fill="white"
        fillOpacity=".15"
      />
      <path
        d="M22.8 20.6c-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.15-.68-.61-1.15-1.37-1.28-1.6-.14-.23-.01-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4l-.44-.01c-.15 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.94 2.39c.12.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.45.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.27z"
        fill="white"
      />
    </svg>
  );
}
function WaIconLg() {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <path
        d="M24.5 11.5A9.46 9.46 0 0018 9C12.477 9 8 13.477 8 19a9.948 9.948 0 001.38 5.02L8 27l3.08-1.35A9.947 9.947 0 0018 27c5.523 0 10-4.477 10-10a9.46 9.46 0 00-3.5-7.5z"
        fill="white"
        fillOpacity=".2"
        stroke="white"
        strokeWidth="1.4"
      />
      <path
        d="M22.8 20.6c-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.15-.68-.61-1.15-1.37-1.28-1.6-.14-.23-.01-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4l-.44-.01c-.15 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.94 2.39c.12.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.45.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.27z"
        fill="white"
      />
    </svg>
  );
}
function PhoneIconSm() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}
function DisconnectIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function TemplateIconSm() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z"/>
      <path d="M6 8h8v1H6V8zm0 2h8v1H6v-1zm0 2h5v1H6v-1z"/>
    </svg>
  );
}
function WaSpin({ size = 14 }) {
  return (
    <svg
      className="wa-spin"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0110 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
function Spinner() {
  return (
    <svg className="w-4 h-4 spin" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="white"
        strokeOpacity=".3"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0110 10"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  * { font-family: 'Plus Jakarta Sans', sans-serif; }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.96)}      to{opacity:1;transform:scale(1)} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  .animate-fadeUp  { animation: fadeUp  .22s ease both }
  .animate-scaleIn { animation: scaleIn .2s  ease both }
  .spin { animation: spin 1s linear infinite }
`;

const WA_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .wa-card {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0c0c0c;
    border: 1px solid #202020;
    border-radius: 18px;
    padding: 24px 28px;
    width: 100%;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .wa-header { display:flex; align-items:center; gap:14px; }
  .wa-logo {
    width:50px; height:50px; border-radius:14px;
    background: linear-gradient(145deg,#25D366,#075E54);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; box-shadow:0 6px 24px rgba(37,211,102,.2);
  }
  .wa-header-copy { flex:1; }
  .wa-title { font-size:16px; font-weight:700; letter-spacing:-.3px; }
  .wa-sub   { font-size:12px; color:#4a4a4a; margin-top:3px; }

  .wa-live-badge {
    display:flex; align-items:center; gap:5px;
    background:rgba(37,211,102,.08); border:1px solid rgba(37,211,102,.18);
    border-radius:20px; padding:4px 11px;
    font-size:11px; font-weight:700; color:#25D366; flex-shrink:0;
  }
  .wa-pulse-dot {
    width:6px; height:6px; border-radius:50%; background:#25D366;
    animation:waPulse 2s ease-in-out infinite;
  }
  .wa-rule { height:1px; background:#1a1a1a; }

  .wa-alert {
    display:flex; align-items:flex-start; gap:9px;
    background:rgba(239,68,68,.07); border:1px solid rgba(239,68,68,.18);
    border-radius:11px; padding:12px 14px; font-size:13px; color:#f87171;
  }
  .wa-shimmer-wrap { display:flex; flex-direction:column; gap:9px; }
  .wa-shimmer {
    height:12px; border-radius:6px;
    background:linear-gradient(90deg,#181818 25%,#232323 50%,#181818 75%);
    background-size:200% 100%; animation:waShimmer 1.5s infinite;
  }
  .wa-label { font-size:10px; font-weight:700; letter-spacing:1.3px; color:#333; margin-bottom:12px; }
  .wa-biz-section { display:flex; flex-direction:column; }
  .wa-biz-grid { display:grid; grid-template-columns:1fr; gap:12px; }
  @media (min-width: 768px) {
    .wa-biz-grid { grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); }
  }
  
  .wa-biz-card {
    background:rgba(255,255,255,.025); border:1px solid #1c1c1c;
    border-radius:16px; padding:16px;
    transition:border-color .2s, background .2s;
    animation:waFadeUp .3s ease both;
  }
  .wa-biz-card:hover { border-color:rgba(37,211,102,.2); background:rgba(37,211,102,.025); }
  
  .wa-biz-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
  .wa-biz-info { flex:1; display:flex; align-items:center; justify-content:space-between; }
  
  .wa-biz-avatar {
    width:48px; height:48px; border-radius:14px; flex-shrink:0;
    background:linear-gradient(145deg,#152a1e,#0c1a12);
    border:1px solid rgba(37,211,102,.14);
    color:#25D366; font-size:14px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
  }
  .wa-biz-name { font-size:16px; font-weight:600; color:#fff; }
  
  .wa-biz-content { }
  .wa-phone-list { display:flex; flex-direction:column; gap:8px; }
  .wa-phone-label { font-size:12px; font-weight:600; color:#666; margin-bottom:4px; }
  
  .wa-phone-item {
    display:flex; align-items:center; gap:8px;
    background:rgba(37,211,102,.05); border:1px solid rgba(37,211,102,.12);
    border-radius:10px; padding:10px 12px;
  }
  .wa-phone-number { flex:1; font-size:14px; font-weight:500; color:#6effa8; }
  .wa-phone-status {
    font-size:11px; font-weight:600; color:#25D366;
    background:rgba(37,211,102,.1); border:1px solid rgba(37,211,102,.2);
    padding:2px 8px; border-radius:12px;
  }
  
  .wa-no-phones {
    display:flex; align-items:center; gap:8px;
    background:rgba(239,68,68,.05); border:1px solid rgba(239,68,68,.12);
    border-radius:10px; padding:10px 12px;
    color:#f87171; font-size:14px; font-weight:500;
  }
  .wa-no-phones-icon { flex-shrink:0; opacity:0.7; }
  
  .wa-load-phones-btn {
    width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
    padding:12px; background:rgba(37,211,102,.05);
    border:1px solid rgba(37,211,102,.15); border-radius:10px;
    color:#25D366; font-size:13px; font-weight:500; cursor:pointer;
    font-family:inherit; transition:all .2s;
  }
  .wa-load-phones-btn:hover:not(:disabled) { 
    background:rgba(37,211,102,.1); border-color:rgba(37,211,102,.25); 
  }
  .wa-load-phones-btn:disabled { opacity:.5; cursor:not-allowed; }

  .wa-status-badge {
    flex-shrink:0; font-size:11px; font-weight:600;
    padding:4px 10px; border-radius:20px;
    background:rgba(37,211,102,.08); color:#25D366;
    border:1px solid rgba(37,211,102,.15);
  }
  .wa-empty { text-align:center; padding:16px 0; }
  .wa-empty-msg { font-size:13px; color:#3c3c3c; margin-top:7px; }
  .wa-cta { display:flex; flex-direction:column; gap:9px; }
  .wa-actions-connected { display:flex; flex-direction:column; gap:9px; }

  .wa-btn {
    width:100%; display:flex; align-items:center; justify-content:center; gap:8px;
    padding:13px; border-radius:13px; font-size:14px; font-weight:700;
    border:none; cursor:pointer; font-family:inherit;
    transition:opacity .18s, transform .1s;
  }
  .wa-btn:active { transform:scale(.99); }
  .wa-btn:disabled { opacity:.5; cursor:not-allowed; }
  .wa-btn-primary {
    background:linear-gradient(135deg,#25D366,#19a84e);
    color:#fff; box-shadow:0 8px 24px rgba(37,211,102,.25);
  }
  .wa-btn-primary:hover:not(:disabled) { opacity:.9; }
  .wa-btn-secondary {
    background:rgba(37,211,102,.1); color:#25D366;
    border:1px solid rgba(37,211,102,.2) !important;
  }
  .wa-btn-secondary:hover:not(:disabled) { background:rgba(37,211,102,.15); }
  .wa-btn-danger {
    background:rgba(239,68,68,.07); color:#f87171;
    border:1px solid rgba(239,68,68,.18) !important;
  }
  .wa-btn-danger:hover:not(:disabled) { background:rgba(239,68,68,.12); }
  .wa-hint { font-size:11px; color:#333; text-align:center; margin:0; line-height:1.6; }
  .wa-spin { animation:waSpin 1s linear infinite; }
  @keyframes waSpin    { to{transform:rotate(360deg)} }
  @keyframes waPulse   { 0%,100%{opacity:1} 50%{opacity:.35} }
  @keyframes waShimmer { to{background-position:-200% 0} }
  @keyframes waFadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
`;
