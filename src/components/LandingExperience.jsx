"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { plans, defaultPlan } from "../data/plans";
import { findInstruction, cycleForDate, parseMonthRange } from "../lib/planGuide";


const subscribeToStorage = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getRegisteredEmailSnapshot = () => window.localStorage.getItem("usdx_registered_email") || "";
const getRegisteredNameSnapshot = () => window.localStorage.getItem("usdx_registered_name") || "";
const getEmptyServerSnapshot = () => "";

function addMonths(dateStr, months) {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return date;
}

function formatMonthYear(date) {
  return date.toLocaleString("en-GB", { month: "short", year: "numeric" });
}

const features = [
  ["01", "Clear cadence", "A visual monthly path that turns a complex process into clear next actions."],
  ["02", "Live clarity", "See the plan, the milestone, and the next move in one focused workspace."],
  ["03", "Built to scale", "A single system designed to grow from a first step to a long-term strategy."],
];

const showcase = [
  ["THE PULSE", "A smarter view of momentum.", "Track every milestone across your plan with a focused signal board that keeps the next important action in view."],
  ["THE SYSTEM", "Structure that stays elegant.", "From plan selection to progress tracking, every interaction is designed to feel immediate, calm, and intentional."],
];

const TOKEN_PRICE_URL = "/api/token-price";

function LiveTicker() {
  const [ticker, setTicker] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(TOKEN_PRICE_URL, { cache: "no-store" });
        if (!response.ok) throw new Error("price feed failed");
        const data = await response.json();
        if (!cancelled && data && Number.isFinite(data.priceUsd)) {
          setTicker(data);
          setError(false);
        }
      } catch (err) {
        if (!cancelled) setError(true);
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="ticker-bar glass-panel">
      <span className="ticker-label">USDX LIVE</span>
      {error && !ticker ? (
        <span className="ticker-value ticker-unavailable">PRICE UNAVAILABLE</span>
      ) : ticker ? (
        <>
          <span className="ticker-symbol">USDXSMART</span>
          <strong className="ticker-value">${ticker.priceUsd.toFixed(4)}</strong>
        </>
      ) : (
        <span className="ticker-value">LOADING…</span>
      )}
    </div>
  );
}

function WelcomeBox({ name }) {
  return (
    <section className="welcome-section glass-panel scroll-reveal">
      <p className="eyebrow welcome-eyebrow"><span /> USDX / WELCOME</p>
      <h2 className="welcome-title">Welcome, <em>{name}</em>, to USDX Compounding.</h2>
      <p className="welcome-message">Smart decisions today create greater opportunities tomorrow. Let&apos;s build your future together.</p>
    </section>
  );
}

function WalletSection({ email }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("idle");
  const [stake, setStake] = useState(null);
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");

  const [addingWallet2, setAddingWallet2] = useState(false);
  const [wallet2Address, setWallet2Address] = useState("");
  const [wallet2Status, setWallet2Status] = useState("idle");
  const [wallet2Error, setWallet2Error] = useState("");
  const [stake2, setStake2] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const loadStored = async () => {
      try {
        const response = await fetch("/api/stake-date", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json().catch(() => ({}));
        if (cancelled) return;
        if (data.success && data.stakeDate) {
          setStake(data);
          setPlan(data.plan || "");
          setStatus("done");
          if (data.stakeDate2 && data.stakeAmount2) {
            setStake2({
              stakeDate: data.stakeDate2,
              plan: String(data.stakeAmount2),
              value: data.stakeAmount2 / 2,
              timestamp: data.wallet2Timestamp || 0,
              txHash: null,
              walletAddress2: data.walletAddress2,
            });
          }
        }
      } catch {
        // no stored wallet yet - the input form below handles first-time setup
      }
    };
    loadStored();
    return () => { cancelled = true; };
  }, [email]);

  const handleLookup = async (event) => {
    event.preventDefault();
    const address = walletAddress.trim();
    if (!address) {
      setError("Please enter your wallet address.");
      return;
    }
    setError("");
    setStatus("loading");
    try {
      const response = await fetch("/api/stake-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, walletAddress: address }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not find your stake.");
      setStake(data);
      setPlan(data.plan || "");
      setStatus("done");
      if (data.stakeDate2 && data.stakeAmount2) {
        setStake2({
          stakeDate: data.stakeDate2,
          plan: String(data.stakeAmount2),
          value: data.stakeAmount2 / 2,
          timestamp: data.wallet2Timestamp || 0,
          txHash: null,
          walletAddress2: data.walletAddress2,
        });
      } else {
        setStake2(null);
      }
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  const handleAddWallet2 = async (event) => {
    event.preventDefault();
    const address = wallet2Address.trim();
    if (!address) {
      setWallet2Error("Please enter a wallet address.");
      return;
    }
    setWallet2Error("");
    setWallet2Status("loading");
    try {
      const response = await fetch("/api/wallet-address2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, walletAddress: address }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save the wallet address.");
      setStake((prev) => (prev ? { ...prev, walletAddress2: address } : prev));
      setWallet2Address("");
      setAddingWallet2(false);
      if (data.stakeDate2 && data.stakeAmount2) {
        setStake2({
          stakeDate: data.stakeDate2,
          plan: String(data.stakeAmount2),
          value: data.value,
          timestamp: data.timestamp || 0,
          txHash: data.txHash,
          walletAddress2: address,
        });
      } else {
        setStake2(null);
      }
      if (data.lookupError) {
        setWallet2Error(`Wallet saved, but ${data.lookupError}`);
        return;
      }
    } catch (err) {
      setWallet2Error(err.message);
    } finally {
      setWallet2Status("idle");
    }
  };

  let instruction = null;
  let cycle = 1;
  let planData = null;
  if (stake) {
    const planKey = plan && plans[plan] ? plan : "default";
    planData = plans[planKey] || defaultPlan;
    cycle = Math.min(cycleForDate(stake.stakeDate).cycle, planData.horizon);
    instruction = findInstruction(planData, cycle);
  }

  let instruction2 = null;
  let cycle2 = 1;
  let planData2 = null;
  if (stake2) {
    const planKey2 = plans[stake2.plan] ? stake2.plan : "default";
    planData2 = plans[planKey2] || defaultPlan;
    cycle2 = Math.min(cycleForDate(stake2.stakeDate).cycle, planData2.horizon);
    instruction2 = findInstruction(planData2, cycle2);
  }

  const stakeLabel = stake
    ? new Date(stake.timestamp * 1000).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const wallet2Label = stake2
    ? new Date(`${stake2.stakeDate}T00:00:00`).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <section className="wallet-section glass-panel scroll-reveal">
      <p className="eyebrow wallet-eyebrow"><span /> USDX / STAKE STATUS</p>
      <h2 className="wallet-title">{status === "done" && stake ? "Your stake position" : "Enter your wallet address"}</h2>

      {!(status === "done" && stake) ? (
        <>
          <p className="wallet-question">Connect your position. Enter the wallet address you staked with so we can pull your stake date and time from the blockchain.</p>
          <form className="wallet-form" onSubmit={handleLookup}>
            <input
              className="wallet-input"
              type="text"
              autoComplete="off"
              spellCheck="false"
              placeholder="0x…"
              value={walletAddress}
              onChange={(event) => setWalletAddress(event.target.value)}
              disabled={status === "loading"}
            />
            <button type="submit" className="primary-cta wallet-submit" disabled={status === "loading"}>
              {status === "loading" ? "Finding your stake…" : (<><span className="register-submit-label">Find my stake</span><span aria-hidden="true">→</span></>)}
            </button>
          </form>

          {error ? <p className="wallet-error" role="alert">{error}</p> : null}
        </>
      ) : null}

      {status === "done" && stake ? (
        <>
          <div className="wallet-result">
            <span className="wallet-result-label">STAKED ON</span>
            <div className="wallet-result-date">{stakeLabel}</div>
            {planData ? <span className="wallet-result-plan">PLAN · {planData.price || `$${Math.round(stake.value)}`}</span> : null}
            {stake.walletAddress ? <span className="wallet-result-address">{stake.walletAddress}</span> : null}
            {stake.txHash ? <a className="wallet-result-tx" href={`https://basescan.org/tx/${stake.txHash}`} target="_blank" rel="noreferrer">View transaction on BaseScan ↗</a> : null}
          </div>

          <div className="wallet2-box">
            {stake.walletAddress2 ? (
              <p className="wallet2-stored"><span>ADDITIONAL WALLET</span>{stake.walletAddress2}</p>
            ) : addingWallet2 ? (
              <form className="wallet2-form" onSubmit={handleAddWallet2}>
                <input
                  className="wallet-input wallet2-input"
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  placeholder="0x… (second wallet)"
                  value={wallet2Address}
                  onChange={(event) => setWallet2Address(event.target.value)}
                  disabled={wallet2Status === "loading"}
                />
                <div className="wallet2-actions">
                  <button type="submit" className="primary-cta wallet-submit" disabled={wallet2Status === "loading"}>
                    {wallet2Status === "loading" ? "Saving…" : (<><span className="register-submit-label">Save wallet</span><span aria-hidden="true">→</span></>)}
                  </button>
                  <button type="button" className="wallet2-cancel" onClick={() => { setAddingWallet2(false); setWallet2Error(""); }}>Cancel</button>
                </div>
                {wallet2Error ? <p className="wallet-error" role="alert">{wallet2Error}</p> : null}
              </form>
            ) : (
              <button type="button" className="wallet2-toggle" onClick={() => setAddingWallet2(true)}>+ Add wallet address</button>
            )}
          </div>

          {stake2 ? (
            <>
              <div className="wallet-result wallet2-result">
                <span className="wallet-result-label">ADDITIONAL WALLET · STAKED ON</span>
                <div className="wallet-result-date">{wallet2Label}</div>
                {planData2 ? <span className="wallet-result-plan">PLAN · {planData2.price || `$${Math.round(stake2.value)}`}</span> : null}
                {stake2.walletAddress2 ? <span className="wallet-result-address">{stake2.walletAddress2}</span> : null}
                {stake2.txHash ? <a className="wallet-result-tx" href={`https://basescan.org/tx/${stake2.txHash}`} target="_blank" rel="noreferrer">View transaction on BaseScan ↗</a> : null}
              </div>

              {instruction2 ? (
                <section className="user-instruction wallet-instruction glass-panel">
                  <div className="user-instruction-head">
                    <p className="eyebrow"><span /> USDX / ADDITIONAL WALLET INSTRUCTION</p>
                    <span className="user-cycle">{`CYCLE ${cycle2} · ${instruction2.label}`}</span>
                  </div>
                  <h2>{instruction2.title}</h2>
                  <p>{instruction2.detail}</p>
                  {planData2.slug === "default" ? (
                    <Link href="/guide" className="text-cta">Open plan guides <span>↗</span></Link>
                  ) : (
                    <Link href={`/guide/${stake2.plan}`} className="text-cta">Open full plan guide <span>↗</span></Link>
                  )}
                </section>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}

      {instruction ? (
        <section className="user-instruction wallet-instruction glass-panel">
          <div className="user-instruction-head">
            <p className="eyebrow"><span /> USDX / CURRENT INSTRUCTION</p>
            <span className="user-cycle">{`CYCLE ${cycle} · ${instruction.label}`}</span>
          </div>
          <h2>{instruction.title}</h2>
          <p>{instruction.detail}</p>
          {planData.slug === "default" ? (
            <Link href="/guide" className="text-cta">Open plan guides <span>↗</span></Link>
          ) : (
            <Link href={`/guide/${plan}`} className="text-cta">Open full plan guide <span>↗</span></Link>
          )}
        </section>
      ) : null}

      {stake && planData ? (
        <section className="plan-timeline glass-panel">
          <div className="plan-timeline-head">
            <p className="eyebrow"><span /> USDX / COMPOUNDING PLAN</p>
            <span className="plan-timeline-plan">{planData.price || `$${Math.round(stake.value)}`}</span>
          </div>
          <h3 className="plan-timeline-title">Your compounding roadmap from {formatMonthYear(new Date(`${stake.stakeDate}T00:00:00`))}</h3>
          <div className="plan-timeline-list">
            {planData.steps.map(([monthLabel, title, detail], index) => {
              const range = parseMonthRange(monthLabel);
              const isCurrent = range ? cycle >= range[0] && cycle <= range[1] : false;
              let dateLabel = "";
              if (range) {
                const startDate = addMonths(stake.stakeDate, range[0] - 1);
                const endDate = addMonths(stake.stakeDate, range[1] - 1);
                dateLabel =
                  range[0] === range[1]
                    ? formatMonthYear(startDate)
                    : `${formatMonthYear(startDate)} – ${formatMonthYear(endDate)}`;
              }
              return (
                <article key={`${monthLabel}-${index}`} className={`plan-timeline-item${isCurrent ? " is-current" : ""}`}>
                  <div className="plan-timeline-month">
                    <span>{monthLabel}</span>
                    {dateLabel ? <small>{dateLabel}</small> : null}
                  </div>
                  <div className="plan-timeline-body">
                    <h4>{title}</h4>
                    <p>{detail}</p>
                  </div>
                  {isCurrent ? <span className="plan-timeline-now">NOW</span> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {status === "done" && stake ? <NotificationSection email={email} /> : null}
      {status === "done" && stake ? <PushSection email={email} /> : null}
    </section>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function PushSection({ email }) {
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const unsupported = !supported || !vapidKey;

  useEffect(() => {
    if (unsupported) return;
    let cancelled = false;
    const load = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = registration ? await registration.pushManager.getSubscription() : null;
        if (!cancelled && subscription) setEnabled(true);
      } catch {
        // no subscription saved yet
      }
    };
    load();
    return () => { cancelled = true; };
  }, [unsupported]);

  const handleToggle = async (checked) => {
    if (status === "loading") return;
    setError("");
    setStatus("loading");
    try {
      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") throw new Error("Notification permission was denied.");
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        const response = await fetch("/api/push-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, subscription: subscription.toJSON() }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not enable notifications.");
        setEnabled(true);
      } else {
        const registration = await navigator.serviceWorker.getRegistration("/sw.js");
        const subscription = registration ? await registration.pushManager.getSubscription() : null;
        if (subscription) await subscription.unsubscribe();
        const response = await fetch("/api/push-subscription", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not disable notifications.");
        setEnabled(false);
      }
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <section className="notification-section glass-panel scroll-reveal">
      <p className="eyebrow notification-eyebrow"><span /> USDX / PUSH NOTIFICATIONS</p>
      <h2 className="notification-title">Enable notification</h2>
      <p className="notification-question">Get an instant browser notification whenever your monthly USDX-SMART compounding update is ready.</p>
      <label className={`notification-box${enabled ? " is-active" : ""}`}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={status === "loading" || unsupported}
          onChange={(event) => handleToggle(event.target.checked)}
        />
        <span>Enable browser notifications</span>
      </label>
      {unsupported ? (
        <p className="notification-error" role="alert">Browser notifications are not supported in this browser.</p>
      ) : null}
      {status === "done" && enabled ? (
        <p className="notification-note is-success" role="status">Browser notifications are enabled.</p>
      ) : null}
      {status === "done" && !enabled ? (
        <p className="notification-note" role="status">Browser notifications are disabled.</p>
      ) : null}
      {error ? <p className="notification-error" role="alert">{error}</p> : null}
    </section>
  );
}

function NotificationSection({ email }) {
  const [enabled, setEnabled] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleChoice = async (choice) => {
    if (status === "loading") return;
    setEnabled(choice);
    setError("");
    setStatus("loading");
    try {
      const response = await fetch("/api/notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, enabled: choice }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not update your notification setting.");
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <section className="notification-section glass-panel scroll-reveal">
      <p className="eyebrow notification-eyebrow"><span /> USDX / MONTHLY NOTIFICATIONS</p>
      <h2 className="notification-title">Monthly email updates</h2>
      <p className="notification-question">Get a monthly email with updates related to your compounding activity, starting from next month.</p>
      <div className="notification-options" role="group" aria-label="Monthly notifications">
        <button type="button" className={`notification-option${enabled === true ? " is-active" : ""}`} onClick={() => handleChoice(true)} disabled={status === "loading"}>
          {status === "loading" && enabled === true ? "Enabling…" : "Yes, notify me"}
        </button>
        <button type="button" className={`notification-option${enabled === false ? " is-active" : ""}`} onClick={() => handleChoice(false)} disabled={status === "loading"}>
          {status === "loading" && enabled === false ? "Disabling…" : "No, thanks"}
        </button>
      </div>
      {status === "done" && enabled === true ? (
        <p className="notification-note is-success" role="status">Monthly notifications are enabled. A confirmation email is on its way to {email}.</p>
      ) : null}
      {status === "done" && enabled === false ? (
        <p className="notification-note" role="status">Monthly notifications are disabled.</p>
      ) : null}
      {error ? <p className="notification-error" role="alert">{error}</p> : null}
    </section>
  );
}

export default function LandingExperience() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const initialized = useRef(false);
  const cleanupRef = useRef(() => {});
  const [gate, setGate] = useState("checking");
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const loginRedirectRef = useRef(false);
  const verifiedEmailRef = useRef("");

  const registeredEmail = useSyncExternalStore(
    subscribeToStorage,
    getRegisteredEmailSnapshot,
    getEmptyServerSnapshot
  );
  const registeredName = useSyncExternalStore(
    subscribeToStorage,
    getRegisteredNameSnapshot,
    getEmptyServerSnapshot
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      loginRedirectRef.current = true;
      requestAnimationFrame(() => {
        setLoginError(params.get("message") || "");
        setLoginEmail("");
        setLoginOpen(true);
      });
      const url = new URL(window.location.href);
      url.searchParams.delete("login");
      url.searchParams.delete("message");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  useEffect(() => {
    if (registeredEmail) {
      if (verifiedEmailRef.current === registeredEmail && gate === "ready") return;
      let cancelled = false;
      setGate("checking");
      const verify = async () => {
        try {
          const response = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: registeredEmail }),
          });
          if (cancelled) return;
          if (response.status === 404) {
            localStorage.removeItem("usdx_registered_email");
            localStorage.removeItem("usdx_registered_name");
            router.replace(`/register?message=${encodeURIComponent("REGISTER FIRST TO ACCESS THE LANDING EXPERIENCE")}`);
            return;
          }
          const data = await response.json().catch(() => ({}));
          if (data && data.name) {
            localStorage.setItem("usdx_registered_name", data.name);
          }
          verifiedEmailRef.current = registeredEmail;
          setGate("ready");
        } catch (err) {
          if (!cancelled) {
            verifiedEmailRef.current = registeredEmail;
            setGate("ready");
          }
        }
      };
      verify();
      return () => { cancelled = true; };
    }

    if (loginRedirectRef.current) {
      setGate("ready");
      return;
    }
    router.replace("/register");
  }, [registeredEmail, router, gate]);

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");
    if (!loginEmail.trim()) return;
    setLoginLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.exists) {
        localStorage.setItem("usdx_registered_email", loginEmail.trim());
        if (data.name) localStorage.setItem("usdx_registered_name", data.name);
        verifiedEmailRef.current = loginEmail.trim();
        setGate("ready");
        setLoginOpen(false);
        router.push("/");
      } else if (response.status === 404) {
        router.push("/register");
      } else {
        setLoginError(data.error || "Could not sign you in.");
        setLoginLoading(false);
      }
    } catch (err) {
      setLoginError(err.message);
      setLoginLoading(false);
    }
  };

  const initialise = useCallback(() => {
    if (
      initialized.current ||
      !window.THREE ||
      !window.gsap ||
      !window.ScrollTrigger ||
      !canvasRef.current
    ) return;
    initialized.current = true;

    const THREE = window.THREE;
    const canvas = canvasRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
    camera.position.set(0, 0, 7);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 13;
      positions[i3 + 1] = (Math.random() - 0.5) * 8;
      positions[i3 + 2] = (Math.random() - 0.5) * 4;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x57f4ff, size: 0.024, transparent: true, opacity: 0.72 }));
    scene.add(particles);

    const grid = new THREE.GridHelper(18, 26, 0x4b36ff, 0x16314b);
    grid.rotation.x = Math.PI / 2.35;
    grid.position.y = -2.1;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);

    let targetX = 0;
    let targetY = 0;
    const onPointerMove = (event) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 0.55;
      targetY = (event.clientY / window.innerHeight - 0.5) * 0.35;
    };
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    let frame;
    const render = () => {
      particles.rotation.y += 0.0007;
      particles.rotation.x += (targetY - particles.rotation.x) * 0.025;
      particles.rotation.y += (targetX - particles.rotation.y) * 0.018;
      grid.rotation.z += 0.00045;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(render);
    };
    resize();
    render();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", resize);

    const gsap = window.gsap;
    const scrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(scrollTrigger);
    const context = gsap.context(() => {
      gsap.from(".reveal-hero", { y: 42, opacity: 0, duration: 1, stagger: 0.13, ease: "power3.out", delay: 0.18 });
      gsap.from(".orbital", { scale: 0.78, opacity: 0, duration: 1.4, ease: "power3.out", delay: 0.35 });
      gsap.utils.toArray(".scroll-reveal").forEach((element) => {
        gsap.from(element, { y: 38, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 86%" } });
      });
      gsap.utils.toArray(".chart-figure").forEach((element) => {
        gsap.from(element, { y: 56, opacity: 0, scale: 0.9, rotate: element.classList.contains("chart-flip") ? 5 : -5, duration: 1.05, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 90%" } });
      });
    }, pageRef);

    cleanupRef.current = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", resize);
      context.revert();
      particleGeometry.dispose();
      particles.material.dispose();
      renderer.dispose();
    };
  }, []);

  useEffect(() => () => cleanupRef.current(), []);

  if (gate !== "ready") {
    return (
      <main className="usdx-shell" style={{ alignItems: "center", display: "flex", justifyContent: "center", minHeight: "100vh" }}>
        <p className="eyebrow"><span /> USDX / CHECKING ACCESS</p>
      </main>
    );
  }

  return (
    <main className="usdx-shell" ref={pageRef}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="afterInteractive" onReady={initialise} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onReady={initialise} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" onReady={initialise} />
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />

      <nav className="site-nav glass-panel">
        <Link href="/" className="brand"><span>U</span> USDX <i>•</i> OS</Link>
        <div className="nav-links"><a href="#protocol">Protocol</a><a href="#capabilities">Capabilities</a><a href="#signal">Signal</a></div>
        <Link href="/guide" className="nav-cta">Open guide <b>↗</b></Link>
      </nav>

      <LiveTicker />

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow reveal-hero"><span /> USDX / COMPOUNDING INTELLIGENCE</p>
          <h1 className="reveal-hero">Build momentum.<br /><em>Compound clarity.</em></h1>
          <p className="hero-description reveal-hero">A precision workspace for seeing the path, owning each milestone, and making your next move with confidence.</p>
          <div className="hero-actions reveal-hero"><button type="button" className="login-cta" onClick={() => { setLoginError(""); setLoginEmail(""); setLoginOpen(true); }}>Login <span>→</span></button><Link href="/register" className="primary-cta">Register Now <span>→</span></Link><a href="#protocol" className="text-cta">Explore the protocol <span>→</span></a><Link href="/guide" className="text-cta">Open Guide <span>↗</span></Link></div>
          <div className="trust-line reveal-hero"><span className="avatars">◉ ◉ ◉</span><span>Designed for focused growth.<br />Built for the long run.</span></div>
        </div>
        <div className="hero-visual orbital">
          <div className="orbital-ring ring-one" /><div className="orbital-ring ring-two" />
          <div className="core-orb">
            <Image
              src="/images/usdxcoin.PNG"
              alt="USDX Smart Contract coin"
              width={340}
              height={340}
              priority
              className="floating-logo"
            />
          </div>
          <div className="metric-card top"><small>ACTIVE SIGNAL</small><strong>+24.8%</strong><span>Momentum index</span></div>
          <div className="metric-card bottom"><small>NEXT MILESTONE</small><strong>MONTH 37</strong><span className="pulse-dot">● On track</span></div>
        </div>
      </section>

      {registeredEmail ? (
        <>
          <WelcomeBox name={registeredName || "there"} />
          <WalletSection email={registeredEmail} />
        </>
      ) : null}

      <section id="capabilities" className="capabilities scroll-reveal">
        <div className="section-heading"><p>CORE CAPABILITIES</p><h2>One operating system.<br /><span>Complete visibility.</span></h2></div>
        <div className="feature-grid">{features.map(([number, title, description]) => <article className="feature-card glass-panel" key={number}><span className="feature-number">{number}</span><div className="feature-icon">✦</div><h3>{title}</h3><p>{description}</p><a href="#signal">Learn more <b>→</b></a></article>)}</div>
      </section>

      <section id="protocol" className="protocol scroll-reveal">
        <div className="protocol-index"><span>01 — 03</span><div /><span>THE USDX PROTOCOL</span></div>
        <div className="protocol-content"><p className="eyebrow"><span /> INTELLIGENT COMPOUNDING</p><h2>Every move, <em>in context.</em></h2><p>USDX turns a long-term roadmap into a living, legible system. Know what happened, what matters now, and where you are headed next.</p><div className="protocol-metrics"><div><strong>60</strong><span>MONTH<br />HORIZON</span></div><div><strong>3</strong><span>PLAN<br />TIERS</span></div><div><strong>∞</strong><span>ALWAYS<br />ON</span></div></div></div>
        <div className="protocol-graphic glass-panel"><div className="signal-line"><i /><i /><i /><i /><i /><i /><i /></div><div className="signal-label one">FIRST SIGNAL</div><div className="signal-label two">YOUR MOMENTUM</div><div className="signal-label three">NEXT HORIZON</div></div>
      </section>

      <section id="signal" className="showcase">{showcase.map(([label, title, text], index) => <article className={`showcase-row scroll-reveal ${index ? "reverse" : ""}`} key={label}><div className="showcase-art glass-panel"><div className={`art-grid art-${index + 1}`}><span /><span /><span /><span /><span /></div><div className="art-readout">{index ? "S Y S T E M" : "0 1 1 0 1 0"}</div></div><div className="showcase-copy"><p>{label}</p><h2>{title}</h2><span className="line" /><p className="body-copy">{text}</p><Link href="/guide">Discover the experience <b>↗</b></Link></div></article>)}</section>

      <section className="final-cta scroll-reveal"><div className="final-glow" /><p>THE NEXT MOVE IS YOURS</p><h2>Make the long view<br /><em>feel within reach.</em></h2><Link href="/guide" className="primary-cta">Start your journey <span>→</span></Link></section>

      {loginOpen ? (
        <div className="login-modal" role="dialog" aria-modal="true" aria-label="Login">
          <div className="login-modal-card glass-panel">
            <button type="button" className="login-close" onClick={() => setLoginOpen(false)} aria-label="Close">✕</button>
            <p className="eyebrow login-eyebrow"><span /> USDX / LOGIN</p>
            <h2 className="login-title">Welcome <em>back.</em></h2>
            <p className="login-note">Enter the email you registered with to access the landing experience.</p>
            <form className="login-form" onSubmit={handleLoginSubmit}>
              <label className="login-field">
                <span>Email address</span>
                <input type="email" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
              </label>
              {loginError ? <p className="login-error" role="alert">{loginError}</p> : null}
              <button type="submit" className="primary-cta login-submit" disabled={loginLoading}>
                {loginLoading ? "Signing in…" : (<><span className="register-submit-label">Login</span><span aria-hidden="true">→</span></>)}
              </button>
            </form>
          </div>
        </div>
      ) : null}
      <footer className="landing-footer flex-wrap items-start gap-8">
        <div className="ml-auto flex flex-col gap-1 text-right"><span>© 2026 USDX</span><span>COMPOUNDING INTELLIGENCE</span><span className="mt-2 text-[8px] tracking-[.16em] text-white/35">FOR MORE DETAILS VISIT usdx.live</span><span className="text-[8px] tracking-[.16em] text-white/35">FOR TECHNICAL SUPPORT CONTACT usdxcompounding@gmail.com</span></div>
      </footer>
    </main>
  );
}
