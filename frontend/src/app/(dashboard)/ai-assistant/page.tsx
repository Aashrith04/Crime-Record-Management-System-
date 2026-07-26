"use client";

import React, { useState } from "react";
import { BrainCircuit, Sparkles, Search, FileText, AlertTriangle, UserCheck } from "lucide-react";
import { api } from "@/services/api";

export default function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<"summarizer" | "predictor" | "offenders">("summarizer");

  // Summarizer State
  const [firNumber, setFirNumber] = useState("FIR-2026-1001");
  const [firResult, setFirResult] = useState<any>(null);
  const [loadingSummarizer, setLoadingSummarizer] = useState(false);

  // Predictor State
  const [crimeType, setCrimeType] = useState("Robbery");
  const [description, setDescription] = useState("Suspects used firearm to breach store vault at midnight.");
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [loadingPredictor, setLoadingPredictor] = useState(false);

  // Offender State
  const [offenderQuery, setOffenderQuery] = useState("Robbery suspect with scar");
  const [offendersResult, setOffendersResult] = useState<any[]>([]);
  const [loadingOffenders, setLoadingOffenders] = useState(false);

  const handleSummarize = async () => {
    setLoadingSummarizer(true);
    try {
      const res = await api.post("/ai/summarize-fir", { fir_number: firNumber });
      setFirResult(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSummarizer(false);
    }
  };

  const handlePredict = async () => {
    setLoadingPredictor(true);
    try {
      const res = await api.post("/ai/predict-severity", {
        crime_type: crimeType,
        description,
        location_name: "Central Sector"
      });
      setPredictionResult(res.data?.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPredictor(false);
    }
  };

  const handleSearchOffenders = async () => {
    setLoadingOffenders(true);
    try {
      const res = await api.post("/ai/repeat-offenders", { query: offenderQuery });
      setOffendersResult(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOffenders(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-cyan-400" />
          <span>Law Enforcement AI Copilot & NLP Intelligence</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI-driven automated FIR summarizer, crime severity risk scoring, and repeat offender pattern recognition.</p>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-800 gap-2 text-xs font-medium">
        <button
          onClick={() => setActiveTab("summarizer")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
            activeTab === "summarizer" ? "border-cyan-400 text-cyan-400 bg-cyan-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>FIR Summarizer</span>
        </button>
        <button
          onClick={() => setActiveTab("predictor")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
            activeTab === "predictor" ? "border-cyan-400 text-cyan-400 bg-cyan-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Severity Risk Predictor</span>
        </button>
        <button
          onClick={() => setActiveTab("offenders")}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
            activeTab === "offenders" ? "border-cyan-400 text-cyan-400 bg-cyan-950/20" : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Repeat Offender Matcher</span>
        </button>
      </div>

      {/* Tab 1: FIR Summarizer */}
      {activeTab === "summarizer" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200">Summarize Registered FIR Record</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Enter FIR Number</label>
              <input
                type="text"
                value={firNumber}
                onChange={(e) => setFirNumber(e.target.value)}
                placeholder="e.g. FIR-2026-1001"
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
              />
            </div>
            <button
              onClick={handleSummarize}
              disabled={loadingSummarizer}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingSummarizer ? "Processing FIR..." : "Execute AI NLP Summary"}</span>
            </button>
          </div>

          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-3">AI Intelligence Output</h2>
            {firResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">Incident Narrative</p>
                  <p className="text-slate-200 font-medium mt-1">{firResult.key_incident_summary}</p>
                </div>
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">Calculated Threat Risk</p>
                  <p className="text-rose-400 font-bold mt-1 font-mono">{firResult.risk_level}</p>
                </div>
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">Suggested Investigative Action Plan</p>
                  <ul className="list-disc list-inside text-cyan-300 mt-1 space-y-1">
                    {firResult.suggested_action_plan?.map((act: string, idx: number) => (
                      <li key={idx}>{act}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Run FIR summarizer to view AI legal analysis.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Severity Risk Predictor */}
      {activeTab === "predictor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
            <h2 className="text-sm font-bold text-slate-200">Predict Crime Incident Severity</h2>
            <div>
              <label className="block text-slate-400 mb-1">Crime Type</label>
              <select
                value={crimeType}
                onChange={(e) => setCrimeType(e.target.value)}
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              >
                <option value="Robbery">Robbery</option>
                <option value="Assault">Assault</option>
                <option value="Cybercrime">Cybercrime</option>
                <option value="Homicide">Homicide</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Incident Narrative Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-slate-100"
              />
            </div>
            <button
              onClick={handlePredict}
              disabled={loadingPredictor}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loadingPredictor ? "Calculating..." : "Predict Risk & Severity"}</span>
            </button>
          </div>

          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-3">Predicted Risk Matrix</h2>
            {predictionResult ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">Predicted Severity</p>
                  <p className="text-rose-400 font-bold text-base font-mono">{predictionResult.predicted_severity}</p>
                </div>
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">AI Model Confidence Score</p>
                  <p className="text-cyan-400 font-bold font-mono">{(predictionResult.confidence_score * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 bg-[#1c2541]/50 rounded-lg border border-slate-800">
                  <p className="text-slate-400 text-[10px] uppercase">Identified Threat Factors</p>
                  <ul className="list-disc list-inside text-amber-300 mt-1 space-y-1">
                    {predictionResult.risk_factors?.map((rf: string, idx: number) => (
                      <li key={idx}>{rf}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Submit crime details to predict severity score.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Repeat Offender Matcher */}
      {activeTab === "offenders" && (
        <div className="space-y-4">
          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-200">Natural Language Repeat Offender Search</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={offenderQuery}
                onChange={(e) => setOffenderQuery(e.target.value)}
                placeholder='e.g. "Robbery suspect with scar"'
                className="flex-1 bg-[#1c2541]/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
              <button
                onClick={handleSearchOffenders}
                disabled={loadingOffenders}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Match Criminals</span>
              </button>
            </div>
          </div>

          <div className="bg-[#0b132b] border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-200 mb-3">Matching Offender Profiles</h2>
            {offendersResult.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offendersResult.map((o, idx) => (
                  <div key={idx} className="p-3 bg-[#1c2541]/40 border border-slate-800 rounded-lg text-xs space-y-1">
                    <p className="font-bold text-cyan-400">{o.full_name} <span className="text-slate-400">({o.alias || "No Alias"})</span></p>
                    <p className="text-slate-300">Similarity Match: <span className="text-emerald-400 font-mono">{(o.similarity_score * 100).toFixed(0)}%</span></p>
                    <p className="text-slate-400 font-mono text-[11px]">Linked Past Offenses: {o.past_crimes_count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No repeat offender profiles matched yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
