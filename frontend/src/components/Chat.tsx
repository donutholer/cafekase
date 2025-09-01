import React, { useState, useEffect, useRef } from "react";
import { useChatStore } from "../stores/chatStores";
import { motion } from "framer-motion";

export function Chat() {
    const [input, setInput] = useState("");
    const {
        messages,
        loading,
        sendUserMessage,
        drinkRecommendation,
        reset,
        initialize,
    } = useChatStore();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const spring = {
        type: "spring" as const,
        stiffness: 180,
        damping: 26,
        mass: 0.9,
    };

    useEffect(() => {
        initialize();
    }, []);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;
        const message = input;
        setInput("");
        await sendUserMessage(message);
    };

    return (
        <div className="min-h-screen bg-neutral-50 text-neutral-900 antialiased selection:bg-black/10 relative">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.7]"
                    style={{
                        background:
                            "radial-gradient(120vh 70vh at 50% -10%, rgba(0,0,0,.06), transparent 60%)",
                    }}
                />
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(0deg, rgba(0,0,0,.8) 0, rgba(0,0,0,.8) 1px, transparent 1px, transparent 3px)",
                    }}
                />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="mb-6 sm:mb-8"
                >
                    <div
                        className="rounded-[24px] p-6 sm:p-7 shadow-lg ring-1 ring-black/5
                       supports-[backdrop-filter]:bg-white/55 supports-[backdrop-filter]:backdrop-blur-2xl
                       bg-white"
                    >
                        <h1 className="text-[34px] sm:text-[40px] font-[250] leading-tight tracking-tight">
                            Cafékase
                        </h1>
                        <p className="mt-1.5 text-[15px] text-neutral-600 font-[350]">
                            Your perfect drink, thoughtfully curated
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={spring}
                    className="rounded-[24px] overflow-hidden shadow-xl ring-1 ring-black/5
                     supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur-2xl
                     bg-white"
                >
                    <div className="h-[520px] overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 scrollbar-hide">
                        {messages
                            .filter((m) => m.content)
                            .map((message, idx) => (
                                <motion.div
                                    key={idx}
                                    layout
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={spring}
                                    className={`flex ${
                                        message.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <motion.div
                                        layout
                                        whileHover={{ y: -1 }}
                                        transition={spring}
                                        className={`max-w-[78%] px-4 py-3.5 sm:px-5 sm:py-4 rounded-[18px] text-[15px] leading-[1.55] font-[350] shadow-md
                              ${
                                  message.role === "user"
                                      ? "bg-neutral-900 text-white ring-1 ring-black/70"
                                      : "bg-white text-neutral-900 ring-1 ring-black/10"
                              }`}
                                        style={{
                                            boxShadow:
                                                message.role === "user"
                                                    ? "0 8px 22px rgba(0,0,0,.18)"
                                                    : "0 6px 18px rgba(0,0,0,.08)",
                                        }}
                                    >
                                        {message.content}
                                    </motion.div>
                                </motion.div>
                            ))}

                        {loading && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={spring}
                                className="flex justify-start"
                            >
                                <div className="rounded-[16px] px-4 py-3.5 bg-white ring-1 ring-black/10 shadow-md">
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-neutral-500/60 rounded-full animate-bounce" />
                                            <div
                                                className="w-2 h-2 bg-neutral-500/60 rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: ".12s",
                                                }}
                                            />
                                            <div
                                                className="w-2 h-2 bg-neutral-500/60 rounded-full animate-bounce"
                                                style={{
                                                    animationDelay: ".24s",
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm text-neutral-500">
                                            Thinking…
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

                    <div className="px-4 sm:px-5 py-4 sm:py-5 supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:backdrop-blur-xl bg-white">
                        {!drinkRecommendation ? (
                            <form onSubmit={handleSend} className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) =>
                                                setInput(e.target.value)
                                            }
                                            placeholder="Share your preferences..."
                                            className="w-full rounded-[16px] px-4 py-3 bg-neutral-900/[0.03]
                                 text-neutral-900 placeholder-neutral-500
                                 ring-1 ring-black/10 focus:outline-none focus:ring-black/20
                                 focus:border-transparent transition-[box-shadow,background-color]
                                 duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,.6)]"
                                            disabled={loading}
                                        />
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.015, y: -0.5 }}
                                        whileTap={{ scale: 0.985 }}
                                        transition={spring}
                                        type="submit"
                                        disabled={loading || !input.trim()}
                                        className="rounded-[14px] px-5 py-2.5 bg-neutral-900 text-white
                               ring-1 ring-black/70 shadow-lg
                               disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div>
                                                <span>Sending…</span>
                                            </div>
                                        ) : (
                                            "Send Message"
                                        )}
                                    </motion.button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center">
                                <div className="rounded-[16px] p-5 bg-neutral-900/[0.03] ring-1 ring-black/10 shadow-md">
                                    <p className="text-neutral-700 mb-4">
                                        ✨ Your perfect drink recommendation is
                                        ready!
                                    </p>
                                    <motion.button
                                        whileHover={{ scale: 1.015, y: -0.5 }}
                                        whileTap={{ scale: 0.985 }}
                                        transition={spring}
                                        onClick={reset}
                                        className="rounded-[14px] px-6 py-2.5 bg-neutral-900 text-white ring-1 ring-black/70 shadow-lg"
                                    >
                                        Start New Conversation
                                    </motion.button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            <style>{`
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: .001ms !important; animation-iteration-count: 1 !important;
              transition-duration: .001ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
        </div>
    );
}
