/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import GameCanvas from './components/GameCanvas';

export default function App() {
  return (
    <main className="fixed inset-0 bg-black overflow-hidden game-container">
      <GameCanvas />
    </main>
  );
}

