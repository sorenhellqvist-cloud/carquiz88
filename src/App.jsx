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

  // --- 2. HÄMTA DATA ---
  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      // Vi hämtar 50 bilar (om det finns) för att få bra spridning på märkena
      const { data, error } = await supabase
        .from('cars')
        .select('year, make, model, file_name');
      
      if (error) {
        console.error("Fel vid hämtning:", error);
        return;
      }

      if (data && data.length > 0) {
        const formattedData = data.map(car => {
          // Bygg bildlänken automatiskt
          const imageUrl = supabase.storage
            .from('Cars88') 
            .getPublicUrl(car.file_name).data.publicUrl;

          return {
            ...car,
            imageUrl: imageUrl
          };
        });

        // Blanda och välj ut 10 frågor för denna spelomgång
        const shuffled = formattedData.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      } else {
        console.log("Inga bilar hittades.");
      }
    }
    fetchData();
  }, [isLocked]);

  // --- 3. SPEL-LOGIK (Nivå 1: Bara Märke) ---
  const handleAnswer = (selectedMake) => {
    const currentCar = questions[currentQuestion];
    
    // Vi jämför bara MÄRKET (make)
    if (selectedMake === currentCar.make) {
      setScore(score + 1);
      // Men vi berättar hela namnet i berömmet!
      alert(`Rätt! Det var en ${currentCar.make} ${currentCar.model} (${currentCar.year}) 🎉`);
    } else {
      alert(`Fel! Det var en ${currentCar.make} ${currentCar.model}`);
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

  // --- SPELPLANEN (Nu med smarta knappar) ---
  const currentCar = questions[currentQuestion];
  
  // 1. Hämta alla unika märken från de 10 frågor vi laddat ner
  // (Set tar bort dubbletter automatiskt så vi inte får två knappar med "Volvo")
  const allUniqueMakes = [...new Set(questions.map(q => q.make))];

  // 2. Ta bort det rätta svaret från listan av felaktiga alternativ
  const wrongOptions = allUniqueMakes
    .filter(make => make !== currentCar.make)
    .sort(() => 0.5 - Math.random())
    .slice(0, 3); // Ta max 3 felaktiga

  // 3. Lägg ihop: [Rätt svar] + [Upp till 3 felaktiga]
  const options = [currentCar.make, ...wrongOptions].sort(() => 0.5 - Math.random());

  return (
    <div style={styles.container}>
      <h2>Vilket märke är bilen? ({currentQuestion + 1}/{questions.length})</h2>
      
      <img 
        src={currentCar.imageUrl} 
        alt="En hemlig bil" 
        style={{ maxWidth: '100%', borderRadius: '10px', margin: '20px 0', maxHeight: '300px', objectFit: 'cover' }}
        onError={(e) => { 
          console.error("Bildfel på:", currentCar.file_name);
          e.target.src = 'https://via.placeholder.com/300x200?text=Bild+Saknas'; 
        }} 
      />

      <div style={{ display: 'grid', gap: '10px' }}>
        {options.map((make, index) => (
          <button 
            key={index} 
            onClick={() => handleAnswer(make)}
            style={styles.optionButton}
          >
            {make}
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
