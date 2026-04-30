import { useRef, useEffect, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

import api, { getApiError } from "../services/api.js";

const starterMessages = [
  { role: "assistant", text: "Ask me for recommendations, streaming availability, or Blu-ray deals." },
];

export default function Chatbot() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event) {
    event.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((current) => [...current, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/chatbot", { message: userMessage });
      setMessages((current) => [
        ...current,
        { role: "assistant", text: data.reply, suggestions: data.suggestions },
      ]);
    } catch (err) {
      setError(getApiError(err, "Assistant failed."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl py-6">
      {/* Header */}
      <div className="mb-6">
        <p className="section-label mb-1">Gemini powered</p>
        <h1 className="font-display text-5xl uppercase leading-none tracking-wide text-white">VaultBot</h1>
        <p className="mt-2 text-sm text-white/30">Ask for recommendations, streaming info, or Blu-ray deals.</p>
      </div>

      {/* Chat window */}
      <div className="panel flex flex-col rounded-2xl" style={{ height: "60vh" }}>
        {/* Bot identity bar */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <Bot size={18} />
            <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-noir-900" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">VaultBot</p>
            <p className="text-xs text-white/25">Gemini · Live API context</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={[
                "flex gap-3",
                message.role === "user" ? "flex-row-reverse" : "flex-row",
              ].join(" ")}
            >
              {message.role === "assistant" && (
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Bot size={13} />
                </div>
              )}
              <div className={["max-w-[78%]", message.role === "user" ? "items-end" : "items-start", "flex flex-col gap-2"].join(" ")}>
                <div
                  className={[
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "rounded-tr-sm bg-amber-500 font-medium text-noir-950"
                      : "rounded-tl-sm border border-white/[0.07] bg-noir-800/80 text-white/80",
                  ].join(" ")}
                >
                  {message.text}
                </div>
                {message.suggestions?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {message.suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => setInput(suggestion)}
                        className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-3 py-1 text-xs font-medium text-amber-300 transition-all hover:border-amber-500/40 hover:bg-amber-500/10"
                      >
                        <Sparkles size={10} />
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <Bot size={13} />
              </div>
              <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-noir-800/80 px-4 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error ? <p className="error-box text-xs">{error}</p> : null}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form className="flex gap-3 border-t border-white/[0.06] p-4" onSubmit={sendMessage}>
          <input
            className="field text-sm"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recommendations, deals, or streaming..."
          />
          <button type="submit" className="btn-primary shrink-0" disabled={loading}>
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
