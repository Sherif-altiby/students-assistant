"use client";

import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, Terminal, AlertTriangle, HelpCircle, Mail, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function NotFound() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0c] font-sans text-gray-200 flex items-center justify-center p-4">
        
      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Visual Impact */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left relative">
          <div className="absolute -top-8 left-0 flex items-center gap-2 px-3 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono uppercase tracking-widest animate-pulse">
            <AlertTriangle className="h-3.5 w-3.5" />
            System Error: 404
          </div>
          
          {/* Glitch 404 Text */}
          <h1 className="text-[7rem] md:text-[9rem] font-black tracking-tighter leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-400 to-white select-none relative filter drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] my-4">
            404
            <span className="absolute top-0 left-0.5 text-cyan-400 opacity-70 mix-blend-screen animate-glitch-1 select-none pointer-events-none">404</span>
            <span className="absolute top-0 -left-0.5 text-rose-500 opacity-70 mix-blend-screen animate-glitch-2 select-none pointer-events-none">404</span>
          </h1>

          <p className="text-sm font-mono text-cyan-400 tracking-wider uppercase mb-2">
            // Destination_Not_Found
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
            You've broken through the grid.
          </h2>
          <p className="mt-4 text-gray-400 max-w-sm text-balance">
            The coordinates you requested point to a void in production. Let's patch your routing.
          </p>
        </div>

        {/* Right Column: Interaction Hub */}
        <div className="lg:col-span-7 bg-[#121218]/80 border border-gray-800 backdrop-blur-md rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
          
          {/* Search Module */}
          <div className="mb-8">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
              <Terminal className="h-3.5 w-3.5 text-cyan-400" /> Query System Database
            </h3>
            <form onSubmit={handleSearch} className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paths, dashboards, docs..."
                className="w-full bg-[#181824] border border-gray-800 rounded-xl px-4 py-3.5 pl-12 text-white placeholder:text-gray-500 transition-all focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 group-hover:border-gray-700"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-cyan-500 hover:text-black text-xs font-mono text-gray-300 px-3 py-1.5 rounded-md transition-all border border-gray-700"
              >
                EXECUTE
              </button>
            </form>
          </div>

          {/* Navigation Matrix */}
          <div className="mb-8">
            <h3 className="text-xs font-mono uppercase tracking-widest text-gray-400 mb-3">
              Core Core Redirects
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-3 bg-[#181824] hover:bg-[#1f1f30] border border-gray-800 rounded-xl p-3 text-left transition-all group hover:scale-[1.01]"
              >
                <div className="p-2 rounded-lg bg-gray-800 text-gray-400 group-hover:text-white transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Step Back</div>
                  <div className="text-xs text-gray-500">Return to last node</div>
                </div>
              </button>

              <Link href="/" className="block">
                <div className="flex items-center gap-3 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 hover:from-cyan-500/20 hover:to-blue-500/10 border border-cyan-500/30 rounded-xl p-3 text-left transition-all group hover:scale-[1.01]">
                  <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">Central Hub</div>
                    <div className="text-xs text-cyan-400/70">Go to homepage</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <hr className="border-gray-800/60 my-6" />

          {/* Sub Directory Quick Links */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Docs", href: "/docs", icon: FileText },
                { label: "Help", href: "/help", icon: HelpCircle },
                { label: "Support", href: "/contact", icon: Mail },
              ].map((link) => (
                <Link key={link.label} href={link.href}>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#181824] hover:bg-[#1f1f30] border border-gray-800 text-xs text-gray-400 hover:text-white transition-all">
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
            
            <span className="text-[10px] font-mono text-gray-600 tracking-wider uppercase">
              Status: 404 // Out of Bounds
            </span>
          </div>

        </div>
      </div>

    
    </div>
  );
}