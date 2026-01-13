// Version: 2.7.2 - Layout Fix: Vertical Login Stack
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [allCars, setAllCars] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [options, setOptions] = useState([]); 
  const [sliderValue, setSliderValue] = useState(1955);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [level, setLevel] = useState(1); 
  const [gameState, setGameState] = useState('auth'); 
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  const [failReason, setFailReason] = useState("");
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
  }, []);

  const saveProgress = async (finalScore, nextLevel) => {
    if (!user) return;
    await supabase.from('leaderboard').upsert({ 
        alias: user, email, current_level: nextLevel, total_score: finalScore, last_played: new Date() 
    }, { onConflict: 'alias' });
  };

  const handleStartGame = async () => {
    let targetLevel = 1;
    if (user) {
      const { data } = await supabase.from('leaderboard').select('*').eq('alias', user).single();
      if (data) {
        targetLevel = data.current_level;
        setScore(data.total_score);
      }
    }
    prepareLevel(targetLevel);
  };

  const prepareLevel = (targetLevel) => {
    const shuffled = [...allCars].sort(() => 0.5 - Math.random()).slice(0, 25).map(car => ({
        ...car, imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
    }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setLevel(targetLevel);
    setTimeLeft(targetLevel === 1 ? 250 : 225);
    setGameState('playing');
    setTimerActive(true);
    setFeedback(null);
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setFailReason("BENSINSTOPP!");
      setGameState('failed');
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && level === 1 && !feedback) {
      const currentCar = questions[currentQuestion];
      const allMakes = [...new Set(allCars.map(q => q.make))];
      const wrong = allMakes.filter(m => m !== currentCar.make).sort(() => 0.5 - Math.random()).slice(0, 3);
      setOptions([currentCar.make, ...wrong].sort(() => 0.5 - Math.random()));
    }
  }, [currentQuestion, questions, gameState, level, feedback, allCars]);

  const handleAnswer = (selected) => {
    if (feedback) return;
    const currentCar = questions[currentQuestion];
    let points = 0;
    let isMiss = false;

    if (level === 1) {
      if (selected === currentCar.make) points = 100;
      else isMiss = true;
    } else {
      const diff = Math.abs(parseInt(sliderValue) - currentCar.year);
      if (diff === 0) points = 100;
      else if (diff === 1) points = 50;
      else if (diff === 2) points = 25;
      else isMiss = true;
    }

    if (isMiss) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 3) {
        setFailReason("MOTORRAS!");
        setGameState('failed');
        setTimerActive(false);
        return;
      }
    }
    setScore(score + points);
    setFeedback({ isCorrect: !isMiss, details: `Det var en ${currentCar.year} ${currentCar.make}. +${points}p` });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const finalScore = score + (timeLeft * 10);
      setScore(finalScore);
      saveProgress(finalScore, level + 1);
      setGameState('interstitial');
    }
  };

  // --- VIEWS ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1>TIMEDE.SE 🔒</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={() => password === 'bil88' ? setIsLocked(false) : alert("Fel!")} style={styles.primaryButton}>LÅS UPP</button>
        </div>
      </div>
    );
  }

  if (gameState === 'auth') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={{fontSize: '24px', marginBottom: '15px'}}>Välkommen till Bilquizet! 🏎️</h2>
          <div style={styles.infoBox}>
            <p style={{fontSize: '14px', marginBottom: '10px'}}>Ange alias för att spara framsteg och tävla om priser!</p>
            <ul style={{fontSize: '12px', textAlign: 'left', color: '#cbd5e1', margin: 0, paddingLeft: '20px'}}>
              <li>Rätt år: 100p | 1 år fel: 50p | 2 år fel: 25p</li>
              <li>3 missar (>2 år fel) = Game Over</li>
            </ul>
          </div>
          
          <div style={styles.loginForm}>
            <input placeholder="Ditt Alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
            <input placeholder="E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            <button onClick={handleStartGame} style={styles.primaryButton}>STARTA / FORTSÄTT</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'interstitial') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={{color: '#22c55e'}}>NIVÅ {level} KLARAD!</h2>
          <div style={styles.resultCard}><h3>DIN TOTALA POÄNG: {score}</h3></div>
          <div style={styles.googleAdWrapper}>ANNONSPLATS (300x250)</div>
          <button onClick={() => prepareLevel(level + 1)} style={styles.primaryButton}>NÄSTA NIVÅ</button>
        </div>
      </div>
    );
  }

  if (gameState === 'failed') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: '#ef4444'}}>GAME OVER!</h1>
          <p>{failReason}</p>
          <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
        </div>
      </div>
    );
  }

  const currentCar = questions[currentQuestion];

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeChromeRing}>
            <div style={styles.gaugeBackground}>
                <div style={{ ...styles.gaugeNeedle, transform: `translateX(-50%) rotate(${(timeLeft / (level === 1 ? 250 : 225)) * 140 - 70}deg)` }} />
                <div style={styles.labelE}>E</div><div style={styles.labelF}>F</div>
                <div style={styles.fuelText}>FUEL</div>
            </div>
          </div>
        </div>
        <div style={styles.imageContainer}>
          <img key={currentCar?.file_name} src={currentCar?.imageUrl} alt="Car" style={styles.carImage} />
        </div>
        {!feedback ? (
          level === 1 ? (
            <div style={styles.grid}>
              {options.map((m, i) => <button key={i} onClick={() => handleAnswer(m)} style={styles.boneButton}>{m}</button>)}
            </div>
          ) : (
            <div style={styles.sliderContainer}>
              <div style={styles.yearDisplay}>{sliderValue}</div>
              <input type="range" min="1945" max="1965" step="1" value={sliderValue} onChange={(e) => setSliderValue(e.target.value)} style={styles.slider} />
              <button onClick={() => handleAnswer()} style={styles.primaryButton}>LÅS ÅRSMODELL</button>
            </div>
          )
        ) : (
          <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2'}}>
            <p style={{color: '#111827', fontWeight: 'bold'}}>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA</button>
          </div>
        )}
        <div style={styles.statusRowBottom}>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>CHECK ENGINE</div>
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '5px'}}>
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ff0000' : '#1e293b'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ff0000' : '#1e293b'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 3 ? '#ff0000' : '#1e293b'}} />
            </div>
          </div>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>PROGRESS</div>
            <div style={{fontSize: '18px', fontWeight: 'bold'}}>{currentQuestion + 1} / 25</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', padding: '15px', color: '#f8fafc', fontFamily: 'serif' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' },
  retroGaugeContainer: { display: 'flex', justifyContent: 'center', height: '140px', position: 'relative', marginBottom: '20px' },
  gaugeChromeRing: { width: '210px', height: '210px', borderRadius: '50%', background: 'linear-gradient(145deg, #94a3b8, #f8fafc, #475569)', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'absolute', top: '-100px' },
  gaugeBackground: { width: '190px', height: '190px', borderRadius: '50%', backgroundColor: '#ecece4', position: 'relative', overflow: 'hidden' },
  gaugeNeedle: { position: 'absolute', bottom: '50%', left: '50%', width: '4px', height: '75px', backgroundColor: '#b91c1c', transformOrigin: 'bottom center', zIndex: '10', transition: 'transform 0.5s ease' },
  labelE: { position: 'absolute', bottom: '28%', left: '18%', color: '#000', fontWeight: 'bold' },
  labelF: { position: 'absolute', bottom: '28%', right: '18%', color: '#000', fontWeight: 'bold' },
  fuelText: { position: 'absolute', top: '60%', left: '50%', transform: 'translateX(-50%)', fontSize: '14px', color: '#000', fontWeight: 'bold' },
  imageContainer: { width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', border: '6px solid #1e293b', marginBottom: '20px' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  boneButton: { padding: '18px 5px', borderRadius: '10px', backgroundColor: '#f5f5f0', color: '#1f2937', fontWeight: 'bold', cursor: 'pointer' },
  sliderContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px' },
  yearDisplay: { fontSize: '40px', color: '#fbbf24', fontWeight: 'bold', marginBottom: '10px' },
  slider: { width: '100%', marginBottom: '20px', cursor: 'pointer' },
  statusRowBottom: { display: 'flex', gap: '15px', marginTop: '25px' },
  statusBox: { flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px', border: '2px solid #1e293b' },
  engineLight: { width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #000' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', borderRadius: '10px', fontWeight: 'bold', border: 'none', cursor: 'pointer', boxSizing: 'border-box' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', border: 'none', backgroundColor: '#1e293b', color: 'white', boxSizing: 'border-box', fontSize: '16px' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }, // NYTT: Tvingar stapling
  infoBox: { backgroundColor: '#1e293b', padding: '15px', borderRadius: '10px', marginBottom: '15px', textAlign: 'left' },
  googleAdWrapper: { height: '250px', backgroundColor: '#0f172a', border: '1px dashed #475569', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '15px' },
  resultCard: { backgroundColor: '#1e293b', padding: '15px', borderRadius: '10px', marginBottom: '15px' },
  feedbackCard: { padding: '15px', borderRadius: '12px', border: '3px solid' }
};

export default App;
