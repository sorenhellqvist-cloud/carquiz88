import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [options, setOptions] = useState([]); 
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [gameState, setGameState] = useState('loading'); 
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);
  const [feedback, setFeedback] = useState(null); 
  
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  const handleAccess = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  // Timer-logik
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('failed');
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

  // Hämta data från Supabase
  useEffect(() => {
    if (isLocked) return;
    async function fetchData() {
      const { data, error } = await supabase
        .from('cars')
        .select('year, make, model, file_name');
      
      if (error) return;

      if (data && data.length > 0) {
        const formattedData = data.map(car => ({
          ...car,
          imageUrl: supabase.storage.from('Cars88').getPublicUrl(car.file_name).data.publicUrl
        }));

        const shuffled = formattedData.sort(() => 0.5 - Math.random()).slice(0, 25);
        setQuestions(shuffled);
        setGameState('playing');
        setTimerActive(true);
      }
    }
    fetchData();
  }, [isLocked]);

  // Generera svarsalternativ (körs bara när frågan byts)
  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && !feedback) {
      const currentCar = questions[currentQuestion];
      const allMakes = [...new Set(questions.map(q => q.make))];
      
      const wrongOptions = allMakes
        .filter(make => make !== currentCar.make)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      const shuffledOptions = [currentCar.make, ...wrongOptions].sort(() => 0.5 - Math.random());
      setOptions(shuffledOptions);
    }
  }, [currentQuestion, questions, gameState, feedback]);

  const handleAnswer = (selectedMake) => {
    if (feedback) return; 

    const currentCar = questions[currentQuestion];
    const isCorrect = selectedMake === currentCar.make;
    const fullName = `${currentCar.year} ${currentCar.make} ${currentCar.model}`;

    if (isCorrect) {
      setScore(score + 1);
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 2) {
        setTimerActive(false);
        setGameState('failed');
        return;
      }
    }

    setFeedback({
      isCorrect: isCorrect,
      message: isCorrect ? "SNYGGT JOBBAT!" : "TYVÄRR FEL!",
      details: `Det var en ${fullName}`
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setTimerActive(false);
      setGameState('finished');
    }
  };

  const calculateTotalScore = () => (score * 100) + (timeLeft * 10);

  const restartGame = () => window.location.reload();

  // --- RENDERING ---

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{fontSize: '2.5rem', letterSpacing: '2px'}}>TIMEDE.SE</h1>
          <p style={{color: '#9ca3af', marginBottom: '20px'}}>VINTAGE CAR CHALLENGE</p>
          <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={handleAccess} style={styles.primaryButton}>STARTA MOTORN</button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') return <div style={styles.appWrapper}><h3>Värmer upp motorn...</h3></div>;

  if (gameState === 'failed' || gameState === 'finished') {
    const win = gameState === 'finished';
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: win ? '#22c55e' : '#ef4444', fontSize: '2.5rem'}}>{win ? 'MÅLGÅNG!' : 'GAME OVER!'}</h1>
          <div style={styles.resultCard}>
            <p>Rätt svar: <strong>{score}/25</strong></p>
            <p>Tidsbonus: <strong>{timeLeft * 10}</strong></p>
            <hr style={{margin: '15px 0', opacity: 0.1}}/>
            <h2>TOTAL POÄNG: {calculateTotalScore()}</h2>
          </div>
          <button onClick={restartGame} style={styles.primaryButton}>KÖR IGEN</button>
        </div>
      </div>
    );
  }

  const currentCar = questions[currentQuestion];

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* RETRO BENSINMÄTARE */}
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeBackground}>
            <div style={{ ...styles.gaugeNeedle, transform: `rotate(${(timeLeft / 250) * 180 - 90}deg)` }} />
            <div style={styles.needleCap} />
            <div style={styles.labelE}>E</div>
            <div style={styles.labelF}>F</div>
            <div style={styles.fuelText}>FUEL</div>
          </div>
        </div>

        {/* STATUS RAD (Check Engine & Progress) */}
        <div style={styles.statusRow}>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', letterSpacing: '1px'}}>CHECK ENGINE</div>
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '5px'}}>
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ef4444' : '#374151', boxShadow: mistakes >= 1 ? '0 0 10px #ef4444' : 'none'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ef4444' : '#374151', boxShadow: mistakes >= 2 ? '0 0 10px #ef4444' : 'none'}} />
            </div>
          </div>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', letterSpacing: '1px'}}>PROGRESS</div>
            <div style={{fontSize: '18px', fontWeight: 'bold'}}>{currentQuestion + 1}/25</div>
          </div>
        </div>

        {/* BILBILD */}
        <div style={styles.imageContainer}>
          <img key={currentCar?.file_name} src={currentCar?.imageUrl} alt="Car" style={styles.carImage} />
        </div>

        {/* SVARSALTERNATIV ELLER FEEDBACK */}
        {!feedback ? (
          <div style={styles.grid}>
            {options.map((make, index) => (
              <button key={index} onClick={() => handleAnswer(make)} style={styles.optionButton}>{make}</button>
            ))}
          </div>
        ) : (
          <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2', borderColor: feedback.isCorrect ? '#22c55e' : '#ef4444'}}>
            <h2 style={{margin: '0 0 10px 0', color: '#111827'}}>{feedback.message}</h2>
            <p style={{margin: '0 0 20px 0', color: '#374151'}}>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA FRÅGA &rarr;</button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a', padding: '10px', color: '#f9fafb', fontFamily: 'Courier New, Courier, monospace' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  
  // Retro Gauge Styles
  retroGaugeContainer: { display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '110px', position: 'relative', overflow: 'hidden', marginBottom: '10px' },
  gaugeBackground: { width: '200px', height: '200px', border: '8px solid #334155', borderRadius: '50%', position: 'relative', backgroundColor: '#000', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)' },
  gaugeNeedle: { position: 'absolute', bottom: '50%', left: '50%', width: '3px', height: '80px', backgroundColor: '#ef4444', transformOrigin: 'bottom center', transition: 'transform 1s linear', zIndex: 5 },
  needleCap: { position: 'absolute', bottom: '47%', left: '47%', width: '14px', height: '14px', backgroundColor: '#94a3b8', borderRadius: '50%', zIndex: 6, border: '2px solid #1e293b' },
  labelE: { position: 'absolute', bottom: '25%', left: '18%', color: '#ef4444', fontWeight: 'bold' },
  labelF: { position: 'absolute', bottom: '25%', right: '18%', color: '#f9fafb', fontWeight: 'bold' },
  fuelText: { position: 'absolute', top: '65%', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#64748b', letterSpacing: '3px' },

  statusRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
  statusBox: { flex: 1, backgroundColor: '#1e293b', padding: '10px', borderRadius: '12px', border: '1px solid #334155' },
  engineLight: { width: '14px', height: '14px', borderRadius: '50%', border: '1px solid #000' },
  
  imageContainer: { width: '100%', aspectRatio: '4/3', borderRadius: '15px', overflow: 'hidden', border: '4px solid #1e293b', marginBottom: '20px', backgroundColor: '#000' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  optionButton: { padding: '18px 5px', borderRadius: '10px', border: 'none', backgroundColor: '#1e293b', color: 'white', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #0f172a' },
  
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #1d4ed8' },
  input: { width: '100%', padding: '15px', marginBottom: '15px', borderRadius: '10px', border: 'none', boxSizing: 'border-box' },
  
  feedbackCard: { padding: '20px', borderRadius: '15px', border: '3px solid' },
  resultCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '15px', marginBottom: '20px' }
};

export default App;
