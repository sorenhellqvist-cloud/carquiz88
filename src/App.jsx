import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  
  // NYTT: State för att hantera feedback (istället för alert)
  // null = spelaren funderar, objekt = spelaren har svarat
  const [feedback, setFeedback] = useState(null); 

  const handleAccess = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  useEffect(() => {
    if (isLocked) return;

    async function fetchData() {
      const { data, error } = await supabase
        .from('cars')
        .select('year, make, model, file_name');
      
      if (error) {
        console.error("Fel vid hämtning:", error);
        return;
      }

      if (data && data.length > 0) {
        const formattedData = data.map(car => ({
          ...car,
          imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
        }));

        const shuffled = formattedData.sort(() => 0.5 - Math.random()).slice(0, 10);
        setQuestions(shuffled);
        setGameState('playing');
      }
    }
    fetchData();
  }, [isLocked]);

  // --- NY LOGIK: Svara på frågan ---
  const handleAnswer = (selectedMake) => {
    const currentCar = questions[currentQuestion];
    const isCorrect = selectedMake === currentCar.make;
    const fullName = `${currentCar.year} ${currentCar.make} ${currentCar.model}`;

    if (isCorrect) setScore(score + 1);

    // Istället för alert, sätter vi feedback-state
    setFeedback({
      isCorrect: isCorrect,
      message: isCorrect ? "Snyggt jobbat!" : "Tyvärr fel!",
      details: `Det var en ${fullName}`
    });
  };

  // --- NY LOGIK: Gå till nästa fråga ---
  const handleNext = () => {
    setFeedback(null); // Rensa feedback
    const nextQ = currentQuestion + 1;
    if (nextQ < questions.length) {
      setCurrentQuestion(nextQ);
    } else {
      setGameState('finished');
    }
  };

  const restartGame = () => {
    setScore(0);
    setCurrentQuestion(0);
    setGameState('loading');
    setFeedback(null);
    window.location.reload(); 
  };

  // --- VYER ---

  // 1. LÅSSKÄRM
  if (isLocked) {
    return (
      <div style={styles.container}>
        <h1>Timede.se 🔒</h1>
        <input 
          type="password" 
          placeholder="Lösenord"
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleAccess} style={styles.primaryButton}>Lås upp</button>
      </div>
    );
  }

  // 2. LADDAR
  if (gameState === 'loading') {
    return <div style={styles.container}><h3>Startar motorerna... 🏎️</h3></div>;
  }

  // 3. MÅLGÅNG
  if (gameState === 'finished') {
    return (
      <div style={styles.container}>
        <h1>Målgång! 🏁</h1>
        <p style={{fontSize: '1.2rem'}}>Du fick <strong>{score}</strong> av <strong>{questions.length}</strong> rätt.</p>
        <button onClick={restartGame} style={styles.primaryButton}>Kör igen</button>
      </div>
    );
  }

  // 4. SPELPLANEN
  const currentCar = questions[currentQuestion];
  
  // Ta fram svarsalternativ (körs bara om vi INTE visar feedback)
  let options = [];
  if (!feedback) {
    const allUniqueMakes = [...new Set(questions.map(q => q.make))];
    const wrongOptions = allUniqueMakes
      .filter(make => make !== currentCar.make)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    options = [currentCar.make, ...wrongOptions].sort(() => 0.5 - Math.random());
  }

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* Status bar */}
        <div style={styles.statusBar}>
          <span>Fråga {currentQuestion + 1} / {questions.length}</span>
          <span>Poäng: {score}</span>
        </div>

        {/* Bild-container */}
        <div style={styles.imageContainer}>
          <img 
            src={currentCar.imageUrl} 
            alt="Hemlig bil" 
            style={styles.carImage}
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = 'https://placehold.co/600x400?text=Bild+saknas'; 
            }} 
          />
        </div>

        {/* UI: Antingen Knappar ELLER Resultat */}
        {!feedback ? (
          <div style={styles.grid}>
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
        ) : (
          <div style={{
            ...styles.feedbackCard, 
            backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2',
            borderColor: feedback.isCorrect ? '#22c55e' : '#ef4444'
          }}>
            <h2 style={{color: feedback.isCorrect ? '#166534' : '#991b1b', margin: '0 0 10px 0'}}>
              {feedback.message}
            </h2>
            <p style={{fontSize: '1.1rem', margin: '0 0 20px 0'}}>
              {feedback.details}
            </p>
            <button onClick={handleNext} style={styles.primaryButton}>
              Nästa fråga &rarr;
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// --- MOBILANPASSAD CSS (JavaScript Styles) ---
const styles = {
  appWrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    padding: '20px',
    boxSizing: 'border-box',
  },
  container: { 
    width: '100%',
    maxWidth: '400px', // Mobilbredd som max
    textAlign: 'center', 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  statusBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 10px 10px 10px',
    fontSize: '0.9rem',
    color: '#6b7280',
    fontWeight: '600'
  },
  imageContainer: {
    marginBottom: '20px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    backgroundColor: '#e5e7eb',
    aspectRatio: '4 / 3', // Håller bilden snygg i porträtt
  },
  carImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: '1fr 1fr', // Två kolumner
    gap: '12px' 
  },
  optionButton: { 
    padding: '20px 10px', // Stora tryckytor
    fontSize: '16px', 
    fontWeight: 'bold',
    backgroundColor: 'white', 
    border: '2px solid #e5e7eb', 
    borderRadius: '12px', 
    cursor: 'pointer', 
    color: '#374151',
    boxShadow: '0 2px 0 rgba(0,0,0,0.05)',
    touchAction: 'manipulation', // Förhindrar zoom vid dubbelklick på mobil
  },
  primaryButton: { 
    width: '100%',
    padding: '15px', 
    fontSize: '18px', 
    backgroundColor: '#2563eb', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    cursor: 'pointer',
    fontWeight: 'bold',
    boxShadow: '0 4px 0 #1d4ed8',
    marginTop: '10px'
  },
  input: { 
    padding: '15px', 
    fontSize: '16px', 
    borderRadius: '8px', 
    border: '1px solid #ccc', 
    width: '100%', 
    marginBottom: '15px',
    boxSizing: 'border-box'
  },
  feedbackCard: {
    padding: '20px',
    borderRadius: '12px',
    borderWidth: '2px',
    borderStyle: 'solid',
    animation: 'fadeIn 0.3s ease'
  }
};

export default App;
