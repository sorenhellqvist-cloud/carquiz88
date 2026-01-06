import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  // 1. Tillstånd (States) - endast en uppsättning variabler
  const [questions, setQuestions] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  // 2. Funktion för att låsa upp dörren
  const handleAccess = () => {
    if (password === 'bil88') { // Ändra till ditt önskade lösenord
      setIsLocked(false);
    } else {
      alert("Fel lösenord!");
    }
  };

  // 3. Hämta data (körs bara när sidan låsts upp)
  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      const { data, error } = await supabase.from('cars').select('*');
      if (error) {
        console.error("Fel:", error.message);
        return;
      }
      if (data) {
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      }
    }
    fetchData();
  }, [isLocked]);

  // --- Vyer (Här ritar vi ut sidan) ---

  // Vyn för lösenordet (visas först)
  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Timede.se/carquiz 🔒</h1>
        <p>Sidan är under konstruktion. Ange lösenord:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={handleAccess} style={{ marginLeft: '10px', padding: '10px 20px', cursor: 'pointer' }}>
          Lås upp
        </button>
      </div>
    );
  }

  // Vyn när man laddar bilar från databasen
  if (gameState === 'loading') {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Laddar frågor...</div>;
  }

  // Vyn för själva quizen (när allt är klart)
  return (
    <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Välkommen till Carquiz! 🏎️</h1>
      <p>Här kommer quizen att dyka upp nu när anslutningen fungerar.</p>
    </div>
  );
}

export default App; // Endast en export i slutet av filen
