import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  // --- TILLSTÅND (STATE) ---
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('loading'); // 'loading', 'playing', 'finished'
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  
  // --- 1. LÖSENORDS-HANTERING ---
  const handleAccess = () => {
    if (password === 'bil88') {
      setIsLocked(false);
    } else {
      alert("Fel lösenord!");
    }
  };

  // --- 2. HÄMTA DATA FRÅN SUPABASE ---
  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      // Hämta bilar (vi antar att du har kolumnerna 'name' och 'image')
      const { data, error } = await supabase.from('cars').select('*');
      
      if (error) {
        console.error("Fel vid hämtning:", error);
        return;
      }

      if (data && data.length > 0) {
        // Blanda och välj 10 bilar
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      } else {
        console.log("Inga bilar hittades i databasen.");
      }
    }
    fetchData();
  }, [isLocked]);

  // --- 3. SPEL-LOGIK ---
  const handleAnswer = (selectedName) => {
    const correctName = questions[currentQuestion].name;
    
    if (selectedName === correctName) {
      setScore(score + 1);
      alert("Rätt! 🎉");
    } else {
      alert(`Fel! Rätt svar var ${correctName}`);
    }

    // Gå till nästa fråga eller avsluta
    const nextQuestion = currentQuestion + 1;
    if (nextQuestion < questions.length) {
      setCurrentQuestion(nextQuestion);
    } else {
      setGameState('finished');
    }
  };

  const restartGame = () => {
    setScore(0);
    setCurrentQuestion(0);
    setGameState('loading');
    window.location.reload(); // Enkel omstart
  };

  // --- 4. VAD VISAS PÅ SKÄRMEN? (VYER) ---

  // A. LÅST LÄGE
  if (isLocked) {
    return (
      <div style={styles.container}>
        <h1>Timede.se 🔒</h1>
        <p>Ange lösenord för Carquiz:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAccess} style={styles.button}>Lås upp</button>
      </div>
    );
  }

  // B. LADDAR
  if (gameState === 'loading') {
    return <div style={styles.container}>Laddar bilar och värmer upp motorn... 🏎️</div>;
  }

  // C. SLUTSKÄRM
  if (gameState === 'finished') {
    return (
      <div style={styles.container}>
        <h1>Målgång! 🏁</h1>
        <p>Du fick {score} av {questions.length} rätt.</p>
        <button onClick={restartGame} style={styles.button}>Kör igen</button>
      </div>
    );
  }

  // D. SPELPLANEN (Här visas frågan)
  const currentCar = questions[currentQuestion];
  
  // Skapa svarsalternativ (Rätt svar + 3 felaktiga slumpade)
  // Obs: Detta är en förenklad version. För snyggare alternativ kan vi fixa det sen.
  const options = questions
    .map(q => q.name)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);
    
  // Se till att rätt svar finns med om det råkade försvinna i slumpen
  if (!options.includes(currentCar.name)) {
    options[0] = currentCar.name;
    options.sort(() => 0.5 - Math.random());
  }

  return (
    <div style={styles.container}>
      <h2>Vilken bil är detta? ({currentQuestion + 1}/{questions.length})</h2>
      
      {/* Bilden från Supabase */}
      <img 
        src={currentCar.image} // Se till att din kolumn heter 'image' eller 'image_url' i Supabase!
        alt="En hemlig bil" 
        style={{ maxWidth: '100%', borderRadius: '10px', margin: '20px 0', maxHeight: '300px' }}
      />

      <div style={{ display: 'grid', gap: '10px' }}>
        {options.map((option, index) => (
          <button 
            key={index} 
            onClick={() => handleAnswer(option)}
            style={styles.optionButton}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

// Enkel CSS inuti JS för att det ska se okej ut direkt
const styles = {
  container: { maxWidth: '600px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '20px' },
  input: { padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px' },
  button: { padding: '10px 20px', fontSize: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  optionButton: { padding: '15px', fontSize: '18px', backgroundColor: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }
};

export default App;
