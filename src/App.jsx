// Version: 3.5 (KOMPLETT) - Fix: Start-knapp aktiverar spelplanen
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
  const [gameState, setGameState] = useState('card_welcome'); 
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('leaderboard').select('alias, total_score').order('total_score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
  };

  const handleAuthCheck = async () => {
    if (!user || user.trim() === "") {
      alert("Vänligen välj ett alias!");
      return;
    }
    const { data } = await supabase.from('leaderboard').select('*').eq('alias', user.trim()).single();
    if (data) {
      setLevel(data.current_level);
      setScore(data.total_score);
    }
    setGameState('card_level_rules');
  };

  const startLevel = () => {
    const shuffled = [...allCars].sort(() => 0.5 - Math.random()).slice(0, 25).map(car => ({
        ...car, imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
    }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setFeedback(null);
    setTimerActive(true);
    setGameState('playing'); // Aktiverar spelsidan
  };

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
      else if (diff <= 2) points = 50; 
      else isMiss = true;
    }

    if (isMiss) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 3) {
        setGameState('failed');
        setTimerActive(false);
        return;
      }
    }
    setScore(prev => prev + points);
    setFeedback({ isCorrect: !isMiss, details: `Det var en ${currentCar.year} ${currentCar.make}.` });
  };

  const handleNext = async () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const finalScore = score + (timeLeft * 10);
      setScore(finalScore);
      await supabase.from('leaderboard').upsert({ alias: user, email, current_level: level + 1, total_score: finalScore }, { onConflict: 'alias' });
      fetchLeaderboard();
      setGameState('card_ad');
    }
  };

  // --- RENDERING ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1>LÅST 🔒</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Lösenord" />
          <button onClick={() => password === 'bil88' ? setIsLocked(false) : alert("Fel!")} style={styles.primaryButton}>ÖPPNA</button>
        </div>
      </div>
    );
  }

  if (gameState === 'card_welcome') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Välkommen! 🏎️</h2>
          <div style={styles.infoBox}>
            <p><strong>Varför Alias?</strong> För att spara dina poäng på topplistan.</p>
            <p style={{marginTop: '15px'}}><strong>Varför E-post?</strong> Så att vi kan nå dig om du vinner ett veckopris. (Valfritt)</p>
          </div>
          <button onClick={() => setGameState('card_inputs')} style={styles.primaryButton}>NÄSTA</button>
        </div>
      </div>
    );
  }

  if (gameState === 'card_inputs') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Vem kör idag?</h2>
          <div style={styles.loginForm}>
            <input placeholder="Ditt Alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
            <input placeholder="Din E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            <button onClick={handleAuthCheck} style={styles.primaryButton}>GÅ VIDARE</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'card_level_rules') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Regler för Nivå {level}</h2>
          <div style={styles.infoBox}>
            <p><strong>Uppgift:</strong> {level === 1 ? "Välj rätt bilmärke bland alternativen." : "Gissa rätt år med slidern."}</p>
            <p style={{marginTop: '15px'}}><strong>Lamporna:</strong> Vid varje fel svar tänds en lampa. Vid 3 fel får du börja om nivån!</p>
          </div>
          <button onClick={startLevel} style={styles.primaryButton}>STARTA SPEL</button>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentCar = questions[currentQuestion];
    if (!currentCar) return <div style={styles.appWrapper}>Tanker upp...</div>;

    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <div style={styles.imageContainer}>
            <img key={currentCar.file_name} src={currentCar.imageUrl} alt="Car" style={styles.carImage} />
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
                <button onClick={() => handleAnswer()} style={styles.primaryButton}>LÅS ÅR</button>
              </div>
            )
          ) : (
            <div style={styles.feedbackCard}>
              <p style={{fontWeight: 'bold', color: '#000'}}>{feedback.details}</p>
              <button onClick={handleNext} style={styles.primaryButton}>NÄSTA BILD</button>
            </div>
          )}

          <div style={styles.statusRowBottom}>
            <div style={styles.statusBox}>
              <div style={{fontSize: '9px'}}>CHECK ENGINE</div>
              <div style={{display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px'}}>
                <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: (mistakes >= 1) ? '#f00' : '#334155'}} />
                <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: (mistakes >= 2) ? '#f00' : '#334155'}} />
                <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: (mistakes >= 3) ? '#f00' : '#334155'}} />
              </div>
            </div>
            <div style={styles.statusBox}>
              <div style={{fontSize: '9px'}}>PROGRESS</div>
              <div style={{fontWeight: 'bold'}}>{currentQuestion + 1} / 25</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback för andra states (failed, card_ad)
  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        {gameState === 'failed' && (
          <>
            <h1 style={{color: '#ef4444'}}>MOTORRAS!</h1>
            <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
          </>
        )}
        {gameState === 'card_ad' && (
          <>
            <h2 style={{color: '#22c55e'}}>KLARAD!</h2>
            <button onClick={() => { setLevel(level + 1); setGameState('card_level_rules'); }} style={styles.primaryButton}>NÄSTA NIVÅ</button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { fontSize: '24px', marginBottom: '20px' },
  infoBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'left' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', border: 'none', fontSize: '16px', boxSizing: 'border-box' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  loginForm: { display: 'flex', flexDirection: 'column' },
  imageContainer: { width: '100%', aspectRatio: '4/3', marginBottom: '20px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #1e293b' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  boneButton: { padding: '15px', backgroundColor: '#f8fafc', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  sliderContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px' },
  yearDisplay: { fontSize: '36px', marginBottom: '10px', color: '#fbbf24', fontWeight: 'bold' },
  slider: { width: '100%', marginBottom: '15px' },
  feedbackCard: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '20px' },
  statusRowBottom: { display: 'flex', gap: '10px', marginTop: '20px' },
  statusBox: { flex: 1, backgroundColor: '#0f172a', padding: '10px', borderRadius: '10px' }
};

export default App;
