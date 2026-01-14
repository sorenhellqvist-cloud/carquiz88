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
  const [gameState, setGameState] = useState('card_register'); // Startar med registreringskortet
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

  const handleRegisterDone = async () => {
    let targetLevel = 1;
    if (user) {
      const { data } = await supabase.from('leaderboard').select('*').eq('alias', user).single();
      if (data) {
        targetLevel = data.current_level;
        setScore(data.total_score);
      }
    }
    setLevel(targetLevel);
    setGameState('card_level_info'); // Logik: Gå till informationskortet
  };

  const startPlaying = () => {
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
      else if (diff <= 2) points = 50; // Förenklad logik för test
      else isMiss = true;
    }

    if (isMiss && level >= 2) {
      setMistakes(prev => prev + 1);
      if (mistakes + 1 >= 3) {
        setGameState('failed');
        setTimerActive(false);
        return;
      }
    }
    setScore(score + points);
    setFeedback({ isCorrect: !isMiss, details: `Det var en ${currentCar.year} ${currentCar.make}.` });
  };

  const handleNext = async () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      setGameState('card_ad'); // Logik: Visa annonskortet efter nivåslut
    }
  };

  // --- KORT-VYER ---

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

  if (gameState === 'card_register') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2>Välkommen!</h2>
          <div style={styles.infoBox}>
            <p>Välj ett alias för att spara dina poäng.</p>
            <p style={{fontSize: '12px'}}>E-post är valfritt för vinstkontakt.</p>
          </div>
          <div style={styles.loginForm}>
            <input placeholder="Alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
            <input placeholder="E-post" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
            <button onClick={handleRegisterDone} style={styles.primaryButton}>GÅ VIDARE</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'card_level_info') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2>Nivå {level}</h2>
          <div style={styles.infoBox}>
            <p><strong>Regler:</strong> {level === 1 ? "Gissa märket på bilen." : "Gissa rätt årtal med slidern."}</p>
            <p>Du har 25 frågor framför dig.</p>
          </div>
          <button onClick={startPlaying} style={styles.primaryButton}>STARTA SPEL</button>
        </div>
      </div>
    );
  }

  if (gameState === 'card_ad') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2 style={{color: '#22c55e'}}>NIVÅ KLARAD!</h2>
          <div style={styles.googleAdWrapper}>REKLAMPLATS</div>
          <button onClick={() => { setLevel(level + 1); setGameState('card_level_info'); }} style={styles.primaryButton}>NÄSTA NIVÅ</button>
        </div>
      </div>
    );
  }

  if (gameState === 'failed') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: '#ef4444'}}>GAME OVER</h1>
          <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
        </div>
      </div>
    );
  }

  const currentCar = questions[currentQuestion];
  if (!currentCar) return <div style={styles.appWrapper}>Laddar...</div>;

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
              <button onClick={() => handleAnswer()} style={styles.primaryButton}>GISSÅ ÅR</button>
            </div>
          )
        ) : (
          <div style={styles.feedbackCard}>
            <p>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: '#f8fafc', padding: '20px' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  infoBox: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px', textAlign: 'left' },
  input: { width: '100%', padding: '15px', borderRadius: '10px', marginBottom: '10px', boxSizing: 'border-box' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' },
  loginForm: { display: 'flex', flexDirection: 'column' }, // Logik: Staplar fält vertikalt
  imageContainer: { width: '100%', aspectRatio: '4/3', marginBottom: '20px' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' },
  boneButton: { padding: '15px', backgroundColor: '#f5f5f0', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  sliderContainer: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '10px' },
  yearDisplay: { fontSize: '32px', marginBottom: '10px' },
  slider: { width: '100%', marginBottom: '10px' },
  googleAdWrapper: { height: '200px', backgroundColor: '#0f172a', border: '1px dashed #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' },
  feedbackCard: { padding: '20px', backgroundColor: '#1e293b', borderRadius: '10px' }
};

export default App;
