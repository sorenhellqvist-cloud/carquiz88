// Version: 2.7 - Persistent Database Sync (Save & Resume)
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

  // 1. Ladda biblioteket vid start
  useEffect(() => {
    async function fetchAllCars() {
      const { data, error } = await supabase.from('cars').select('*');
      if (!error && data) setAllCars(data);
    }
    fetchAllCars();
  }, []);

  // 2. SPARA FRAMSTEG TILL SUPABASE
  const saveProgress = async (finalScore, nextLevel) => {
    if (!user) return; // Spara bara om alias finns

    const { error } = await supabase
      .from('leaderboard')
      .upsert({ 
        alias: user, 
        email: email, 
        current_level: nextLevel, 
        total_score: finalScore,
        last_played: new Date() 
      }, { onConflict: 'alias' }); // Uppdaterar om alias redan finns

    if (error) console.error("Kunde inte spara framsteg:", error);
  };

  // 3. KOLLA SPARADE FRAMSTEG VID START
  const handleStartGame = async () => {
    let targetLevel = 1;

    if (user) {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('current_level, total_score')
        .eq('alias', user)
        .single();

      if (data && !error) {
        targetLevel = data.current_level;
        setScore(data.total_score); // Fortsätt med tidigare poäng
        console.log(`Välkommen tillbaka ${user}! Laddar nivå ${targetLevel}`);
      }
    }
    prepareLevel(targetLevel);
  };

  const prepareLevel = (targetLevel) => {
    const shuffled = [...allCars]
      .sort(() => 0.5 - Math.random())
      .slice(0, 25)
      .map(car => ({
        ...car,
        imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
      }));
    setQuestions(shuffled);
    setCurrentQuestion(0);
    setMistakes(0);
    setLevel(targetLevel);
    setTimeLeft(targetLevel === 1 ? 250 : 225); //
    setGameState('playing');
    setTimerActive(true);
    setFeedback(null);
  };

  // ... (Timer-logik och Nivå 1 Options-logik från v2.6 behålls)

  const handleAnswer = (selected) => {
    if (feedback) return;
    const currentCar = questions[currentQuestion];
    let pointsEarned = 0;
    let isMiss = false;

    if (level === 1) {
      if (selected === currentCar.make) pointsEarned = 100;
      else isMiss = true;
    } else {
      const diff = Math.abs(parseInt(sliderValue) - currentCar.year);
      if (diff === 0) pointsEarned = 100; //
      else if (diff === 1) pointsEarned = 50; //
      else if (diff === 2) pointsEarned = 25; //
      else isMiss = true;
    }

    if (isMiss) {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 3) { //
        setFailReason("MOTORRAS!");
        setGameState('failed');
        setTimerActive(false);
        return;
      }
    }

    setScore(score + pointsEarned);
    setFeedback({
      isCorrect: !isMiss,
      message: isMiss ? "MISS!" : (pointsEarned === 100 ? "EXAKT!" : "NÄRA!"),
      details: `Det var en ${currentCar.year} ${currentCar.make}. +${pointsEarned}p`
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      const finalScoreForLevel = score + (timeLeft * 10);
      setScore(finalScoreForLevel);
      saveProgress(finalScoreForLevel, level + 1); // Spara framsteg automatiskt!
      setGameState('interstitial');
    }
  };

  // --- RENDERING (Samma struktur som v2.6 men med nya handleStartGame) ---
  if (isLocked) { /* ... (Låsskärm) ... */ }

  if (gameState === 'auth') {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h2>Välkommen till Bilquizet! 🏎️</h2>
          <div style={styles.infoBox}>
            <p style={{fontSize: '14px'}}>Ange ditt alias för att spara dina framsteg och tävla om veckopriser!</p>
          </div>
          <input placeholder="Ditt Alias" value={user} onChange={(e) => setUser(e.target.value)} style={styles.input} />
          <input placeholder="E-post (valfritt)" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} />
          <button onClick={handleStartGame} style={styles.primaryButton}>STARTA / FORTSÄTT</button>
        </div>
      </div>
    );
  }

  // ... (Resten av vyer: interstitial, failed, playing behålls från v2.6)
  return ( /* Spel-UI */ null );
}

const styles = {
    // ... (Samma stilar som v2.6)
};

export default App;
