import { useState } from "react";
import { Bot, Send } from "lucide-react";

import api, { getApiError } from "../services/api.js";

const starterMessages = [
  { role: "assistant", text: "Ask me for recommendations, streaming availability, or Blu-ray deals." },
];

export default function Chatbot() {
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  function fillSuggestion(text) {
    setInput(text);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-3xl font-black text-white">CineVault assistant</h1>
        <p className="mt-1 text-sm text-slate-400">Gemini-powered answers using CineVault API data.</p>
      </div>

      <div className="panel flex min-h-[560px] flex-col rounded-lg">
        <div className="flex items-center gap-3 border-b border-white/10 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500/15 text-blue-200">
            <Bot size={20} />
          </div>
          <div>
            <p className="font-black text-white">VaultBot</p>
            <p className="text-xs text-slate-400">Gemini assistant with live API context</p>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-auto max-w-[80%]" : "mr-auto max-w-[80%]"}>
              <div className={message.role === "user" ? "rounded-lg bg-blue-500 p-3 text-white" : "rounded-lg border border-white/10 bg-white/5 p-3 text-slate-100"}>
                {message.text}
              </div>
              {message.suggestions?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {message.suggestions.map((suggestion) => (
                    <button key={suggestion} type="button" className="pill hover:border-blue-400/50" onClick={() => fillSuggestion(suggestion)}>
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <p className="text-sm text-slate-400">VaultBot is thinking...</p> : null}
          {error ? <p className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p> : null}
        </div>

        <form className="flex gap-2 border-t border-white/10 p-4" onSubmit={sendMessage}>
          <input className="field" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask for recommendations, deals, or streaming..." />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={17} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
