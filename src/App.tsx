import { useGameRoom } from './hooks/useGameRoom';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import ResultsPage from './pages/ResultsPage';

function VeggieBackground() {
  const veggies = [
    // Carrot
    <svg key="carrot" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6C18 11 16 18 17 27C18 36 20 40 20 40C20 40 22 36 23 27C24 18 22 11 20 6Z" fill="#f4845f"/>
      <path d="M20 6C20 6 17 2 14 0C17 3 19 6 20 6Z" fill="#4a7c59"/>
      <path d="M20 6C20 6 23 2 26 0C23 3 21 6 20 6Z" fill="#4a7c59"/>
      <path d="M20 6C20 6 20 1 20 0C20 1 20 6 20 6Z" fill="#4a7c59"/>
    </svg>,
    // Tomato
    <svg key="tomato" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="34" r="14" fill="#e63946"/>
      <path d="M20 20C20 20 17 15 14 13C17 16 20 20 20 20Z" fill="#4a7c59"/>
      <path d="M20 20C20 20 23 15 26 13C23 16 20 20 20 20Z" fill="#4a7c59"/>
      <path d="M20 20C20 20 20 14 20 11C20 14 20 20 20 20Z" fill="#4a7c59"/>
    </svg>,
    // Lettuce
    <svg key="lettuce" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="34" rx="17" ry="13" fill="#4a7c59"/>
      <ellipse cx="20" cy="34" rx="12" ry="9" fill="#6aaa6a"/>
      <ellipse cx="20" cy="34" rx="7" ry="5" fill="#4a7c59"/>
      <ellipse cx="20" cy="34" rx="3" ry="2.5" fill="#8bc34a"/>
    </svg>,
    // Onion
    <svg key="onion" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="36" rx="13" ry="15" fill="#9b59b6"/>
      <ellipse cx="20" cy="36" rx="9" ry="11" fill="#b07cc6"/>
      <ellipse cx="20" cy="36" rx="5" ry="6" fill="#9b59b6"/>
      <rect x="17" y="18" width="6" height="10" rx="3" fill="#4a7c59"/>
    </svg>,
    // Pepper
    <svg key="pepper" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 28C10 22 12 13 19 11C21 10 23 10 25 11C32 13 34 22 30 28C28 34 26 42 20 44C14 42 12 34 14 28Z" fill="#e63946"/>
      <path d="M19 11C19 7 20 4 20 4C20 4 21 7 21 11" fill="none" stroke="#4a7c59" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="17" y1="24" x2="23" y2="24" stroke="#c1121f" strokeWidth="1" opacity="0.4"/>
      <line x1="16" y1="30" x2="24" y2="30" stroke="#c1121f" strokeWidth="1" opacity="0.4"/>
    </svg>,
    // Cabbage
    <svg key="cabbage" width="40" height="56" viewBox="0 0 40 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="34" r="15" fill="#4a9aba"/>
      <circle cx="20" cy="34" r="11" fill="#5bb3d0"/>
      <circle cx="20" cy="34" r="7" fill="#4a9aba"/>
      <circle cx="20" cy="34" r="3.5" fill="#5bb3d0"/>
    </svg>,
  ];

  const items: { x: number; y: number; veggie: number; rot: number; scale: number }[] = [];
  const cols = 6;
  const rows = 10;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push({
        x: (c / cols) * 100 + (r % 2 === 0 ? 0 : 8),
        y: (r / rows) * 100,
        veggie: (r * cols + c) % 6,
        rot: ((r * cols + c) * 47) % 360,
        scale: 0.7 + (((r * cols + c) * 13) % 10) / 20,
      });
    }
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, opacity: 0.07 }}
    >
      {items.map((item, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${item.x}%`,
            top: `${item.y}%`,
            transform: `rotate(${item.rot}deg) scale(${item.scale})`,
          }}
        >
          {veggies[item.veggie]}
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const game = useGameRoom();

  const background = <VeggieBackground />;

  if (!game.room || !game.roomId) {
    return (
      <>
        {background}
        <LobbyPage game={game} />
      </>
    );
  }

  if (game.room.phase === 'results') {
    return (
      <>
        {background}
        <ResultsPage game={game} />
      </>
    );
  }

  if (game.room.phase === 'playing') {
    return (
      <>
        {background}
        <GamePage game={game} />
      </>
    );
  }

  return (
    <>
      {background}
      <LobbyPage game={game} />
    </>
  );
}
