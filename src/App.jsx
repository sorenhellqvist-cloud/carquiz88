import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

const TIME_LIMIT = 250;
const MAX_QUESTIONS = 25;
const MAX_STRIKES = 2;
const STORAGE_URL = "https://mneeivmfrpacvnmssfkc.supabase.co/storage/v1/object/public/Cars88/";

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [strikes, setStrikes] = useState(0);
  const [gameState, setGameState] = useState('loading'); // loading, playing, feedback, result
  const [options, setOptions] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);

  // Hämta data från din SQL-tabell 'cars'
useEffect(() => {
    async function fetchData() {
      console.log("Försöker hämta bilar..."); // Bekräftar att funktionen körs
      const { data, error } = await supabase.from('cars').select('*');
      
      if (error) {
        console.error("Supabase-fel:", error.message); // Visar om t.ex. nyckeln är fel
        return;
      }

      if (data && data.length > 0) {
        console.log("Hämtade bilar:", data.length);
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, MAX_QUESTIONS);
        setQuestions(shuffled);
        prepareOptions(shuffled[0], data);
        setGameState('playing');
      } else {
        console.warn("Tabellen 'cars' verkar vara tom.");
      }
    }
    fetchData();
  }, []);

  // Timer-logik
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    if (timeLeft === 0) setGameState('result');
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Skapa 4 svarsalternativ (1 rätt, 3 slumpade felaktiga märken)
  const prepareOptions = (currentCar, allCars) => {
    const allMakes = [...new Set(allCars.map(c => c.make))];
    const otherMakes = allMakes.filter(m => m !== currentCar.make);
    const shuffledOthers = otherMakes.sort(() => 0.5 - Math.random()).slice(0, 3);
    const finalOptions = [...shuffledOthers, currentCar.make].sort(() => 0.5 - Math.random());
    setOptions(finalOptions);
  };

  const handleAnswer = (selectedMake) => {
    const correct = selectedMake === questions[currentIndex].make;
    setIsCorrect(correct);
    setGameState('feedback');

    if (correct) {
      setScore(prev => prev + 100);
    } else {
      setStrikes(prev => prev + 1);
      if (strikes + 1 >= MAX_STRIKES) {
        setTimeout(() => setGameState('result'), 2000);
      }
    }
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      prepareOptions(questions[nextIdx], questions);
      setGameState('playing');
    } else {
      setGameState('result');
    }
  };

  if (gameState === 'loading') return <div>Laddar bilar...</div>;

  const currentCar = questions[currentIndex];
  const timeBonus = gameState === 'result' ? (TIME_LIMIT - (TIME_LIMIT - timeLeft)) * 100 : 0;

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Bilquiz Nivå 1</h1>
      <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '20px' }}>
        <p>Tid: {timeLeft}s</p>
        <p>Poäng: {score}</p>
        <p>Fel: {strikes}/{MAX_STRIKES}</p>
      </div>

      {gameState === 'playing' || gameState === 'feedback' ? (
        <>
          <img 
            src={`${STORAGE_URL}${encodeURIComponent(currentCar.file_name)}`} 
            alt="Bil" 
            style={{ maxWidth: '100%', height: '400px', borderRadius: '8px' }} 
          />
          
          {gameState === 'playing' ? (
            <div style={{ marginTop: '20px' }}>
              {options.map(make => (
                <button key={make} onClick={() => handleAnswer(make)} style={btnStyle}>
                  {make}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: '20px', backgroundColor: isCorrect ? '#d4edda' : '#f8d7da', padding: '15px' }}>
              <h2>{isCorrect ? 'Rätt!' : 'Fel!'}</h2>
              <p>Detta är en: <strong>{currentCar.year} {currentCar.make} {currentCar.model}</strong></p>
              <button onClick={nextQuestion} style={btnStyle}>Nästa fråga</button>
            </div>
          )}
        </>
      ) : (
        <div style={{ padding: '50px' }}>
          <h2>Spel slut!</h2>
          <p>Baspoäng: {score}</p>
          {strikes < MAX_STRIKES && timeLeft > 0 ? (
            <p>Tidsbonus: {timeLeft * 100}!</p>
          ) : <p>Ingen tidsbonus (för många fel eller slut på tid)</p>}
          <h3>Total poäng: {score + (strikes < MAX_STRIKES ? timeLeft * 100 : 0)}</h3>
          <button onClick={() => window.location.reload()} style={btnStyle}>Spela igen</button>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '15px 30px',
  margin: '10px',
  fontSize: '18px',
  cursor: 'pointer',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px'
};
