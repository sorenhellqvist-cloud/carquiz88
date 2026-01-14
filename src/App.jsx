// Version: 2.9 - Card-based Navigation & Level Logic
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
  // Ändrat gameState för att stödja din kort-sekvens
  const [gameState, setGameState] = useState('info_auth'); 
  const [user, setUser] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  const [failReason, setFailReason] = useState("");
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
  }, []);

  const fetchLeaderboard = async () => {
    const { data } = await supabase.from('leaderboard').select('alias, total_score').order('total_score', { ascending: false }).limit(5);
    if (data) setLeaderboard(data);
  };

  const saveProgress = async (finalScore, nextLevel) => {
    if (!user) return;
    await supabase.from('leaderboard').upsert({ alias: user, email, current_level: nextLevel, total_score: finalScore, last_played: new Date() }, { onConflict: 'alias' });
  };

  // Steg 1: Från Registrering till Nivå-info
  const handleAuthDone = async () => {
    let targetLevel = 1;
    if (user) {
      const { data } = await supabase.from('leaderboard').select('*').eq('alias', user).single();
      if (data) {
        targetLevel = data.current_level;
        setScore(data.total_score);
      }
    }
    setLevel(targetLevel);
    setGameState('info_level');
  };

  // Steg 2: Starta själva spelandet
  const prepareLevel = () => {
    const shuffled = [...allCars].sort(() => 0.5 - Math.random()).slice(0, 25).map(car => ({
        ...car, imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
    }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setTimeLeft(level === 1 ? 250 : 225);
    setGameState('playing');
    setTimerActive(true);
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
      else if (diff === 1) points = 50;
      else if (diff === 2) points = 25;
      else isMiss = true;
    }

    if (isMiss && level === 2) { // Motorras endast på Nivå 2+
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
      await fetchLeaderboard();
      setGameState('interstitial');
    }
  };

  // --- KORT-RENDERING ---

  // KORT: Registrering
  if (gameState === 'info_auth') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Välkommen! 🏎️</h2>
          <div style={styles.infoBox}>
            <p>För att spara dina framsteg och tävla om priser behöver du välja ett alias.</p>
            <p style={{fontSize: '12px', color: '#94a3b8'}}>Tips: Lägg till e-post om du vill att vi ska kunna kontakta dig vid vinst!</p>
          </div>
          <div style={styles.loginForm}>
            <input placeholder="Ditt Alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
            <input placeholder="E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            <button onClick={handleAuthDone} style={styles.primaryButton}>NÄSTA</button>
          </div>
        </div>
      </div>
    );
  }

  // KORT: Nivå-information
  if (gameState === 'info_level') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Nivå {level}</h2>
          <div style={styles.infoBox}>
            {level === 1 ? (
              <>
                <p><strong>Mål:</strong> Identifiera bilmärket bland 4 alternativ.</p>
                <p><strong>Poäng:</strong> 100p per rätt svar.</p>
                <p><strong>Tid:</strong> Du har 250 sekunder på dig för hela nivån.</p>
              </>
            ) : (
              <>
                <p><strong>Mål:</strong> Gissa exakt årsmodell med slidern.</p>
                <p><strong>Motorlampa:</strong> 3 missar (>2 år fel) ger motorras!</p>
                <p><strong>Bonus:</strong> Tid kvar ger extrapoäng.</p>
              </>
            )}
          </div>
          <button onClick={prepareLevel} style={styles.primaryButton}>STARTA NIVÅN</button>
        </div>
      </div>
    );
  }

  // KORT: Mellanskärm / Google Ad
  if (gameState === 'interstitial') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={{color: '#22c55e'}}>NIVÅ KLARAD!</h2>
          <div style={styles.leaderboardBox}>
            <h4 style={{marginTop: 0, color: '#fbbf24', textAlign: 'center'}}>TOPPLISTA 🏆</h4>
            {leaderboard.map((entry, i) => (
              <div key={i} style={styles.leaderboardEntry}>
                <span>{i+1}. {entry.alias}</span>
                <span style={{fontWeight: 'bold'}}>{entry.total_score}p</span>
              </div>
            ))}
          </div>
          <div style={styles.googleAdWrapper}>ANNONSFRITT UNDER TEST</div>
          <button onClick={() => { setLevel(level + 1); setGameState('info_level'); }} style={styles.primaryButton}>GÅ VIDARE</button>
        </div>
      </div>
    );
  }

  // ... (Behåll playing-vyn men använd renderGameControls för slider-fixen) ...
