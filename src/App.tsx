/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Player from "./components/Player";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[30%] h-[30%] bg-blue-100 rounded-full blur-[100px]" />
      </div>

      <header className="relative border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-emerald-400 rounded-sm animate-pulse" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">Nexus <span className="text-emerald-600">Engine</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
            <a href="#" className="hover:text-slate-900 transition-colors">Core API</a>
            <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
            <span className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs border border-emerald-100">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              Node Engine v1.0
            </div>
          </nav>
        </div>
      </header>

      <main className="relative py-8">
        <Player />
      </main>

      <footer className="border-t border-slate-200 py-12 mt-12 bg-white">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-sm text-slate-500 max-w-sm">
              Implementación avanzada para ingeniería inversa de flujos multimedia, 
              proxy dinámico y sanitización de manifiestos HLS.
            </p>
          </div>
          <div className="flex justify-end gap-4 text-xs font-mono text-slate-400">
            <span>PACKER_DEOBF: ENABLED</span>
            <span>HLS_REWRITER: ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
