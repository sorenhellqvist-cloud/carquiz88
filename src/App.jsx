import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  // 1. Tillstånd (State) - Vi har bara en av varje här
  const [questions, setQuestions] = useState([]);
  const [gameState, setGameState] = useState('loading');
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  // 2. Funktion för att låsa upp
  const handleAccess = () => {
    if (password === 'bil88') {
      setIsLocked(false);
    } else {
      alert("Fel lösenord! Försök igen.");
    }
  };

  // 3. Hämta bilar från databasen (körs bara när man låst upp)
  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      const { data, error } = await supabase.from('cars').select('*');
      
      if (error) {
        console.error("Kunde inte hämta bilar:", error.message);
        return;
      }

      if (data && data.length > 0) {
        // Slumpa 10 bilar till quizen
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      }
    }
    fetchData();
  }, [isLocked]);

  // --- Vyer (Vad som visas på skärmen) ---

  // Låst läge (Dörrvakten)
  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1 style={{ color: '#333' }}>Timede.se 🛠️</h1>
        <p>Sidan är under konstruktion. Ange lösenord för carquiz:</p>
        <div style={{ marginTop: '20px' }}>
          <input 
            type="password" 
            placeholder="Lösenord..."
            value={password} 
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd', width: '200px' }}
          />
          <button 
            onClick={handleAccess}
            style={{ padding: '12px 24px', marginLeft: '10px', borderRadius: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Lås upp
          </button>
        </div>
      </div>
    );
  }

  // Laddningsläge (när man precis låst upp)
  if (gameState === 'loading') {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Laddar bilar från databasen...</div>;
  }

  // Själva Quizen (visas när man låst upp och data har hämtats)
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '2px solid #eee', marginBottom: '20px' }}>
        <h1>Välkommen till Carquiz! 🏎️</h1>
        <p>Antal frågor laddade: {questions.length}</p>
      </header>
      
      <main>
        <p>Här kommer dina bilfrågor att dyka upp...</p>
        {/* Här kan du senare lägga in din komponent för frågorna */}
      </main>
    </div>
  );
}

export default App;
