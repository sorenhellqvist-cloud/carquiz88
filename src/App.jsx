import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [questions, setQuestions] = useState([]);

  const handleAccess = () => {
    if (password === 'bil88') { // Ditt lösenord
      setIsLocked(false);
    } else {
      alert("Fel lösenord!");
    }
  };

  useEffect(() => {
    if (isLocked) return;
    async function fetchData() {
      // Hämtar från tabellen 'cars' som du har gett läsrättigheter till
      const { data } = await supabase.from('cars').select('*');
      if (data) setQuestions(data.sort(() => 0.5 - Math.random()).slice(0, 10));
    }
    fetchData();
  }, [isLocked]);

  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Timede.se 🔒</h1>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Lösenord..." />
        <button onClick={handleAccess}>Lås upp</button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Välkommen till Carquiz! 🏎️</h1>
      <p>Här visas nu din quiz istället för en vit skärm.</p>
    </div>
  );
}

export default App;
