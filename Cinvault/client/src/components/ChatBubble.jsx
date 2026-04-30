import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Maximize2, Minimize2, Send, Sparkles, X } from "lucide-react";

import api, { getApiError } from "../services/api.js";

const BUBBLE_SIZE = 56;
const PANEL_W = 360;
const PANEL_H = 500;
const DRAG_THRESHOLD = 6; // px moved before it counts as a drag not a click

const starterMessages = [
  { role: "assistant", text: "Hey! Ask me for recommendations, streaming info, or Blu-ray deals." },
];

export default function ChatBubble() {
  // Bubble position (bottom-right corner of bubble in viewport coords)
  const [bubblePos, setBubblePos] = useState({
    x: window.innerWidth - BUBBLE_SIZE - 24,
    y: window.innerHeight - BUBBLE_SIZE - 24,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);

  const bubbleRef = useRef(null);
  const panelRef = useRef(null);
  const dragState = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // ── Keep bubble inside viewport on resize ──────────────────────────────────
  useEffect(() => {
    function onResize() {
      setBubblePos((p) => ({
        x: Math.min(p.x, window.innerWidth - BUBBLE_SIZE - 8),
        y: Math.min(p.y, window.innerHeight - BUBBLE_SIZE - 8),
      }));
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Scroll to bottom on new message ───────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // ── Focus input when panel opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setUnread(0);
    }
  }, [isOpen]);

  // ── Bubble drag ────────────────────────────────────────────────────────────
  const onBubbleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: bubblePos.x,
      originY: bubblePos.y,
      moved: false,
    };
    window.addEventListener("mousemove", onBubbleMove);
    window.addEventListener("mouseup", onBubbleUp);
  }, [bubblePos]);

  const onBubbleMove = useCallback((e) => {
    const s = dragState.current;
    if (!s) return;
    const dx = e.clientX - s.startX;
    const dy = e.clientY - s.startY;

    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;

    const newX = Math.max(0, Math.min(s.originX + dx, window.innerWidth - BUBBLE_SIZE));
    const newY = Math.max(0, Math.min(s.originY + dy, window.innerHeight - BUBBLE_SIZE));
    setBubblePos({ x: newX, y: newY });
  }, []);

  const onBubbleUp = useCallback(() => {
    const s = dragState.current;
    dragState.current = null;
    window.removeEventListener("mousemove", onBubbleMove);
    window.removeEventListener("mouseup", onBubbleUp);

    // Only toggle panel if it was a click, not a drag
    if (s && !s.moved) {
      setIsOpen((v) => !v);
    }
  }, [onBubbleMove]);

  // Touch equivalents for bubble
  const onBubbleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    dragState.current = {
      startX: t.clientX,
      startY: t.clientY,
      originX: bubblePos.x,
      originY: bubblePos.y,
      moved: false,
    };
    window.addEventListener("touchmove", onBubbleTouchMove, { passive: false });
    window.addEventListener("touchend", onBubbleTouchEnd);
  }, [bubblePos]);

  const onBubbleTouchMove = useCallback((e) => {
    e.preventDefault();
    const t = e.touches[0];
    const s = dragState.current;
    if (!s) return;
    const dx = t.clientX - s.startX;
    const dy = t.clientY - s.startY;
    if (!s.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    s.moved = true;
    const newX = Math.max(0, Math.min(s.originX + dx, window.innerWidth - BUBBLE_SIZE));
    const newY = Math.max(0, Math.min(s.originY + dy, window.innerHeight - BUBBLE_SIZE));
    setBubblePos({ x: newX, y: newY });
  }, []);

  const onBubbleTouchEnd = useCallback(() => {
    const s = dragState.current;
    dragState.current = null;
    window.removeEventListener("touchmove", onBubbleTouchMove);
    window.removeEventListener("touchend", onBubbleTouchEnd);
    if (s && !s.moved) setIsOpen((v) => !v);
  }, [onBubbleTouchMove]);

  // ── Panel header drag ─────────────────────────────────────────────────────
  // Panel is anchored relative to bubble — so dragging the panel header
  // is actually just moving the bubble position.
  const onPanelHeaderMouseDown = useCallback((e) => {
    if (e.target.closest("button")) return;
    e.preventDefault();
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: bubblePos.x,
      originY: bubblePos.y,
      moved: true, // panel drag always moves, never toggles
    };
    window.addEventListener("mousemove", onBubbleMove);
    window.addEventListener("mouseup", onPanelHeaderUp);
  }, [bubblePos, onBubbleMove]);

  const onPanelHeaderUp = useCallback(() => {
    dragState.current = null;
    window.removeEventListener("mousemove", onBubbleMove);
    window.removeEventListener("mouseup", onPanelHeaderUp);
  }, [onBubbleMove]);

  // ── API ───────────────────────────────────────────────────────────────────
  async function sendMessage(e) {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/chatbot", { message: text });
      setMessages((m) => [...m, { role: "assistant", text: data.reply, suggestions: data.suggestions }]);
      if (!isOpen) setUnread((n) => n + 1);
    } catch (err) {
      setError(getApiError(err, "Assistant failed."));
    } finally {
      setLoading(false);
    }
  }

  // ── Panel position: float above/beside the bubble ─────────────────────────
  const panelW = isExpanded ? Math.min(480, window.innerWidth - 32) : PANEL_W;
  const panelH = isExpanded ? Math.min(660, window.innerHeight - 120) : PANEL_H;
  const gap = 12;

  // Prefer opening above the bubble; if not enough space, open below
  const spaceAbove = bubblePos.y;
  const spaceBelow = window.innerHeight - bubblePos.y - BUBBLE_SIZE;
  const openAbove = spaceAbove >= panelH + gap || spaceAbove >= spaceBelow;

  let panelTop = openAbove
    ? bubblePos.y - panelH - gap
    : bubblePos.y + BUBBLE_SIZE + gap;
  panelTop = Math.max(8, Math.min(panelTop, window.innerHeight - panelH - 8));

  // Prefer opening left-aligned with bubble; clamp to viewport
  let panelLeft = bubblePos.x + BUBBLE_SIZE / 2 - panelW / 2;
  panelLeft = Math.max(8, Math.min(panelLeft, window.innerWidth - panelW - 8));

  return (
    <>
      {/* ── Chat panel ── */}
      {isOpen && (
        <div
          ref={panelRef}
          className="animate-bounce-in fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-noir-900 shadow-[0_24px_80px_rgba(0,0,0,0.7)]"
          style={{
            left: panelLeft,
            top: panelTop,
            width: panelW,
            height: panelH,
            transition: "width 0.2s, height 0.2s",
          }}
        >
          {/* Header — drag handle (moves the whole widget) */}
          <div
            className="flex cursor-grab items-center gap-3 border-b border-white/[0.06] px-4 py-3 select-none active:cursor-grabbing"
            onMouseDown={onPanelHeaderMouseDown}
          >
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Bot size={16} />
              <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-noir-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-none">VaultBot</p>
              <p className="mt-0.5 text-[10px] text-white/25">Gemini · drag to reposition</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/60"
              >
                {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-white/25 transition hover:bg-white/[0.06] hover:text-white/60"
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={[
                  "flex gap-2",
                  msg.role === "user" ? "flex-row-reverse animate-msg-right" : "flex-row animate-msg-left",
                ].join(" ")}
                style={{ animationDelay: `${Math.min(i * 0.04, 0.2)}s` }}
              >
                {msg.role === "assistant" && (
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                    <Bot size={11} />
                  </div>
                )}
                <div className={["flex max-w-[82%] flex-col gap-1.5", msg.role === "user" ? "items-end" : "items-start"].join(" ")}>
                  <div
                    className={[
                      "rounded-2xl px-3 py-2 text-[13px] leading-relaxed",
                      msg.role === "user"
                        ? "rounded-tr-sm bg-amber-500 font-medium text-noir-950"
                        : "rounded-tl-sm border border-white/[0.07] bg-white/[0.04] text-white/75",
                    ].join(" ")}
                  >
                    {msg.text}
                  </div>
                  {msg.suggestions?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {msg.suggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInput(s)}
                          className="flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-amber-300 transition hover:border-amber-500/40"
                        >
                          <Sparkles size={9} />
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                  <Bot size={11} />
                </div>
                <div className="flex gap-1 rounded-2xl rounded-tl-sm border border-white/[0.07] bg-white/[0.04] px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/25" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            )}

            {error && <p className="error-box text-xs">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="flex gap-2 border-t border-white/[0.06] p-3" onSubmit={sendMessage}>
            <input
              ref={inputRef}
              className="field text-[13px]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about movies, deals, streaming…"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="group/send flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-noir-950 transition-all duration-200 hover:bg-amber-400 hover:scale-110 active:scale-90 disabled:opacity-40"
            >
              <Send size={14} className="transition-transform duration-200 group-hover/send:translate-x-0.5 group-hover/send:-translate-y-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Draggable bubble ── */}
      <div
        ref={bubbleRef}
        className="fixed z-50 select-none"
        style={{ left: bubblePos.x, top: bubblePos.y }}
        onMouseDown={onBubbleMouseDown}
        onTouchStart={onBubbleTouchStart}
        title={isOpen ? "Close · drag to move" : "Open assistant · drag to move"}
      >
        {/* Pulse rings — only when closed */}
        {!isOpen && (
          <>
            <span className="pulse-ring" />
            <span className="pulse-ring pulse-ring-2" />
          </>
        )}

        <div
          className={[
            "relative flex h-14 w-14 cursor-grab items-center justify-center rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-colors duration-200 active:cursor-grabbing active:scale-90",
            isOpen
              ? "bg-noir-800 border border-white/[0.08] text-white/60"
              : "animate-jiggle bg-amber-500 text-noir-950 shadow-glow",
          ].join(" ")}
        >
          <div className={isOpen ? "" : "transition-transform duration-200 hover:scale-110"}>
            {isOpen ? <X size={20} /> : <Bot size={22} />}
          </div>

          {/* Unread badge */}
          {!isOpen && unread > 0 && (
            <span className="animate-pop-in absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-noir-950">
              {unread}
            </span>
          )}
        </div>
      </div>
    </>
  );
}
