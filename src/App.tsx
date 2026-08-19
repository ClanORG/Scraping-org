/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Player from "./components/Player";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      <main className="relative py-12 px-4">
        <Player />
      </main>
    </div>
  );
}
