"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";
import { api } from "@/services/api";
import { useAuth } from "@/providers/AuthProvider";

const loginSchema = z.object({
  email: z.string().email("Invalid official email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@police.gov.in",
      password: "Admin@123456",
    },
  });

  const onSubmit = async (data: LoginFormInputs) => {
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await api.post("/auth/login", data);
      if (res.data?.success) {
        const { access_token, refresh_token } = res.data.data;
        // Fetch current user details
        const meRes = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        login(access_token, refresh_token, meRes.data.data);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Invalid credentials or portal connection failed.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#070d19] relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0b132b]/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Department Badge Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/20 border border-cyan-400/40">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 uppercase tracking-wide">
            STATE POLICE DEPARTMENT
          </h1>
          <p className="text-xs text-cyan-400 font-mono mt-1">Crime Record Management System (CRMS)</p>
        </div>

        {/* Quick Demo Role Selector */}
        <div className="mb-6 p-3 rounded-xl bg-[#1c2541]/40 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Quick Demo Login Presets
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setValue("email", "admin@police.gov.in");
                setValue("password", "Admin@123456");
              }}
              className="px-2.5 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-[11px] font-medium hover:bg-cyan-900/50 transition text-left"
            >
              Super Admin
            </button>
            <button
              type="button"
              onClick={() => {
                setValue("email", "officer@police.gov.in");
                setValue("password", "Officer@123456");
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-300 text-[11px] font-medium hover:bg-slate-700/50 transition text-left"
            >
              Police Officer
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Official Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register("email")}
                type="email"
                placeholder="officer@police.gov.in"
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                {...register("password")}
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#1c2541]/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
            {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>{submitting ? "Authenticating..." : "Authorize Access"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-6 font-mono">
          Authorized Law Enforcement Personnel Only • Sec-25-Gov
        </p>
      </div>
    </div>
  );
}
