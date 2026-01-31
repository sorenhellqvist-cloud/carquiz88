// Version: 3.9 - Complete App with Chrome Gauge, Ads Slot & Alias Guard
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

  const MAX_TIME = level === 1 ? 250 : 200;

  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
    fetchLeaderboard();
  }, []);

  // Analog Timer-logik för bensinmätaren
  useEffect(() => {
    let interval;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('failed');
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('leaderboard').select('alias, total_score').order('total_score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
  };

  // ALIAS-VAKT: Kontrollerar unika namn mot databasen
  const handleAuthCheck = async () => {
    if (!user || user.trim() === "") {
      alert("Vänligen välj ett alias!");
      return;
    }

    const trimmedAlias = user.trim();
    const { data: existingUser } = await supabase
      .from('leaderboard')
      .select('*')
      .eq('alias', trimmedAlias)
      .single();

    if (existingUser) {
      // Om namnet finns krävs rätt e-post för att "logga in"
      if (email && existingUser.email === email) {
        setLevel(existingUser.current_level);
        setScore(existingUser.total_score);
        setGameState('card_level_rules');
      } else {
        alert("Detta alias används redan. Välj ett annat namn eller ange rätt e-post.");
        return;
      }
    } else {
      setGameState('card_level_rules');
    }
  };

  const startLevel = () => {
    const shuffled = [...allCars].sort(() => 0.5 - Math.random()).slice(0, 25).map(car => ({
        ...car, imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
    }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setFeedback(null);
    setTimeLeft(MAX_TIME);
    setTimerActive(true);
    setGameState('playing');
  };

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
      setCurrentQuestion(prev => prev + 1);
    } else {
      setGameState('level_complete');
      setTimerActive(false);
      await saveProgress();
    }
  };

  const saveProgress = async () => {
    const { data: existing } = await supabase.from('leaderboard').select('*').eq('alias', user.trim()).single();
    if (existing) {
      await supabase.from('leaderboard').update({
        total_score: existing.total_score + score,
        current_level: level + 1
      }).eq('alias', user.trim());
    } else {
      await supabase.from('leaderboard').insert({
        alias: user.trim(),
        email: email || null,
        total_score: score,
        current_level: level + 1
      });
    }
    await fetchLeaderboard();
  };

  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && level === 1 && !feedback) {
      const currentCar = questions[currentQuestion];
      const allMakes = [...new Set(allCars.map(q => q.make))];
      const wrong = allMakes.filter(m => m !== currentCar.make).sort(() => 0.5 - Math.random()).slice(0, 3);
      setOptions([currentCar.make, ...wrong].sort(() => 0.5 - Math.random()));
    }
  }, [currentQuestion, questions, gameState, level, feedback, allCars]);

  // Bensinmätare med Chrome-design
  const gaugePercent = (timeLeft / MAX_TIME) * 100;
  const gaugeColor = gaugePercent > 40 ? '#22c55e' : gaugePercent > 20 ? '#f59e0b' : '#ef4444';

  const styles = {
    app: { fontFamily: 'Arial, sans-serif', background: 'linear-gradient(135deg, #1e293b, #334155)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', boxSizing: 'border-box' },
    card: { background: '#fff', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.3)', maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center' },
    title: { fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#1e293b' },
    input: { width: '100%', padding: '12px', marginTop: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px', boxSizing: 'border-box' },
    button: { background: '#3b82f6', color: '#fff', padding: '14px 28px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '16px' },
    image: { width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginBottom: '20px' },
    optionButton: { display: 'block', width: '100%', padding: '12px', margin: '8px 0', background: '#e2e8f0', border: 'none', borderRadius: '8px', fontSize: '16px', cursor: 'pointer' },
    feedbackCorrect: { color: '#22c55e', fontWeight: 'bold', marginTop: '12px' },
    feedbackWrong: { color: '#ef4444', fontWeight: 'bold', marginTop: '12px' },
    gauge: { width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #e2e8f0', position: 'relative', margin: '20px auto', background: `conic-gradient(${gaugeColor} ${gaugePercent}%, #e2e8f0 ${gaugePercent}%)` },
    gaugeInner: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '24px', fontWeight: 'bold', color: '#1e293b' },
    leaderboard: { marginTop: '20px', textAlign: 'left' },
    leaderboardItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' },
    adSlot: { marginTop: '20px', padding: '16px', background: '#f1f5f9', borderRadius: '8px', border: '1px dashed #cbd5e1', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  };

  return (
    <div style={styles.app}>
      <div style={styles.card}>
        {gameState === 'card_welcome' && (
          <>
            <h1 style={styles.title}>🚗 CarQuiz88</h1>
            <p>Testa dina bilkunskaper genom tiderna!</p>
            <input style={styles.input} type="text" placeholder="Välj ett alias" value={user} onChange={(e) => setUser(e.target.value)} />
            <input style={styles.input} type="email" placeholder="E-post (valfritt, för att återuppta)" value={email} onChange={(e) => setEmail(e.target.value)} />
            <button style={styles.button} onClick={handleAuthCheck}>Fortsätt</button>
            <div style={styles.leaderboard}>
              <h3>🏆 Topplista</h3>
              {leaderboard.map((entry, i) => (
                <div key={i} style={styles.leaderboardItem}>
                  <span>{i + 1}. {entry.alias}</span>
                  <span>{entry.total_score} p</span>
                </div>
              ))}
            </div>
            <div style={styles.adSlot}><span style={{fontSize: '10px', color: '#475569'}}>ANNONS</span></div>
          </>
        )}

        {gameState === 'card_level_rules' && (
          <>
            <h2 style={styles.title}>Level {level}</h2>
            <p>{level === 1 ? "Gissa bilmärket!" : "Gissa årsmodellen!"}</p>
            <p>Du har {MAX_TIME} sekunder och 3 liv.</p>
            <button style={styles.button} onClick={startLevel}>Starta</button>
          </>
        )}

        {gameState === 'playing' && questions.length > 0 && (
          <>
            <div style={styles.gauge}>
              <div style={styles.gaugeInner}>{timeLeft}s</div>
            </div>
            <p>Fråga {currentQuestion + 1}/{questions.length} | Poäng: {score} | Liv: {3 - mistakes}</p>
            <img style={styles.image} src={questions[currentQuestion].imageUrl} alt="car" />
            {level === 1 && !feedback && options.map((opt, i) => (
              <button key={i} style={styles.optionButton} onClick={() => handleAnswer(opt)}>{opt}</button>
            ))}
            {level === 2 && !feedback && (
              <>
                <input type="range" min="1920" max="2024" value={sliderValue} onChange={(e) => setSliderValue(e.target.value)} style={{width: '100%'}} />
                <p>År: {sliderValue}</p>
                <button style={styles.button} onClick={() => handleAnswer(sliderValue)}>Svara</button>
              </>
            )}
            {feedback && (
              <>
                <p style={feedback.isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}>
                  {feedback.isCorrect ? '✅ Rätt!' : '❌ Fel!'}
                </p>
                <p>{feedback.details}</p>
                <button style={styles.button} onClick={handleNext}>Nästa</button>
              </>
            )}
          </>
        )}

        {gameState === 'level_complete' && (
          <>
            <h2 style={styles.title}>🎉 Level {level} klar!</h2>
            <p>Din poäng: {score}</p>
            <button style={styles.button} onClick={() => { setLevel(level + 1); setScore(0); setGameState('card_level_rules'); }}>Nästa level</button>
          </>
        )}

        {gameState === 'failed' && (
          <>
            <h2 style={styles.title}>😢 Game Over</h2>
            <p>Poäng: {score}</p>
            <button style={styles.button} onClick={() => { setGameState('card_welcome'); setScore(0); setLevel(1); setUser(""); setEmail(""); }}>Tillbaka</button>
          </>
        )}
      </div>
    </div>
  );
}

export default App;