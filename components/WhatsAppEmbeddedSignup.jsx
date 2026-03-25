"use client";
// components/WhatsAppConnect.jsx

import { useEffect, useState, useCallback } from "react";

export default function WhatsAppConnect({ onConnected, onDisconnected }) {
  const [sdkReady,    setSdkReady]    = useState(false);
  const [status,      setStatus]      = useState("loading");
  const [account,     setAccount]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [businesses,  setBusinesses]  = useState([]);
  const [phones,      setPhones]      = useState({});
  const [loadingBiz,  setLoadingBiz]  = useState(null);

  // ── Load Facebook JS SDK ──────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const init = () => {
      window.FB.init({
        appId:   process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        cookie:  true,
        xfbml:   false,
        version: "v19.0",
        status:  true,
        oauth:   true,
      });
      setSdkReady(true);
    };
    if (window.FB) { init(); return; }
    window.fbAsyncInit = init;
    if (!document.getElementById("facebook-jssdk")) {
      const s       = document.createElement("script");
      s.id          = "facebook-jssdk";
      s.src         = "https://connect.facebook.net/en_US/sdk.js";
      s.async       = true;
      s.defer       = true;
      s.crossOrigin = "anonymous";
      document.body.appendChild(s);
    }
  }, []);

  // ── Check existing connection ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/whatsapp/status")
      .then((r) => r.json())
      .then((d) => {
        if (d.connected && d.account) { setStatus("connected"); setAccount(d.account); }
        else setStatus("disconnected");
      })
      .catch(() => setStatus("disconnected"));
  }, []);

  // ── Connect ───────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/whatsapp/connect");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setBusinesses(data.businesses);
      setStatus("connected");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Get Numbers ───────────────────────────────────────────────────────────
  const handleGetNumbers = async (businessId) => {
    setLoadingBiz(businessId);
    try {
      const wabaRes  = await fetch("/api/whatsapp/connect", { method: "POST", body: JSON.stringify({ businessId }) });
      const wabaData = await wabaRes.json();
      const wabaId   = wabaData.wabas?.[0]?.id;
      if (!wabaId) throw new Error("No WABA found");
      const phoneRes  = await fetch("/api/whatsapp/connect", { method: "PUT", body: JSON.stringify({ wabaId }) });
      const phoneData = await phoneRes.json();
      console.log("Fetched phones for business", businessId, phoneData);
      setPhones((prev) => ({ ...prev, [businessId]: phoneData.phones }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingBiz(null);
    }
  };

  // ── Disconnect ────────────────────────────────────────────────────────────
  const handleDisconnect = useCallback(async () => {
    await fetch("/api/whatsapp/connect", { method: "DELETE" }).catch(() => {});
    setStatus("disconnected");
    setAccount(null);
    setBusinesses([]);
    setPhones({});
    setError(null);
    onDisconnected?.();
  }, [onDisconnected]);

  return (
    <>
      <style>{CSS}</style>
      <div className="wa-card">

        {/* ── Header ── */}
        <div className="wa-header">
          <div className="wa-logo">
            <WaIcon />
          </div>
          <div className="wa-header-copy">
            <div className="wa-title">WhatsApp Business</div>
            <div className="wa-sub">Connect your account via Meta Embedded Signup</div>
          </div>
          {status === "connected" && (
            <div className="wa-live-badge">
              <span className="wa-pulse-dot" />
              Live
            </div>
          )}
        </div>

        <div className="wa-rule" />

        {/* ── Error ── */}
        {error && (
          <div className="wa-alert">
            <svg width="15" height="15" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── Loading ── */}
        {status === "loading" && (
          <div className="wa-shimmer-wrap">
            <div className="wa-shimmer" style={{ width: "55%" }} />
            <div className="wa-shimmer" style={{ width: "35%" }} />
          </div>
        )}

        {/* ── Business list ── */}
        {status === "connected" && businesses.length > 0 && (
          <div className="wa-biz-section">
            <div className="wa-label">CONNECTED BUSINESSES</div>
            <div className="wa-biz-list">
              {businesses.map((biz, i) => (
                <div key={biz.id} className="wa-biz-row" style={{ animationDelay: `${i * 70}ms` }}>
                  <div className="wa-biz-avatar">
                    {biz.name?.substring(0, 2).toUpperCase() || "WA"}
                  </div>
                  <div className="wa-biz-body">
                    <div className="wa-biz-name">{biz.name}</div>

                    {phones[biz.id] ? (
                      <div className="wa-chips">
                        {phones[biz.id].map((p) => (
                          <span key={p.id} className="wa-chip">
                            <PhoneIcon /> {p.display_phone_number}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <button
                        className="wa-ghost-btn"
                        onClick={() => handleGetNumbers(biz.id)}
                        disabled={loadingBiz === biz.id}
                      >
                        {loadingBiz === biz.id
                          ? <><Spin size={11} /> Fetching numbers…</>
                          : <><PhoneIcon /> Show phone numbers</>
                        }
                      </button>
                    )}
                  </div>
                  <span className="wa-status-badge">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty connected state ── */}
        {status === "connected" && businesses.length === 0 && (
          <div className="wa-empty">
            <div style={{ fontSize: 30 }}>🏢</div>
            <div className="wa-empty-msg">No businesses found on this account.</div>
          </div>
        )}

        {/* ── Actions ── */}
        {status === "connected" ? (
          <button className="wa-btn wa-btn-danger" onClick={handleDisconnect}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"/>
            </svg>
            Disconnect Account
          </button>
        ) : status === "disconnected" ? (
          <div className="wa-cta">
            <button
              className="wa-btn wa-btn-primary"
              onClick={handleConnect}
              disabled={loading || !sdkReady}
            >
              {loading
                ? <><Spin /> Connecting…</>
                : !sdkReady
                ? <><Spin /> Loading SDK…</>
                : <><WaIconSm /> Connect WhatsApp Business</>
              }
            </button>
            <p className="wa-hint">
              A secure Meta popup will open — choose your existing WhatsApp Business account.
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────
function WaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
      <path d="M24.5 11.5A9.46 9.46 0 0018 9C12.477 9 8 13.477 8 19a9.948 9.948 0 001.38 5.02L8 27l3.08-1.35A9.947 9.947 0 0018 27c5.523 0 10-4.477 10-10a9.46 9.46 0 00-3.5-7.5z" fill="white" fillOpacity=".2" stroke="white" strokeWidth="1.4"/>
      <path d="M22.8 20.6c-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.15-.68-.61-1.15-1.37-1.28-1.6-.14-.23-.01-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4l-.44-.01c-.15 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.94 2.39c.12.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.45.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.27z" fill="white"/>
    </svg>
  );
}
function WaIconSm() {
  return (
    <svg width="15" height="15" viewBox="0 0 36 36" fill="none">
      <path d="M24.5 11.5A9.46 9.46 0 0018 9C12.477 9 8 13.477 8 19a9.948 9.948 0 001.38 5.02L8 27l3.08-1.35A9.947 9.947 0 0018 27c5.523 0 10-4.477 10-10a9.46 9.46 0 00-3.5-7.5z" stroke="white" strokeWidth="2" fill="none"/>
      <path d="M22.8 20.6c-.23-.12-1.37-.68-1.58-.76-.21-.08-.37-.12-.52.12-.16.23-.6.76-.74.91-.13.16-.27.17-.5.06-.23-.12-.97-.36-1.85-1.15-.68-.61-1.15-1.37-1.28-1.6-.14-.23-.01-.36.1-.47.1-.1.23-.27.35-.4.11-.14.15-.23.23-.39.08-.15.04-.29-.02-.4-.06-.12-.52-1.25-.71-1.71-.19-.45-.38-.39-.52-.4l-.44-.01c-.15 0-.4.06-.62.29-.21.23-.81.79-.81 1.93s.83 2.24.94 2.39c.12.15 1.63 2.49 3.95 3.49.55.24.98.38 1.32.49.55.18 1.06.15 1.45.09.44-.07 1.37-.56 1.56-1.1.19-.54.19-1 .13-1.1-.06-.1-.21-.16-.44-.27z" fill="white"/>
    </svg>
  );
}
function PhoneIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="currentColor">
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
    </svg>
  );
}
function Spin({ size = 14 }) {
  return (
    <svg className="wa-spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity=".25" strokeWidth="3"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .wa-card {
    font-family: 'Inter', system-ui, sans-serif;
    background: #0c0c0c;
    border: 1px solid #202020;
    border-radius: 22px;
    padding: 30px 36px;
    width: 100%;
    max-width: 720px;
    color: #fff;
    display: flex;
    flex-direction: column;
    gap: 22px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.02),
      0 32px 80px rgba(0,0,0,.7);
  }

  /* Header */
  .wa-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .wa-logo {
    width: 54px; height: 54px;
    border-radius: 16px;
    background: linear-gradient(145deg, #25D366, #075E54);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 32px rgba(37,211,102,.22);
  }
  .wa-header-copy { flex: 1; }
  .wa-title  { font-size: 17px; font-weight: 700; letter-spacing: -.35px; }
  .wa-sub    { font-size: 12px; color: #4a4a4a; margin-top: 3px; line-height: 1.4; }

  .wa-live-badge {
    display: flex; align-items: center; gap: 6px;
    background: rgba(37,211,102,.08);
    border: 1px solid rgba(37,211,102,.18);
    border-radius: 20px;
    padding: 5px 12px;
    font-size: 11px; font-weight: 700;
    color: #25D366; letter-spacing: .4px;
    flex-shrink: 0;
  }
  .wa-pulse-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #25D366;
    animation: waPulse 2s ease-in-out infinite;
  }

  /* Rule */
  .wa-rule { height: 1px; background: #191919; }

  /* Alert */
  .wa-alert {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(239,68,68,.07);
    border: 1px solid rgba(239,68,68,.18);
    border-radius: 12px;
    padding: 13px 16px;
    font-size: 13px; color: #f87171; line-height: 1.5;
  }

  /* Shimmer skeleton */
  .wa-shimmer-wrap { display: flex; flex-direction: column; gap: 10px; padding: 4px 0; }
  .wa-shimmer {
    height: 13px; border-radius: 7px;
    background: linear-gradient(90deg, #181818 25%, #242424 50%, #181818 75%);
    background-size: 200% 100%;
    animation: waShimmer 1.5s infinite;
  }

  /* Section label */
  .wa-label {
    font-size: 10px; font-weight: 700;
    letter-spacing: 1.4px; color: #333;
    margin-bottom: 10px;
  }

  /* Biz list */
  .wa-biz-section { display: flex; flex-direction: column; }
  .wa-biz-list    { display: flex; flex-direction: column; gap: 8px; }

  .wa-biz-row {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,.025);
    border: 1px solid #1c1c1c;
    border-radius: 16px;
    padding: 16px 20px;
    transition: border-color .2s, background .2s;
    animation: waFadeUp .3s ease both;
  }
  .wa-biz-row:hover {
    border-color: rgba(37,211,102,.22);
    background: rgba(37,211,102,.03);
  }

  .wa-biz-avatar {
    width: 46px; height: 46px; border-radius: 13px; flex-shrink: 0;
    background: linear-gradient(145deg, #152a1e, #0c1a12);
    border: 1px solid rgba(37,211,102,.14);
    color: #25D366; font-size: 14px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    letter-spacing: -.5px;
  }

  .wa-biz-body  { flex: 1; min-width: 0; }
  .wa-biz-name  { font-size: 14px; font-weight: 600; }

  /* Phone chips */
  .wa-chips { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 9px; }
  .wa-chip {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(37,211,102,.07);
    border: 1px solid rgba(37,211,102,.16);
    border-radius: 8px; padding: 5px 11px;
    font-size: 12px; font-weight: 500; color: #6effa8;
    font-variant-numeric: tabular-nums;
  }

  /* Ghost btn */
  .wa-ghost-btn {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 9px; padding: 6px 13px;
    background: transparent;
    border: 1px solid #252525; border-radius: 9px;
    color: #555; font-size: 12px; font-weight: 500;
    cursor: pointer; font-family: inherit;
    transition: all .2s;
  }
  .wa-ghost-btn:hover:not(:disabled) { border-color: #25D366; color: #25D366; }
  .wa-ghost-btn:disabled { opacity: .45; cursor: not-allowed; }

  .wa-status-badge {
    flex-shrink: 0;
    font-size: 11px; font-weight: 600;
    padding: 4px 10px; border-radius: 20px;
    background: rgba(37,211,102,.08);
    color: #25D366;
    border: 1px solid rgba(37,211,102,.16);
  }

  /* Empty */
  .wa-empty { text-align: center; padding: 20px 0; }
  .wa-empty-msg { font-size: 13px; color: #3c3c3c; margin-top: 8px; }

  /* CTA */
  .wa-cta { display: flex; flex-direction: column; gap: 10px; }

  /* Buttons */
  .wa-btn {
    width: 100%;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    padding: 14px; border-radius: 14px;
    font-size: 14px; font-weight: 700; letter-spacing: -.1px;
    border: none; cursor: pointer;
    font-family: inherit;
    transition: opacity .18s, transform .1s;
  }
  .wa-btn:active { transform: scale(.99); }
  .wa-btn:disabled { opacity: .5; cursor: not-allowed; }

  .wa-btn-primary {
    background: linear-gradient(135deg, #25D366 0%, #19a84e 100%);
    color: #fff;
    box-shadow: 0 10px 30px rgba(37,211,102,.28);
  }
  .wa-btn-primary:hover:not(:disabled) { opacity: .9; }

  .wa-btn-danger {
    background: rgba(239,68,68,.07);
    color: #f87171;
    border: 1px solid rgba(239,68,68,.18) !important;
  }
  .wa-btn-danger:hover:not(:disabled) { background: rgba(239,68,68,.12); }

  .wa-hint {
    font-size: 11px; color: #333;
    text-align: center; margin: 0; line-height: 1.6;
  }

  /* Animations */
  .wa-spin { animation: waSpin 1s linear infinite; }
  @keyframes waSpin    { to { transform: rotate(360deg); } }
  @keyframes waPulse   { 0%,100%{ opacity:1; } 50%{ opacity:.35; } }
  @keyframes waShimmer { to { background-position: -200% 0; } }
  @keyframes waFadeUp  { from{ opacity:0; transform:translateY(7px); } to{ opacity:1; transform:none; } }
`;