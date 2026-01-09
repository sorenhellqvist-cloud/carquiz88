import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  
  // Timer states
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  const handleAccess = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('failed'); // Tiden ute = Game Over
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

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

        const shuffled = formattedData.sort(() => 0.5 - Math.random()).slice(0, 25);
        setQuestions(shuffled);
        setGameState('playing');
        setTimerActive(true);
      }
    }
    fetchData();
  }, [isLocked]);

  const handleAnswer = (selectedMake) => {
    const currentCar = questions[currentQuestion];
    const isCorrect = selectedMake === currentCar.make;
    const fullName = `${currentCar.year} ${currentCar.make} ${currentCar.model}`;

    if (isCorrect) {
      setScore(score + 1);
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      
      if (newMistakes >= 2) {
        setTimerActive(false);
        setGameState('failed');
        return;
      }
    }

    setFeedback({
      isCorrect: isCorrect,
      message: isCorrect ? "SNYGGT JOBBAT!" : "TYVÄRR FEL!",
      details: `Det var en ${fullName}`
    });
  };

  const handleNext = () => {
    setFeedback(null);
    const nextQ = currentQuestion + 1;
    if (nextQ < questions.length) {
      setCurrentQuestion(nextQ);
    } else {
      setTimerActive(false);
      setGameState('finished');
    }
  };

  const calculateTotalScore = () => {
    return (score * 100) + (timeLeft * 10);
  };

  const restartGame = () => {
    window.location.reload(); 
  };

  const Wrapper = ({ children }) => (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        {children}
      </div>
    </div>
  );

  if (isLocked) {
    return (
      <Wrapper>
        <h1 style={{fontSize: '2rem', marginBottom: '20px'}}>Timede.se 🔒</h1>
        <input 
          type="password" 
          placeholder="Lösenord"
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={styles.input} 
        />
        <button onClick={handleAccess} style={styles.primaryButton}>STARTA MOTORN</button>
      </Wrapper>
    );
  }

  if (gameState === 'loading') return <Wrapper><h3>Hämtar bilar... 🏎️</h3></Wrapper>;

  if (gameState === 'failed') {
    return (
      <Wrapper>
        <h1 style={{color: '#ef4444'}}>GAME OVER! 💥</h1>
        <p style={{fontSize: '1.2rem', marginBottom: '20px'}}>
            {timeLeft === 0 ? "Bensinen tog slut!" : "För många felaktiga svar."}
        </p>
        <button onClick={restartGame} style={styles.primaryButton}>FÖRSÖK IGEN</button>
      </Wrapper>
    );
  }

  if (gameState === 'finished') {
    return (
      <Wrapper>
        <h1 style={{color: '#22c55e'}}>MÅLGÅNG! 🏁</h1>
        <div style={styles.resultCard}>
          <p>Rätt svar: <strong>{score}/25</strong></p>
          <p>Tidsbonus: <strong>{timeLeft * 10}</strong></p>
          <hr style={{opacity: 0.2}}/>
          <h2>TOTALT: {calculateTotalScore()}</h2>
        </div>
        <button onClick={restartGame} style={styles.primaryButton}>KÖR IGEN</button>
      </Wrapper>
    );
  }

  const currentCar = questions[currentQuestion];
  if (!currentCar) return null;

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
    <Wrapper>
      {/* Dashboard Section */}
      <div style={styles.dashboard}>
        {/* Fuel Gauge */}
        <div style={styles.gaugeWrapper}>
          <div style={styles.gaugeLabel}>FUEL</div>
          <div style={styles.gaugeContainer}>
            <div 
              style={{
                ...styles.gaugeFill, 
                width: `${(timeLeft / 250) * 100}%`,
                backgroundColor: timeLeft < 60 ? '#ef4444' : '#fbbf24'
              }} 
            />
          </div>
          <div style={styles.gaugeMarkers}>
            <span>E</span>
            <span>1/2</span>
            <span>F</span>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={styles.statusRow}>
            <div style={styles.statusBox}>
                <div style={{fontSize: '10px'}}>CHECK ENGINE</div>
                <div style={{display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '4px'}}>
                    <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ef4444' : '#374151', boxShadow: mistakes >= 1 ? '0 0 8px #ef4444' : 'none'}}></div>
                    <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ef4444' : '#374151', boxShadow: mistakes >= 2 ? '0 0 8px #ef4444' : 'none'}}></div>
                </div>
            </div>
            <div style={styles.statusBox}>
                <div style={{fontSize: '10px'}}>PROGRESS</div>
                <div style={{fontSize: '16px', fontWeight: 'bold'}}>{currentQuestion + 1}/25</div>
            </div>
        </div>
      </div>

      <div style={styles.imageContainer}>
        <img key={currentCar.file_name} src={currentCar.imageUrl} alt="Bil" style={styles.carImage} />
      </div>

      {!feedback ? (
        <div style={styles.grid}>
          {options.map((make, index) => (
            <button key={index} onClick={() => handleAnswer(make)} style={styles.optionButton}>{make}</button>
          ))}
        </div>
      ) : (
        <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2', borderColor: feedback.isCorrect ? '#22c55e' : '#ef4444'}}>
          <h2 style={{margin: '0 0 10px 0'}}>{feedback.message}</h2>
          <p style={{margin: '0 0 20px 0'}}>{feedback.details}</p>
          <button onClick={handleNext} style={styles.primaryButton}>NÄSTA &rarr;</button>
        </div>
      )}
    </Wrapper>
  );
}

const styles = {
  appWrapper: { 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#111827', // Mörkare bakgrund för instrumentpanel-känsla
    padding: '10px' 
  },
  container: { 
    width: '100%', 
    maxWidth: '420px', 
    textAlign: 'center', 
    fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#f9fafb'
  },
  dashboard: {
    backgroundColor: '#1f2937',
    padding: '15px',
    borderRadius: '16px',
    marginBottom: '20px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
    border: '1px solid #374151'
  },
  gaugeWrapper: { marginBottom: '15px' },
  gaugeLabel: { fontSize: '10px', fontWeight: 'bold', textAlign: 'left', marginBottom: '4px', color: '#9ca3af' },
  gaugeContainer: { 
    height: '14px', 
    backgroundColor: '#000', 
    borderRadius: '10px', 
    overflow: 'hidden', 
    border: '1px solid #4b5563' 
  },
  gaugeFill: { 
    height: '100%', 
    transition: 'width 1s linear, background-color 0.5s ease' 
  },
  gaugeMarkers: { display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: '#6b7280', fontWeight: 'bold' },
  statusRow: { display: 'flex', justifyContent: 'space-between', gap: '10px' },
  statusBox: { 
    flex: 1, 
    backgroundColor: '#111827', 
    padding: '8px', 
    borderRadius: '8px', 
    border: '1px solid #374151' 
  },
  engineLight: { width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #000' },
  imageContainer: { 
    aspectRatio: '4/3', 
    overflow: 'hidden', 
    borderRadius: '12px', 
    marginBottom: '20px', 
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    backgroundColor: '#374151'
  },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  optionButton: { 
    padding: '18px 5px', 
    borderRadius: '12px', 
    border: 'none', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    backgroundColor: '#374151',
    color: 'white',
    boxShadow: '0 4px 0 #1f2937'
  },
  primaryButton: { 
    padding: '15px', 
    backgroundColor: '#2563eb', 
    color: 'white', 
    border: 'none', 
    borderRadius: '12px', 
    width: '100%', 
    fontWeight: 'bold', 
    cursor: 'pointer',
    boxShadow: '0 4px 0 #1d4ed8'
  },
  input: { padding: '15px', width: '100%', marginBottom: '15px', borderRadius: '8px', border: 'none', boxSizing: 'border-box', fontSize: '16px' },
  feedbackCard: { padding: '20px', borderRadius: '12px', border: '2px solid', color: '#111827' },
  resultCard: { backgroundColor: '#1f2937', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #374151' }
};

export default App;
