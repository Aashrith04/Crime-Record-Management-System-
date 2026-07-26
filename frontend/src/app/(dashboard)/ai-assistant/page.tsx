"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, Send, Sparkles, Shield, Tag, ExternalLink, ChevronDown, ChevronUp, Bot, User as UserIcon, Loader2, AlertCircle } from "lucide-react";
import { aiService, AIChatResponseData } from "@/services/aiService";
import { useAuth } from "@/providers/AuthProvider";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  responseMeta?: AIChatResponseData;
}

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Greetings Officer. I am CRMS Law Enforcement AI Copilot. I analyze police databases, FIR records, evidence lockers, and officer rosters. How may I assist your investigation today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});

  const chatMutation = useMutation({
    mutationFn: (text: string) => aiService.chatAssistant(text, conversationId),
    onSuccess: (res) => {
      const data = res.data;
      if (data?.conversation_id) setConversationId(data.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          sender: "assistant",
          text: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          responseMeta: data
        }
      ]);
    }
  });

  const handleSend = (textToSend?: string) => {
    const text = textToSend || prompt;
    if (!text.trim() || chatMutation.isPending) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setPrompt("");
    chatMutation.mutate(text);
  };

  const toggleReasoning = (msgId: string) => {
    setExpandedReasoning((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const presets = [
    "Summarize Crime CR-2026-1001",
    "Show repeat offenders near Sector 4",
    "List pending evidence in Locker A-1",
    "Which officer handled similar cases?"
  ];

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span>CRMS Investigation AI Copilot</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Grounding responses exclusively on active police database records & FIR registries.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-mono border border-cyan-500/30">
            Engine: Baseline RAG Copilot v1.0
          </span>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex-1 bg-[#0b132b] border border-slate-800 rounded-2xl p-4 overflow-y-auto space-y-4 shadow-xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs max-w-3xl ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 border ${
              msg.sender === "user" ? "bg-cyan-600/20 text-cyan-400 border-cyan-500/40" : "bg-blue-600/20 text-blue-400 border-blue-500/40"
            }`}>
              {msg.sender === "user" ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Content Bubble */}
            <div className="space-y-2 flex-1">
              <div className={`p-4 rounded-2xl border ${
                msg.sender === "user" 
                  ? "bg-cyan-600/20 border-cyan-500/30 text-slate-100 rounded-tr-none" 
                  : "bg-[#1c2541]/70 border-slate-800 text-slate-200 rounded-tl-none shadow-md"
              }`}>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                  <span className="font-bold uppercase tracking-wider">{msg.sender === "user" ? user?.full_name || "Officer" : "AI Copilot"}</span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Referenced Database Records Badges */}
                {msg.responseMeta?.referenced_records && msg.responseMeta.referenced_records.length > 0 && (
                  <div className="pt-3 border-t border-slate-800/80 mt-2 space-y-1.5">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-bold">Referenced Records:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.responseMeta.referenced_records.map((rec, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-black/50 border border-slate-700 text-[10px] text-slate-300 font-mono flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-cyan-400" />
                          <span>{rec.type}: {rec.crime_number || rec.fir_number || rec.evidence_number || rec.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Explainability & Confidence Meta Card */}
              {msg.responseMeta && (
                <div className="bg-[#1c2541]/40 border border-slate-800 rounded-xl p-3 text-[11px] space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-mono">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        {msg.responseMeta.confidence.confidence_percentage}% {msg.responseMeta.confidence.confidence_category} Confidence
                      </span>
                      <span className="text-slate-500 text-[10px]">Latency: {msg.responseMeta.confidence.processing_time_ms}ms</span>
                    </div>

                    <button
                      onClick={() => toggleReasoning(msg.id)}
                      className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                    >
                      <span>{expandedReasoning[msg.id] ? "Hide Explainability" : "Explain AI Finding"}</span>
                      {expandedReasoning[msg.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>

                  {expandedReasoning[msg.id] && (
                    <div className="pt-2 border-t border-slate-800 space-y-1 text-slate-300">
                      <p><span className="text-cyan-400 font-bold">Reasoning:</span> {msg.responseMeta.explainability.reasoning_summary}</p>
                      <p><span className="text-cyan-400 font-bold">Explanation:</span> {msg.responseMeta.explainability.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex gap-3 text-xs">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-bold">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-[#1c2541]/70 border border-slate-800 rounded-2xl p-4 text-slate-400 italic">
              Retrieving context from database & analyzing investigation records...
            </div>
          </div>
        )}
      </div>

      {/* Preset Suggestions & Input Area */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-xs">
          {presets.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSend(preset)}
              className="px-3 py-1 rounded-lg bg-[#0b132b] hover:bg-slate-800 text-slate-300 border border-slate-800 transition font-mono text-[11px] flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>{preset}</span>
            </button>
          ))}
        </div>

        <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-2 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI Copilot (e.g. Summarize FIR-2026-1001, Show repeat offenders)..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!prompt.trim() || chatMutation.isPending}
            className="p-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
