// Version: 2.8 - Final Layout Fix & Leaderboard Integration
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
  const [leaderboard, setLeaderboard] = useState([]); // För topplistan

  // Hämta bilar vid start
  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
  }, []);

  // Funktion för att hämta topplistan
  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('leaderboard')
      .select('alias, total_score')
      .order('total_score', { ascending: false })
      .limit(5);
    if (data) setLeaderboard(data);
  };

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
    if (allCars.length === 0) return;
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

  const handleNext = async () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const finalScore = score + (timeLeft * 10);
      setScore(finalScore);
      await saveProgress(finalScore, level + 1);
      await fetchLeaderboard(); // Hämta ny topplista
      setGameState('interstitial');
    }
  };

  // --- RENDERING ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1>TIMEDE.SE 🔒</h1>
          <div style={styles.loginForm}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Lösenord" />
            <button onClick={() => password === 'bil88' ? setIsLocked(false) : alert("Fel!")} style={styles.primaryButton}>LÅS UPP</button>
          </div>
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
            <p style={{fontSize: '14px', marginBottom: '10px'}}>Ange alias för att tävla om veckopriser!</p>
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
          <h2 style={{color: '#22c55e', marginBottom: '10px'}}>NIVÅ {level} KLARAD!</h2>
          <div style={styles.resultCard}>
             <h3 style={{margin: 0}}>DIN POÄNG: {score}</h3>
          </div>
          
          <div style={styles.leaderboardBox}>
            <h4 style={{marginTop: 0, color: '#fbbf24'}}>VECKANS TOPPLISTA 🏆</h4>
            {leaderboard.map((entry, i) => (
              <div key={i} style={styles.leaderboardEntry}>
                <span>{i+1}. {entry.alias}</span>
                <span style={{fontWeight: 'bold'}}>{entry.total_score}p</span>
              </div>
            ))}
          </div>

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
  if (!currentCar) return <div style={styles.appWrapper}>Laddar motorer...</div>;

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeChromeRing}>
            <div style={styles.gaugeBackground}>
                <div style={{ ...styles.gaugeNeedle, transform: `translateX(-50%) rotate(${(timeLeft / (level === 1 ? 250 : 225)) * 140 - 70}deg)` }} />
                <div style={styles.labelE}>E</div>
