"use client";

import { useEffect, useRef, useState } from "react";

const SUGGESTED = [
  "What is USDX Compounding?",
  "How does the monthly ROI work?",
  "How do I register?",
  "How do I find my stake date?",
  "What are the three plans?",
  "How do I enable monthly email updates?",
];

const FAQ_RULES = [
  {
    match: ["monthly email", "email update", "notification", "monthly notif"],
    reply:
      "Once you enter a valid wallet address on the landing page, the \"Monthly email updates\" section appears. Choose \"Yes, notify me\" to enable it — we will set your preference in our records and email a confirmation, then send monthly updates starting next month.",
  },
  {
    match: ["stake date", "find my stake", "wallet", "find stake", "when did i stake"],
    reply:
      "On the landing page, log in and enter the wallet address you staked with in the \"Enter your wallet address\" box. We read the Base blockchain to pull your stake date, stake amount, and the matching plan automatically.",
  },
  {
    match: ["plan", "500", "1000", "5000", "three plan", "tiers"],
    reply:
      "There are three compounding plans: the $500 Starter, the $1,000 Advanced, and the $5,000 Professional. Your plan is auto-detected from your stake amount (a stake of $250 shows the $500 plan, $500 shows the $1,000 plan, and $2,500 shows the $5,000 plan).",
  },
  {
    match: ["register", "sign up", "join", "create account"],
    reply:
      "Click \"Register Now\" on the landing page, enter your name and email, and submit. We will save your registration and send a welcome email confirming it. After that you can log in with the same email.",
  },
  {
    match: ["roi", "interest", "return", "earn", "profit", "9%"],
    reply:
      "ROI is collected monthly on a 30-day cycle. You add the monthly ROI to your re-stake balance and create new IDs whenever the balance reaches the required threshold — the full monthly instructions for your plan are shown after you enter your wallet.",
  },
  {
    match: ["guide", "roadmap", "instruction", "checklist", "steps"],
    reply:
      "Open the guide from the top navigation or the \"Open Guide\" buttons to see the full monthly roadmap for each plan, including the ID growth signal and every month's instruction.",
  },
  {
    match: ["compounding", "how it work", "scheme", "what is usdx", "program"],
    reply:
      "USDX Compounding is a long-term compounding scheme. You stake an amount, collect monthly ROI, and systematically re-stake to grow your active IDs over a 60-month (or 36-month) horizon. Each plan has a detailed monthly roadmap.",
  },
  {
    match: ["login", "log in", "sign in", "already registered", "already have"],
    reply:
      "Click \"Login\" on the landing page (or the \"Already registered? Log in\" button on the registration page) and enter the email you registered with.",
  },
  {
    match: ["contact", "email", "phone", "help", "support", "call", "reach"],
    reply:
      "You can reach us at usdxcompounding@gmail.com or call +91 90037 88941. We are happy to help with any questions or technical issues.",
  },
  {
    match: ["token", "price", "usdxsmart", "value", "live"],
    reply:
      "The live USDXSMART token price is shown in the ticker at the top of the landing page, refreshed every minute.",
  },
];

const GREETING_REPLY =
  "Hi! I'm the USDX assistant. I can help you with registration, wallet lookups, plans, ROI, and monthly updates. Pick a question below or type your own.";

const FALLBACK_REPLY =
  "I can help with registration, wallet lookups, the three plans, monthly ROI, and email updates. Try asking about one of those, or tap a suggested question below.";

function getReply(input) {
  const text = input.toLowerCase();
  if (!text) return FALLBACK_REPLY;
  let best = null;
  for (const rule of FAQ_RULES) {
    let score = 0;
    for (const keyword of rule.match) {
      if (text.includes(keyword)) score += keyword.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, reply: rule.reply };
  }
  return best ? best.reply : FALLBACK_REPLY;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const ask = (question) => {
    const q = (question || "").trim();
    if (!q) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", text: q },
      { role: "bot", text: getReply(q) },
    ]);
    setInput("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    ask(input);
  };

  return (
    <>
      <button
        type="button"
        className={`chat-fab${open ? " is-open" : ""}`}
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "✕" : "💬"}
      </button>

      {open ? (
        <section className="chat-widget glass-panel" aria-label="USDX assistant chat">
          <header className="chat-head">
            <span className="chat-head-brand"><i /> USDX ASSISTANT</span>
            <span className="chat-head-status">ONLINE</span>
          </header>

          <div className="chat-body" ref={scrollRef}>
            <div className="chat-msg bot">👋 {GREETING_REPLY}</div>
            {messages.map((message, index) => (
              <div className={`chat-msg ${message.role}`} key={`${message.role}-${index}`}>
                {message.text}
              </div>
            ))}
          </div>

          <div className="chat-suggestions">
            {SUGGESTED.map((suggestion) => (
              <button type="button" className="chat-chip" key={suggestion} onClick={() => ask(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your question…"
              aria-label="Your question"
              autoComplete="off"
            />
            <button type="submit" aria-label="Send">→</button>
          </form>
        </section>
      ) : null}
    </>
  );
}
