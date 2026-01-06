import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [view, setView] = useState("home"); // "home" eller "quiz"

  const handleLogin = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  // --- START-VY (Skojig startsida) ---
  if (view === "home") {
    return (
      <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#FFD700', minHeight: '100vh', fontFamily: 'comic sans ms' }}>
        <h1>Välkommen till Timede.se! 🎈</h1>
        <p style={{ fontSize: '24px' }}>Här händer det grejer (snart)...</p>
        <div style={{ fontSize: '50px', margin: '20px' }}>🚗💨 🏎️ 🏁</div>
        <button 
          onClick={() => setView("quiz")}
          style={{ padding: '20px 40px', fontSize: '20px', cursor: 'pointer', borderRadius: '50px', border: 'none', backgroundColor: '#000', color: '#fff' }}
        >
          KLICKA HÄR FÖR CARQUIZ! 🚀
        </button>
      </div>
    );
  }

  // --- QUIZ-VY (Låst dörr) ---
  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px' }}>
        <h2>Hemligt område! 🕵️</h2>
        <input type="password" placeholder="Lösenord..." onChange={(e) => setPassword(e.target.value)} />
        <button onClick={handleLogin}>Öppna</button>
        <br/><br/>
        <button onClick={() => setView("home")}>Gå tillbaka</button>
      </div>
    );
  }

  // --- SJÄLVA QUIZEN ---
  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Carquiz är igång! 🏎️</h1>
      <p>Mekaniken fungerar och databasen är ansluten.</p>
    </div>
  );
}

export default App;
