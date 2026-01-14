// Version: 3.4 - Slow Start Sequence: Welcome -> Inputs -> Level Rules -> Start
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
  // Startar nu på det absolut första välkomstkortet
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
  }, []);

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
    setGameState('card_level_rules'); // Gå till regel-kortet
  };

  const startLevel = () => {
    const shuffled = [...allCars].sort(() => 0.5 - Math.random()).slice(0, 25).map(car => ({
        ...car, imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
    }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setTimerActive(true);
    setGameState('playing'); // Först NU börjar spelet
  };

  // --- KORT 1: VÄLKOMMEN ---
  if (gameState === 'card_welcome') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Välkommen till Bilquizet! 🏎️</h2>
          <div style={styles.infoBox}>
            <p>Innan vi drar igång vill vi berätta hur det funkar.</p>
            <p style={{marginTop: '10px'}}><strong>Alias:</strong> Behövs för att vi ska kunna spara dina framsteg och visa dig på topplistan.</p>
            <p style={{marginTop: '10px'}}><strong>E-post:</strong> Är helt valfritt, men bra om du vill att vi ska kunna nå dig om du vinner ett veckopris!</p>
          </div>
          <button onClick={() => setGameState('card_inputs')} style={styles.primaryButton}>JAG FÖRSTÅR, GÅ VIDARE</button>
        </div>
      </div>
    );
  }

  // --- KORT 2: INMATNING ---
  if (gameState === 'card_inputs') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Vem kör idag?</h2>
          <div style={styles.loginForm}>
            <input placeholder="Välj ditt alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
            <input placeholder="E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            <button onClick={handleAuthCheck} style={styles.primaryButton}>FORTSÄTT</button>
          </div>
        </div>
      </div>
    );
  }

  // --- KORT 3: REGLER & INFO ---
  if (gameState === 'card_level_rules') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={styles.title}>Regler för Nivå {level}</h2>
          <div style={styles.infoBox}>
            <p><strong>Mål:</strong> {level === 1 ? "Identifiera bilmärket." : "Gissa rätt årsmodell."}</p>
            <p style={{marginTop: '10px'}}><strong>Mätaren:</strong> Visar hur mycket "bränsle" (tid) du har kvar för hela nivån.</p>
            <p style={{marginTop: '10px'}}><strong>Lamporna:</strong> "Check Engine" lyser om du gissar för långt ifrån rätt svar.</p>
          </div>
          <button onClick={startLevel} style={styles.primaryButton}>STARTA FRÅGA 1</button>
        </div>
      </div>
    );
  }

  // ... Resten av logiken (playing, failed, interstitial) från 3.3 ...
  // [Kod-blocken för playing, feedback, statusRowBottom och styles inkluderas här]
  return (
    <div style={styles.appWrapper}>
      {/* Här renderas spelsidan när gameState === 'playing' */}
      {gameState === 'playing' && (
         <div style={styles.container}>
            {/* Bild, Kontroller och Status-mätare här */}
         </div>
      )}
    </div>
  );
}

const styles = {
  // Samma stilar som v3.3, men med tillägg för text-layout i infoBox
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: '#f8fafc', padding: '20px', fontFamily: 'sans-serif' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  title: { fontSize: '26px', marginBottom: '20px', fontWeight: 'bold' },
  infoBox: { backgroundColor: '#1e293b', padding: '25px', borderRadius: '15px', marginBottom: '25px', textAlign: 'left', lineHeight: '1.6' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', border: 'none', fontSize: '16px' },
  primaryButton: { width: '100%', padding: '18px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
  loginForm: { display: 'flex', flexDirection: 'column' }
};

export default App;
