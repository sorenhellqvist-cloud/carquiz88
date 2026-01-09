// Version: 1.1 - Chrome Gauge & Bone Buttons Update
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
  const [failReason, setFailReason] = useState("");
  
  const [timeLeft, setTimeLeft] = useState(250); 
  const [timerActive, setTimerActive] = useState(false);

  const handleAccess = () => {
    if (password === 'bil88') setIsLocked(false);
    else alert("Fel lösenord!");
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setFailReason("BENSINSTOPP!");
      setGameState('failed');
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft, gameState]);

  useEffect(() => {
    if (isLocked) return;
    async function fetchData() {
      const { data, error } = await supabase.from('cars').select('year, make, model, file_name');
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

  useEffect(() => {
    if (questions.length > 0 && gameState === 'playing' && !feedback) {
      const currentCar = questions[currentQuestion];
      const allMakes = [...new Set(questions.map(q => q.make))];
      const wrongOptions = allMakes
        .filter(make => make !== currentCar.make)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setOptions([currentCar.make, ...wrongOptions].sort(() => 0.5 - Math.random()));
    }
  }, [currentQuestion, questions, gameState, feedback]);

  const handleAnswer = (selectedMake) => {
    if (feedback) return; 
    const currentCar = questions[currentQuestion];
    const isCorrect = selectedMake === currentCar.make;

    if (isCorrect) setScore(score + 1);
    else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      if (newMistakes >= 2) {
        setFailReason("MOTORRAS!");
        setTimerActive(false);
        setGameState('failed');
        return;
      }
    }
    setFeedback({
      isCorrect,
      message: isCorrect ? "SNYGGT JOBBAT!" : "TYVÄRR FEL!",
      details: `Det var en ${currentCar.year} ${currentCar.make} ${currentCar.model}`
    });
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentQuestion + 1 < questions.length) setCurrentQuestion(currentQuestion + 1);
    else {
      setTimerActive(false);
      setGameState('finished');
    }
  };

  if (isLocked) {
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{fontSize: '2.5rem', textShadow: '2px 2px #000'}}>TIMEDE.SE</h1>
          <input type="password" placeholder="Lösenord" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} />
          <button onClick={handleAccess} style={styles.primaryButton}>STARTA MOTORN</button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') return <div style={styles.appWrapper}><h3>Hämtar fordon...</h3></div>;

  if (gameState === 'failed' || gameState === 'finished') {
    const win = gameState === 'finished';
    return (
      <div style={styles.appWrapper}>
        <div style={styles.container}>
          <h1 style={{color: win ? '#22c55e' : '#ef4444'}}>{win ? 'MÅLGÅNG!' : 'GAME OVER!'}</h1>
          <div style={styles.resultCard}>
            {!win && <p style={{color: '#f87171', fontWeight: 'bold'}}>{failReason}</p>}
            <p>Rätt svar: {score}/25</p>
            <h2>POÄNG: {win ? (score * 100 + timeLeft * 10) : (score * 100)}</h2>
          </div>
          <button onClick={() => window.location.reload()} style={styles.primaryButton}>FÖRSÖK IGEN</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        
        {/* RETRO GAUGE HÖGST UPP */}
        <div style={styles.retroGaugeContainer}>
          <div style={styles.gaugeChromeRing}>
            <div style={styles.gaugeBackground}>
              <div style={{ ...styles.gaugeNeedle, transform: `translateX(-50%) rotate(${(timeLeft / 250) * 180 - 90}deg)` }} />
              <div style={styles.needleCap} />
              <div style={styles.labelE}>E</div>
              <div style={styles.labelF}>F</div>
              <div style={styles.fuelText}>FUEL</div>
            </div>
          </div>
        </div>

        {/* BILBILD */}
        <div style={styles.imageContainer}>
          <img key={questions[currentQuestion]?.file_name} src={questions[currentQuestion]?.imageUrl} alt="Car" style={styles.carImage} />
        </div>

        {/* SVARSKNAPPAR (BENVITA) */}
        {!feedback ? (
          <div style={styles.grid}>
            {options.map((make, index) => (
              <button key={index} onClick={() => handleAnswer(make)} style={styles.boneButton}>{make}</button>
            ))}
          </div>
        ) : (
          <div style={{...styles.feedbackCard, backgroundColor: feedback.isCorrect ? '#dcfce7' : '#fee2e2'}}>
            <h2 style={{margin: '0 0 5px 0', color: '#111827'}}>{feedback.message}</h2>
            <p style={{margin: '0 0 15px 0', color: '#374151'}}>{feedback.details}</p>
            <button onClick={handleNext} style={styles.primaryButton}>NÄSTA FRÅGA</button>
          </div>
        )}

        {/* STATUS RAD (FLYTTAD TILL BOTTEN) */}
        <div style={styles.statusRowBottom}>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>CHECK ENGINE</div>
            <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '5px'}}>
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 1 ? '#ff0000' : '#1e293b', boxShadow: mistakes >= 1 ? '0 0 12px #ff0000' : 'none'}} />
              <div style={{...styles.engineLight, backgroundColor: mistakes >= 2 ? '#ff0000' : '#1e293b', boxShadow: mistakes >= 2 ? '0 0 12px #ff0000' : 'none'}} />
            </div>
          </div>
          <div style={styles.statusBox}>
            <div style={{fontSize: '9px', color: '#94a3b8'}}>PROGRESS</div>
            <div style={{fontSize: '20px', fontWeight: 'bold', color: '#f1f5f9'}}>{currentQuestion + 1} / 25</div>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', padding: '15px', color: '#f8fafc', fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif' },
  container: { width: '100%', maxWidth: '400px', textAlign: 'center' },
  retroGaugeContainer: { display: 'flex', justifyContent: 'center', height: '140px', position: 'relative', marginBottom: '20px' },
  gaugeChromeRing: {
    width: '210px', height: '210px', borderRadius: '50%',
    background: 'linear-gradient(145deg, #e2e8f0, #475569, #94a3b8, #cbd5e1)', 
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    boxShadow: '0 10px 20px rgba(0,0,0,0.6)',
    position: 'absolute', top: '-100px'
  },
  gaugeBackground: { 
    width: '190px', height: '190px', borderRadius: '50%', 
    backgroundColor: '#000', position: 'relative', overflow: 'hidden'
  },
  gaugeNeedle: { 
    position: 'absolute', bottom: '50%', left: '50%', width: '3px', height: '80px', 
    backgroundColor: '#ff0000', transformOrigin: 'bottom center', zIndex: '10', transition: 'transform 0.5s ease' 
  },
  needleCap: { position: 'absolute', top: '47%', left: '47%', width: '14px', height: '14px', backgroundColor: '#cbd5e1', borderRadius: '50%', zIndex: '11', border: '1px solid #000' },
  labelE: { position: 'absolute', bottom: '22%', left: '15%', color: '#ef4444', fontWeight: 'bold', fontSize: '18px' },
  labelF: { position: 'absolute', bottom: '22%', right: '15%', color: '#f8fafc', fontWeight: 'bold', fontSize: '18px' },
  fuelText: { position: 'absolute', top: '65%', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#475569', letterSpacing: '3px' },
  boneButton: { 
    padding: '18px 5px', borderRadius: '8px', border: '1px solid #d1d5db',
    backgroundColor: '#f5f5f0', 
    color: '#1f2937', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
    boxShadow: '0 4px 0 #d6d3d1'
  },
  statusRowBottom: { display: 'flex', gap: '15px', marginTop: '25px' },
  statusBox: { flex: 1, backgroundColor: '#0f172a', padding: '12px', borderRadius: '15px', border: '2px solid #1e293b', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' },
  engineLight: { width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #000' },
  imageContainer: { width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', border: '6px solid #1e293b', marginBottom: '20px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' },
  carImage: { width: '100%', height: '100%', objectFit: 'cover' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  primaryButton: { width: '100%', padding: '15px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' },
  input: { width: '100%', padding: '15px', marginBottom: '10px', borderRadius: '10px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155' },
  feedbackCard: { padding: '15px', borderRadius: '12px', border: '3px solid' },
  resultCard: { backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }
};

export default App;
