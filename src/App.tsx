/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Player from "./components/Player";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-10">
      <div className="tech-bg" />
      <Player />
    </div>
  );
}
