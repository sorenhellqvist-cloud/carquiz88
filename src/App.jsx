// Version: 3.9.1 - Fix: Square images & Chrome Gauge with Arrow Needle
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

  const handleAuthCheck = async () => {
    if (!user || user.trim() === "") {
      alert("Vänligen välj ett alias!");
      return;
    }
    const trimmedAlias = user.trim();
    const { data: existingUser } = await supabase.from('leaderboard').select('*').eq('alias', trimmedAlias).single();
    if (existingUser) {
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
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const bonus = timeLeft * 10;
      const finalScore = score + bonus;
      setScore(finalScore);
      await supabase.from('leaderboard').upsert({ alias: user.trim(), email, current_level: level + 1, total_score: finalScore }, { onConflict: 'alias' });
      fetchLeaderboard();
      setGameState('card_ad');
    }
  };

  const getNeedleRotation = () => ((timeLeft / MAX_TIME) * 180) - 90;

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
                <p><strong>Varför Alias?</strong> För att tävla på topplistan.</p>
                <p style={{marginTop: '15px'}}><strong>Varför E-post?</strong> Skyddar ditt namn. (Valfritt)</p>
              </div>
              <button onClick={() => setGameState('card_inputs')} style={styles.primaryButton}>NÄSTA</button>
            </>
          )}
          {gameState === 'card_inputs' && (
            <>
              <h2 style={styles.title}>Vem kör idag?</h2>
              <div style={styles.loginForm}>
                <input placeholder="Ditt unika alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
                <input placeholder="Din E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
                <button onClick={handleAuthCheck} style={styles.primaryButton}>GÅ VIDARE</button>
              </div>
            </>
          )}
          {gameState === 'card_level_rules' && (
            <>
              <h2 style={styles.title}>Nivå {level}</h2>
              <div style={styles.infoBox}>
                <p><strong>Uppgift:</strong> {level === 1 ? "Välj rätt bilmärke." : "Gissa rätt årtal."}</p>
                <p style={{marginTop: '15px'}}><strong>Lamporna:</strong> 3 fel = Motorras.</p>
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
          {/* RUND CHROMAD MÄTARE MED PIL */}
          <div style={styles.gaugeOuter}>
            <div style={styles.gaugeInner}>
              <div style={styles.gaugeScale}><span style={styles.scaleE}>E</span><span style={styles.scaleF}>F</span><div style={styles.gaugeLabel}>FUEL</div></div>
              <div style={{...styles.needle, transform: `translateX(-50%) rotate(${getNeedleRotation()}deg)`}}>
                <div style={styles.needleArrow}></div>
              </div>
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
            <div style={styles.adSlot}><span style={{fontSize: '10px', color: '#475569'}}>ANNONS</span><div style={styles.adInner}>Google Ads</div></div>
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
  // FYRKANTIG BILD
  imageContainer: { width: '100%', aspectRatio: '1/1', marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #1e293b' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  // CHROMAD MÄTARE
  gaugeOuter: { width: '110px', height: '110px', margin: '0 auto 15px', borderRadius: '50%', background: 'linear-gradient(145deg, #ffffff, #888888, #444444)', padding: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.7)', border: '2px solid #ccc' },
  gaugeInner: { width: '100%', height: '100%', backgroundColor: '#050505', borderRadius: '50%', position: 'relative', overflow: 'hidden', border: '1px solid #000' },
  gaugeScale: { position: 'absolute', width: '100%', height: '100%', color: '#fff', fontSize: '12px', fontWeight: 'bold' },
  scaleE: { position: 'absolute', left: '18px', bottom: '28px', color: '#ff4444' },
  scaleF: { position: 'absolute', right: '18px', bottom: '28px' },
  gaugeLabel: { position: 'absolute', width: '100%', bottom: '12px', fontSize: '8px', letterSpacing: '1px', color: '#444' },
  needle: { position: 'absolute', bottom: '50%', left: '50%', width: '2px', height: '42px', backgroundColor: '#ff0000', transformOrigin: 'bottom center', transition: 'transform 0.6s ease-out', zIndex: 2 },
  needleArrow: { position: 'absolute', top: '-6px', left: '-3px', width: '0', height: '0', borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '8px solid #ff0000' },
  needleHub: { position: 'absolute', top: '50%', left: '50%', width: '10px', height: '10px', backgroundColor: '#222', borderRadius: '50%', transform: 'translate(-50%, -50%)', zIndex: 3, border: '1px solid #666' },
  gaugeGlass: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%)', pointerEvents: 'none' },
  title: { fontSize: '24px', marginBottom: '20px' },
  infoBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'left' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', border: 'none', fontSize: '16px', boxSizing: 'border-box', backgroundColor: '#1e293b', color: 'white' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  loginForm: { display: 'flex', flexDirection: 'column' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  boneButton: { padding: '15px', backgroundColor: '#f8fafc', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  sliderContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px' },
  yearDisplay: { fontSize: '38px', marginBottom: '10px', color: '#fbbf24', fontWeight: 'bold' },
  slider: { width: '100%', marginBottom: '15px' },
  feedbackCard: { padding: '20px', backgroundColor: '#f8fafc', borderRadius: '10px', marginBottom: '20px' },
  statusRowBottom: { display: 'flex', gap: '10px', marginTop: '20px' },
  statusBox: { flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '12px' },
  leaderboardBox: { backgroundColor: '#0f172a', padding: '15px', borderRadius: '12px', textAlign: 'left', marginBottom: '15px' },
  leaderboardEntry: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', padding: '8px 0' },
  adSlot: { margin: '15px 0', padding: '10px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px dashed #334155' },
  adInner: { height: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }
};

export default App;
