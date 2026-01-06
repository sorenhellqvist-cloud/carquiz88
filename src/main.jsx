import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient'; // Kontrollera att filnamnet stämmer

function App() {
  const [questions, setQuestions] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  // 1. Lösenordskontroll
  const handleAccess = () => {
    if (password === 'bil88') { // Ändra 'bil88' till ditt valda lösenord
      setIsLocked(false);
    } else {
      alert("Fel lösenord!");
    }
  };

  // 2. Hämta data från Supabase
  useEffect(() => {
    if (isLocked) return; // Hämta ingen data förrän man låst upp

    async function fetchData() {
      console.log("Försöker hämta bilar...");
      const { data, error } = await supabase.from('cars').select('*');
      
      if (error) {
        console.error("Supabase-fel:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      }
    }
    fetchData();
  }, [isLocked]);

  // Vy för låst sida
  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Timede.se är under konstruktion 🛠️</h1>
        <p>Ange lösenord för att se Carquiz:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={handleAccess} style={{ marginLeft: '10px', padding: '10px 20px' }}>
          Lås upp
        </button>
      </div>
    );
  }

  // Vy när man laddar bilar
  if (gameState === 'loading') {
    return <div>Laddar bilar...</div>;
  }

  // Här kommer din quiz-logik (det som visas när man spelar)
  return (
    <div className="App">
      <h1>Välkommen till Carquiz!</h1>
      {/* Resten av din spel-kod här */}
    </div>
  );
}

export default App;
