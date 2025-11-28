import React from 'react';
import PlayerCard from './components/PlayerCard';

function App() {
  const players = [
    'Harry', 'Sarah', 'Marcus', 'Luna', 'Diego', 'Zara'
  ];

  const handleAction = (player, action) => {
    console.log(`${player} - ${action} clicked`);
  };

  return (
    <>
      <div className="scanline"></div>

      <div className="max-w-[1200px] mx-auto">
        <div className="text-center text-6xl mb-20 tracking-[8px] drop-shadow-[4px_4px_0_#333] md:text-4xl md:tracking-[4px]">
          BANKRUN
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-10 p-5 md:grid-cols-1">
          {players.map((player) => (
            <PlayerCard
              key={player}
              name={player}
              onU8={() => handleAction(player, 'u12')}
              onO8={() => handleAction(player, 'o11')}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
