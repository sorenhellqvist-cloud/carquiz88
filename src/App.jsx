// Version: 1.2 - Classic Instruments Gauge & Level Transition Logic
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [options, setOptions] = useState([]); 
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, interstitial, finished, failed
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  const [failReason, setFailReason] = useState("");
  
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  // Hantering av lösenord
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
      setFailReason("BENSINSTOPP!");
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

  // Generera svarsalternativ
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

    if (isCorrect) setScore(score + 1);
    else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 2) {
        setFailReason("MOTORRAS!");
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
      // Gå till pausskärmen istället för direkt till 'finished'
      setGameState('interstitial');
    }
  };

  const startNextLevel = () => {
    // Här laddar vi senare in nivå 2 frågor
    alert("Nivå 2 laddas nu...");
    window.location.reload(); 
  };

  // --- RENDERING ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{fontSize: '2.5rem', marginBottom: '10px'}}>TIMEDE.SE</h1>
          <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={handleAccess} style={styles.primaryButton}>STARTA MOTORN</button>
        </div>
      </div>
    );
  }

  // PAUSSKÄRM / ANNONSPLATS (Interstitial)
  if (gameState === 'interstitial') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: '#22c55e'}}>BRA JOBBAT! 🏆</h1>
          <div style={styles.resultCard}>
            <p style={{fontSize: '1.2rem'}}>Du har klarat Nivå 1!</p>
            <p>Din poäng: <strong>{score * 100 + timeLeft * 10}</strong></p>
            <p style={{marginTop: '10px', color: '#fbbf24'}}>Du ligger på <strong>1:a plats</strong> av alla spelare denna vecka!</p>
          </div>
          
          {/* GOOGLE ADS PLACEHOLDER */}
          <div style={styles.adSpace}>
            <p style={{fontSize: '10px', color: '#475569'}}>ANNONS FRÅN GOOGLE</p>
            <div style={styles.adContent}>
              {/* Här klistras AdSense koden in senare */}
              <p>Här visas din annons...</p>
            </div>
          </div>

          <p style={{fontSize: '14px', marginBottom: '15px'}}>Nivå 2 startar efter annonsen</p>
          <button onClick={startNextLevel} style={styles.primaryButton}>GÅ VIDARE</button>
        </div>
      </div>
    );
  }

  if (gameState === 'failed') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: '#ef4444'}}>GAME OVER! 💥</h1>
          <div style={styles.resultCard}>
            <p style={{color: '#f87171', fontWeight: 'bold'}}>{failReason}</p>
            <p>Du nådde fråga {currentQuestion + 1} av 25.</p>
          </div>
          <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
        </div>
      </div>
    );
  }

  const currentCar = questions[currentQuestion];

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* RETRO GAUGE (Inspirerad av din bild) */}
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeChromeRing}>
            <div style={styles.gaugeBackground}>
              <div style={styles.gaugeGridLines} />
              <div style={{ ...styles.gaugeNeedle, transform: `translateX(-50%) rotate(${(timeLeft / 250) * 140 - 70}deg)` }} />
              <div style={styles.needleCap} />
              <div style={styles.labelE}>E</div>
              <div style={styles.labelHalf}>1/2</div>
              <div style={styles.labelF}>F</div>
              <div style={styles.fuelText}>FUEL</div>
            </div>
          </div>
        </div>

        <div style={styles.imageContainer}>
          <img key={currentCar?.file_name} src={currentCar?.imageUrl} alt="Car" style={styles.carImage} />
        </div>

        {!feedback ? (
          <div style={styles.grid}>
            {options.map((make, index) => (
              <button key={index} onClick={() => handleAnswer(make)} style={styles.boneButton}>{make}</button>
            ))}
          </div>
        ) : (
          <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2'}}>
            <h2 style={{margin: '0 0 5px 0', color: '#111827'}}>{feedback.message}</h2>
            <p style={{margin: '0 0 15px 0', color: '#374151'}}>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA FRÅGA</button>
          </div>
        )}

        <div style={styles.statusRowBottom}>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>CHECK ENGINE</div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '5px'}}>
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ff0000' : '#1e293b', boxShadow: mistakes >= 1 ? '0 0 12px #ff0000' : 'none'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ff0000' : '#1e293b', boxShadow: mistakes >= 2 ? '0 0 12px #ff0000' : 'none'}} />
            </div>
          </div>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>PROGRESS</div>
            <div style={{fontSize: '20px', fontWeight: 'bold'}}>{currentQuestion + 1} / 25</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', padding: '15px', color: '#f8fafc', fontFamily: 'serif' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  
  // Uppdaterad mätare baserat på din bild
  retroGaugeContainer: { display: 'flex', justifyContent: 'center', height: '140px', position: 'relative', marginBottom: '20px' },
  gaugeChromeRing: {
    width: '210px', height: '210px', borderRadius: '50%',
    background: 'linear-gradient(145deg, #94a3b8, #f8fafc, #475569, #94a3b8)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
    position: 'absolute', top: '-100px'
  },
  gaugeBackground: { 
    width: '190px', height: '190px', borderRadius: '50%', 
    backgroundColor: '#ecece4', position: 'relative', overflow: 'hidden',
    border: '2px solid #334155'
  },
  gaugeGridLines: {
    position: 'absolute', top: '15%', left: '15%', right: '15%', bottom: '50%',
    border: '2px solid #334155', borderBottom: 'none', borderRadius: '80px 80px 0 0',
    opacity: 0.3
  },
  gaugeNeedle: { 
    position: 'absolute', bottom: '50%', left: '50%', width: '4px', height: '75px', 
    backgroundColor: '#b91c1c', transformOrigin: 'bottom center', zIndex: '10', 
    transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    borderRadius: '4px 4px 0 0'
  },
  needleCap: { position: 'absolute', top: '46%', left: '46%', width: '18px', height: '18px', backgroundColor: '#b91c1c', borderRadius: '50%', zIndex: '11', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' },
  labelE: { position: 'absolute', bottom: '28%', left: '18%', color: '#000', fontWeight: '900', fontSize: '18px', transform: 'rotate(-45deg)' },
  labelHalf: { position: 'absolute', top: '20%', left: '42%', color: '#000', fontWeight: '900', fontSize: '16px' },
  labelF: { position: 'absolute', bottom: '28%', right: '18%', color: '#000', fontWeight: '900', fontSize: '18px', transform: 'rotate(45deg)' },
  fuelText: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: '16px', color: '#000', fontWeight: '900', letterSpacing: '2px' },

  // Benvita knappar
  boneButton: { 
    padding: '18px 5px', borderRadius: '10px', border: '1px solid #d1d5db',
    backgroundColor: '#f5f5f0', color: '#1f2937', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: '0 5px 0 #d6d3d1', marginBottom: '5px'
  },

  // Annonsplats
  adSpace: { backgroundColor: '#1e293b', borderRadius: '12px', padding: '10px', margin: '20px 0', border: '1px dashed #475569' },
  adContent: { height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', backgroundColor: '#0f172a', borderRadius: '8px' },

  statusRowBottom: { display: 'flex', gap: '15px', marginTop: '25px' },
  statusBox: { flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px', border: '2px solid #1e293b' },
  engineLight: { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000' },
  imageContainer: { width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', border: '6px solid #1e293b', marginBottom: '20px' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  input: { width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155' },
  feedbackCard: { padding: '15px', borderRadius: '12px', border: '3px solid', textAlign: 'center' },
  resultCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }
};

export default App;
