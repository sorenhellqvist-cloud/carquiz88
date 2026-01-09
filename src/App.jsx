import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [options, setOptions] = useState([]); 
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  const [failReason, setFailReason] = useState(""); // Förklarar varför man förlorade
  
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  const handleAccess = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  // Timer-logik
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setFailReason("BENSINSTOPP! Tiden rann ut.");
      setGameState('failed');
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

  // Hämta data
  useEffect(() => {
    if (isLocked) return;
    async function fetchData() {
      const { data, error } = await supabase.from('cars').select('year, make, model, file_name');
      if (error) return;
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

  // Generera knappar
  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && !feedback) {
      const currentCar = questions[currentQuestion];
      const allMakes = [...new Set(questions.map(q => q.make))];
      const wrongOptions = allMakes
        .filter(make => make !== currentCar.make)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setOptions([currentCar.make, ...wrongOptions].sort(() => 0.5 - Math.random()));
    }
  }, [currentQuestion, questions, gameState, feedback]);

  const handleAnswer = (selectedMake) => {
    if (feedback) return; 
    const currentCar = questions[currentQuestion];
    const isCorrect = selectedMake === currentCar.make;

    if (isCorrect) {
      setScore(score + 1);
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 2) {
        setFailReason("MOTORRAS! För många felaktiga gissningar.");
        setTimerActive(false);
        setGameState('failed');
        return;
      }
    }
    setFeedback({
      isCorrect,
      message: isCorrect ? "SNYGGT JOBBAT!" : "TYVÄRR FEL!",
      details: `Det var en ${currentCar.year} ${currentCar.make} ${currentCar.model}`
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      setGameState('finished');
    }
  };

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{fontSize: '2.5rem', letterSpacing: '2px'}}>TIMEDE.SE</h1>
          <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={handleAccess} style={styles.primaryButton}>STARTA MOTORN</button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') return <div style={styles.appWrapper}><h3>Värmer upp...</h3></div>;

  if (gameState === 'failed' || gameState === 'finished') {
    const win = gameState === 'finished';
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: win ? '#22c55e' : '#ef4444'}}>{win ? 'MÅLGÅNG!' : 'GAME OVER!'}</h1>
          <div style={styles.resultCard}>
            {!win && <p style={{color: '#f87171', fontWeight: 'bold', fontSize: '1.1rem'}}>{failReason}</p>}
            <p>Rätt svar: {score}/25</p>
            {win && <p>Tidsbonus: {timeLeft * 10}</p>}
            <h2>TOTALT: {win ? (score * 100 + timeLeft * 10) : (score * 100)}</h2>
          </div>
          <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* RETRO GAUGE */}
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeBackground}>
            {/* Nålen - nu med högre z-index och klar färg */}
            <div style={{ 
              ...styles.gaugeNeedle, 
              transform: `translateX(-50%) rotate(${(timeLeft / 250) * 180 - 90}deg)` 
            }} />
            <div style={styles.needleCap} />
            <div style={styles.labelE}>E</div>
            <div style={styles.labelF}>F</div>
            <div style={styles.fuelText}>FUEL</div>
          </div>
        </div>

        {/* STATUS */}
        <div style={styles.statusRow}>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px'}}>CHECK ENGINE</div>
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '5px'}}>
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ef4444' : '#374151', boxShadow: mistakes >= 1 ? '0 0 10px #ef4444' : 'none'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ef4444' : '#374151', boxShadow: mistakes >= 2 ? '0 0 10px #ef4444' : 'none'}} />
            </div>
          </div>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px'}}>PROGRESS</div>
            <div style={{fontSize: '18px', fontWeight: 'bold'}}>{currentQuestion + 1}/25</div>
          </div>
        </div>

        {/* BILD */}
        <div style={styles.imageContainer}>
          <img key={questions[currentQuestion]?.file_name} src={questions[currentQuestion]?.imageUrl} alt="Car" style={styles.carImage} />
        </div>

        {/* KNAPPAR / FEEDBACK */}
        {!feedback ? (
          <div style={styles.grid}>
            {options.map((make, index) => (
              <button key={index} onClick={() => handleAnswer(make)} style={styles.optionButton}>{make}</button>
            ))}
          </div>
        ) : (
          <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2', borderColor: feedback.isCorrect ? '#22c55e' : '#ef4444'}}>
            <h2 style={{margin: '0 0 5px 0', color: '#111827'}}>{feedback.message}</h2>
            <p style={{margin: '0 0 15px 0', color: '#374151'}}>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA FRÅGA</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '15px', color: '#f9fafb', fontFamily: 'monospace' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  retroGaugeContainer: { display: 'flex', justifyContent: 'center', height: '120px', position: 'relative', overflow: 'visible', marginBottom: '10px' },
  gaugeBackground: { 
    width: '200px', height: '200px', border: '8px solid #334155', borderRadius: '50%', 
    position: 'absolute', top: '0', backgroundColor: '#000', boxShadow: 'inset 0 0 20px #000' 
  },
  gaugeNeedle: { 
    position: 'absolute', bottom: '50%', left: '50%', width: '4px', height: '85px', 
    backgroundColor: '#ff4757', transformOrigin: 'bottom center', zIndex: '10', 
    borderRadius: '4px', transition: 'transform 0.5s ease-out' 
  },
  needleCap: { 
    position: 'absolute', top: '46%', left: '46.5%', width: '16px', height: '16px', 
    backgroundColor: '#94a3b8', borderRadius: '50%', zIndex: '11', border: '2px solid #000' 
  },
  labelE: { position: 'absolute', bottom: '25%', left: '15%', color: '#ef4444', fontWeight: 'bold', fontSize: '18px' },
  labelF: { position: 'absolute', bottom: '25%', right: '15%', color: '#22c55e', fontWeight: 'bold', fontSize: '18px' },
  fuelText: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', color: '#475569', letterSpacing: '4px' },
  statusRow: { display: 'flex', gap: '10px', marginBottom: '15px' },
  statusBox: { flex: 1, backgroundColor: '#1e293b', padding: '10px', borderRadius: '12px', border: '1px solid #334155' },
  engineLight: { width: '15px', height: '15px', borderRadius: '50%', border: '2px solid #000' },
  imageContainer: { width: '100%', aspectRatio: '4/3', borderRadius: '15px', overflow: 'hidden', border: '4px solid #1e293b', marginBottom: '15px' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  optionButton: { padding: '15px 5px', borderRadius: '10px', border: 'none', backgroundColor: '#334155', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  input: { width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '10px', border: 'none' },
  feedbackCard: { padding: '15px', borderRadius: '15px', border: '3px solid' },
  resultCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px' }
};

export default App;
