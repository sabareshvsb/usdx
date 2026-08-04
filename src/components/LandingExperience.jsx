"use client";

import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const subscribeToRegisteredEmail = (callback) => {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
};

const getRegisteredEmailSnapshot = () => window.localStorage.getItem("usdx_registered_email") || "";
const getRegisteredEmailServerSnapshot = () => "";

const features = [
  ["01", "Clear cadence", "A visual monthly path that turns a complex process into clear next actions."],
  ["02", "Live clarity", "See the plan, the milestone, and the next move in one focused workspace."],
  ["03", "Built to scale", "A single system designed to grow from a first step to a long-term strategy."],
];

const showcase = [
  ["THE PULSE", "A smarter view of momentum.", "Track every milestone across your plan with a focused signal board that keeps the next important action in view."],
  ["THE SYSTEM", "Structure that stays elegant.", "From plan selection to progress tracking, every interaction is designed to feel immediate, calm, and intentional."],
];

function StakeSection({ email }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState("");
  const [notify, setNotify] = useState(null);
  const [dateOfStake, setDateOfStake] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleStakeNo = () => router.push("/guide");

  const handleStakeYes = () => {
    setError("");
    setStep(1);
  };

  const handleAmount = (value) => {
    setError("");
    setAmount(value);
    setStep(2);
  };

  const handleNotify = (value) => {
    setError("");
    setNotify(value);
  };

  const handleContinue = async () => {
    if (!amount || notify === null || !dateOfStake) {
      setError("Kindly fill all details.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const response = await fetch("/api/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          dateOfStake,
          stakeAmount: Number(amount.replace(/\D/g, "")),
          notification: notify ? 1 : undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Could not save your stake details.");
      }
      setStep(0);
      setAmount("");
      setNotify(null);
      setDateOfStake("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="stake-section glass-panel scroll-reveal">
      <div className="stake-step">
        {step === 0 && (
          <>
            <p className="eyebrow stake-eyebrow"><span /> USDX / STAKE CHECK-IN</p>
            <h2 className="stake-title">DID YOU STAKE?</h2>
            <p className="stake-question">Let us keep your progress updated. Have you staked into the USDX-SMART Compounding Scheme?</p>
            <div className="stake-options">
              <button type="button" className="stake-yes" onClick={handleStakeYes}>Yes</button>
              <button type="button" className="stake-no" onClick={handleStakeNo}>No</button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="eyebrow stake-eyebrow"><span /> USDX / STAKE AMOUNT</p>
            <h2 className="stake-title">HOW MUCH HAVE YOU STAKED?</h2>
            <p className="stake-question">Select the plan you have invested in.</p>
            <div className="stake-options">
              <button type="button" className="stake-option" onClick={() => handleAmount("$500")}>$500</button>
              <button type="button" className="stake-option" onClick={() => handleAmount("$1000")}>$1000</button>
              <button type="button" className="stake-option" onClick={() => handleAmount("$5000")}>$5000</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="eyebrow stake-eyebrow"><span /> USDX / NOTIFICATIONS</p>
            <h2 className="stake-title">MONTHLY PROGRESS EMAIL?</h2>
            <p className="stake-question">Would you like to receive a monthly email notifying you of your investment progress?</p>
            <div className="stake-options">
              <button type="button" className={`stake-yes ${notify === true ? "stake-selected" : ""}`} onClick={() => handleNotify(true)}>Yes</button>
              <button type="button" className={`stake-no ${notify === false ? "stake-selected" : ""}`} onClick={() => handleNotify(false)}>No</button>
            </div>
            <div className="stake-date-field">
              <label className="stake-date-label" htmlFor="stake-date">WHEN DID YOU STAKE?</label>
              <input
                id="stake-date"
                type="date"
                className="stake-date"
                value={dateOfStake}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(event) => setDateOfStake(event.target.value)}
              />
            </div>
            <button type="button" className="primary-cta stake-continue" onClick={handleContinue} disabled={saving}>
              {saving ? "Saving…" : (<><span className="register-submit-label">Continue</span><span aria-hidden="true">→</span></>)}
            </button>
          </>
        )}

        {error ? <p className="stake-error" role="alert">{error}</p> : null}
      </div>
    </section>
  );
}

export default function LandingExperience() {
  const canvasRef = useRef(null);
  const pageRef = useRef(null);
  const initialized = useRef(false);
  const cleanupRef = useRef(() => {});
  const registeredEmail = useSyncExternalStore(
    subscribeToRegisteredEmail,
    getRegisteredEmailSnapshot,
    getRegisteredEmailServerSnapshot
  );

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

  return (
    <main className="usdx-shell" ref={pageRef}>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js" strategy="afterInteractive" onReady={initialise} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js" strategy="afterInteractive" onReady={initialise} />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js" strategy="afterInteractive" onReady={initialise} />
      <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />

      <nav className="site-nav glass-panel">
        <Link href="/" className="brand"><span>U</span> USDX <i>•</i> OS <small>YOUTH WING</small></Link>
        <div className="nav-links"><a href="#protocol">Protocol</a><a href="#capabilities">Capabilities</a><a href="#signal">Signal</a></div>
        <Link href="/guide" className="nav-cta">Open guide <b>↗</b></Link>
      </nav>

      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow reveal-hero"><span /> USDX / COMPOUNDING INTELLIGENCE</p>
          <h1 className="reveal-hero">Build momentum.<br /><em>Compound clarity.</em></h1>
          <p className="hero-description reveal-hero">A precision workspace for seeing the path, owning each milestone, and making your next move with confidence.</p>
          <div className="hero-actions reveal-hero"><Link href="/register" className="primary-cta">Register Now <span>→</span></Link><a href="#protocol" className="text-cta">Explore the protocol <span>→</span></a><Link href="/guide" className="text-cta">Open Guide <span>↗</span></Link></div>
          <div className="trust-line reveal-hero"><span className="avatars">◉ ◉ ◉</span><span>Designed for focused growth.<br />Built for the long run.</span></div>
        </div>
        <div className="hero-visual orbital">
          <div className="orbital-ring ring-one" /><div className="orbital-ring ring-two" />
          <div className="core-orb">
            <Image
              src="/images/usdx-logo.png"
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
      {registeredEmail ? <StakeSection email={registeredEmail} /> : null}
      <footer className="landing-footer flex-wrap items-start gap-8">
        <div className="flex items-center gap-3"><Image src="/images/youth-wing.jpeg" alt="USDX Smart Youth Wing" width={48} height={48} className="h-12 w-12 rounded-full border border-cyan-300/40 object-cover" /><div className="flex flex-col gap-1"><span>YOUTH WING</span><strong className="text-xs tracking-[.08em] text-white">SABARESH V S B</strong><a className="text-cyan-300 hover:text-white" href="tel:+919003788941">+91 90037 88941</a></div></div>
        <div className="flex items-center gap-3"><Image src="/images/vision-builders.jpeg" alt="Vision Builders" width={48} height={48} className="h-12 w-12 rounded-full border border-cyan-300/40 object-cover" /><div className="flex flex-col gap-1"><span>VISION BUILDERS LEADER</span><strong className="text-xs tracking-[.08em] text-white">ARUL SABARISH</strong><a className="text-cyan-300 hover:text-white" href="tel:+917418485677">+91 74184 85677</a></div></div>
        <div className="ml-auto flex flex-col gap-1 text-right"><span>© 2026 USDX</span><span>COMPOUNDING INTELLIGENCE</span><span className="mt-2 text-[8px] tracking-[.16em] text-white/35">WEB BUILT BY SABARESH V S B</span></div>
      </footer>
    </main>
  );
}
