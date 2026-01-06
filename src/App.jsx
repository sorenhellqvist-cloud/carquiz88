import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
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

  // --- 2. HÄMTA OCH FIXA DATA ---
  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      // Hämta dina specifika kolumner
      const { data, error } = await supabase
        .from('cars')
        .select('year, make, model, file_name');
      
      if (error) {
        console.error("Fel vid hämtning:", error);
        return;
      }

      if (data && data.length > 0) {
        // Här skapar vi "färdiga" frågor genom att snygga till datan direkt
        const formattedData = data.map(car => {
          // 1. Skapa hela namnet (t.ex. "Volvo 740")
          const fullName = `${car.make} ${car.model}`;
          
          // 2. Skapa bildlänken automatiskt från din 'Cars88'-bucket
          // VIKTIGT: Om din bucket heter något annat än 'Cars88', ändra här!
          const imageUrl = supabase.storage
            .from('Cars88') 
            .getPublicUrl(car.file_name).data.publicUrl;

          return {
            ...car,
            displayName: fullName,
            imageUrl: imageUrl
          };
        });

        // Blanda och välj 10 bilar
        const shuffled = formattedData.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      } else {
        console.log("Inga bilar hittades.");
      }
    }
    fetchData();
  }, [isLocked]);

  // --- 3. SPEL-LOGIK ---
  const handleAnswer = (selectedName) => {
    const currentCar = questions[currentQuestion];
    const correctName = currentCar.displayName; // Använder det ihopslagna namnet
    
    if (selectedName === correctName) {
      setScore(score + 1);
      alert(`Rätt! Det var en ${correctName} (${currentCar.year}) 🎉`);
    } else {
      alert(`Fel! Rätt svar var ${correctName}`);
    }

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
    window.location.reload(); 
  };

  // --- 4. VYER ---

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

  if (gameState === 'loading') {
    return <div style={styles.container}>Hämtar bilar från garaget... 🏎️</div>;
  }

  if (gameState === 'finished') {
    return (
      <div style={styles.container}>
        <h1>Målgång! 🏁</h1>
        <p>Du fick {score} av {questions.length} rätt.</p>
        <button onClick={restartGame} style={styles.button}>Kör igen</button>
      </div>
    );
  }

  // --- SPELPLANEN ---
  const currentCar = questions[currentQuestion];
  
  // Skapa svarsalternativ baserat på 'displayName' (Märke + Modell)
  const options = questions
    .map(q => q.displayName)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);
    
  if (!options.includes(currentCar.displayName)) {
    options[0] = currentCar.displayName;
    options.sort(() => 0.5 - Math.random());
  }

  return (
    <div style={styles.container}>
      <h2>Vilken bil är detta? ({currentQuestion + 1}/{questions.length})</h2>
      
      {/* Här visas bilden med den länk vi skapade ovan */}
      <img 
        src={currentCar.imageUrl} 
        alt="En hemlig bil" 
        style={{ maxWidth: '100%', borderRadius: '10px', margin: '20px 0', maxHeight: '300px', objectFit: 'cover' }}
        onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Ingen+Bild'; }} 
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

const styles = {
  container: { maxWidth: '600px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial, sans-serif', padding: '20px' },
  input: { padding: '10px', fontSize: '16px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px' },
  button: { padding: '10px 20px', fontSize: '16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  optionButton: { padding: '15px', fontSize: '18px', backgroundColor: '#f3f4f6', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }
};

export default App;
