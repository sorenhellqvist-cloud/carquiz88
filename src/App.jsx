// Version: 3.9 - Unique Alias Guard + Chrome Gauge + Ad Slot
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

  // NY LOGIK: Kontrollera unika alias
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
      // Om aliaset finns, kolla om e-posten matchar (inloggning)
      if (email && existingUser.email === email) {
        setLevel(existingUser.current_level);
        setScore(existingUser.total_score);
        setGameState('card_level_rules');
      } else {
        // Annars stoppa för att undvika dubbletter i leaderboard
        alert("Detta alias används redan. Välj ett annat namn eller ange rätt e-post för att fortsätta.");
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
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const bonus = timeLeft * 10;
      const finalScore = score + bonus;
      setScore(finalScore);
      await supabase.from('leaderboard').upsert({ 
        alias: user.trim(), 
        email, 
        current_level: level + 1, 
        total_score: finalScore 
      }, { onConflict: 'alias' });
      fetchLeaderboard();
      setGameState('card_ad');
    }
  };

  const getNeedleRotation = () => ( (timeLeft / MAX_TIME) * 180 ) - 90;

  // --- RENDERING ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1>TIMEDE.SE 🔒</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="Lösenord" />
          <button onClick={() => password === 'bil88' ? setIsLocked(false) : alert("Fel!")} style={styles.primaryButton}>ÖPPNA</button>
        </div>
      </div>
    );
  }

  if (gameState === 'card_welcome' || gameState === 'card_inputs' || gameState === 'card_level_rules') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          {gameState === 'card_welcome' && (
            <>
              <h2 style={styles.title}>Välkommen! 🏎️</h2>
              <div style={styles.infoBox}>
                <p><strong>Alias:</strong> Krävs för att du ska synas på topplistan.</p>
                <p style={{marginTop: '15px'}}><strong>E-post:</strong> Valfritt, men behövs om du vill fortsätta spela på ditt alias senare.</p>
              </div>
              <button onClick={() => setGameState('card_inputs')} style={styles.primaryButton}>NÄSTA</button>
            </>
          )}
          {gameState === 'card_inputs' && (
            <>
              <h2 style={styles.title}>Vem kör idag?</h2>
              <div style={styles.loginForm}>
                <input placeholder="Välj ett unikt alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
                <input placeholder="Din E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                <button onClick={handleAuthCheck} style={styles.primaryButton}>KONTROLLERA NAMN</button>
              </div>
            </>
          )}
          {gameState === 'card_level_rules' && (
            <>
              <h2 style={styles.title}>Nivå {level}</h2>
              <div style={styles.infoBox}>
                <p><strong>Mål:</strong> {level === 1 ? "Välj rätt bilmärke." : "Gissa rätt år."}</p>
                <p style={{marginTop: '15px'}}><strong>Motorras:</strong> Vid 3 fel får du börja om nivån.</p>
              </div>
              <button onClick={startLevel} style={styles.primaryButton}>STARTA SPEL</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const currentCar = questions[currentQuestion];
    if (!currentCar) return <div style={styles.appWrapper}>Laddar...</div>;
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <div style={styles.gaugeOuter}>
            <div style={styles.gaugeInner}>
              <div style={styles.gaugeScale}><span style={styles.scaleE}>E</span><span style={styles.scaleF}>F</span><div style={styles.gaugeLabel}>FUEL</div></div>
              <div style={{...styles.needle, transform: `translateX(-50%) rotate(${getNeedleRotation()}deg)`}}></div>
              <div style={styles.needleHub}></div><div style={styles.gaugeGlass}></div>
            </div>
          </div>
          <div style={styles.imageContainer}><img src={currentCar.imageUrl} alt="Car" style={styles.carImage} /></div>
          {!feedback ? (
            level === 1 ? (
              <div style={styles.grid}>{options.map((m, i) => <button key={i} onClick={() => handleAnswer(m)} style={styles.boneButton}>{m}</button>)}</div>
            ) : (
              <div style={styles.sliderContainer}>
                <div style={styles.yearDisplay}>{sliderValue}</div>
                <input type="range" min="1945" max="1965" step="1" value={sliderValue} onChange={(e) => setSliderValue(e.target.value)} style={styles.slider} />
                <button onClick={() => handleAnswer()} style={styles.primaryButton}>LÅS ÅR</button>
              </div>
            )
          ) : (
            <div style={styles.feedbackCard}><p style={{fontWeight: 'bold', color: '#000'}}>{feedback.details}</p><button onClick={handleNext} style={styles.primaryButton}>NÄSTA</button></div>
          )}
          <div style={styles.statusRowBottom}>
            <div style={styles.statusBox}>
              <div style={{fontSize: '9px', color: '#94a3b8'}}>CHECK ENGINE</div>
              <div style={{display: 'flex', gap: '5px', justifyContent: 'center', marginTop: '5px'}}>
                {[1, 2, 3].map(i => <div key={i} style={{width: '12px', height: '12px', borderRadius: '50%', backgroundColor: (mistakes >= i) ? '#f00' : '#1e293b', boxShadow: (mistakes >= i) ? '0 0 8px #f00' : 'none', border: '1px solid #000'}} />)}
              </div>
            </div>
            <div style={styles.statusBox}><div style={{fontSize: '9px', color: '#94a3b8'}}>PROGRESS</div><div style={{fontWeight: 'bold'}}>{currentQuestion + 1} / 25</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        {gameState === 'failed' && (
          <><h1 style={{color: '#ef4444'}}>MOTORRAS!</h1><button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button></>
        )}
        {gameState === 'card_ad' && (
          <>
            <h2 style={{color: '#22c55e'}}>KLARAD!</h2>
            <div style={styles.leaderboardBox}>
              <h4 style={{textAlign: 'center', color: '#fbbf24', margin: '0 0 10px 0'}}>TOPPLISTA 🏆</h4>
              {leaderboard.map((entry, i) => <div key={i} style={styles.leaderboardEntry}><span>{i+1}. {entry.alias}</span><span>{entry.total_score}p</span></div>)}
            </div>
            <div style={styles.adSlot}><span style={{fontSize: '10px', color: '#475569'}}>ANNONS</span><div style={styles
