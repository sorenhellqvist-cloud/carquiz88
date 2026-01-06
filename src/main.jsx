function App() {
  const [password, setPassword] = useState("");
  const [isLocked, setIsLocked] = useState(true);

  // Du kan ändra 'hemligt' till vad du vill
  const handleAccess = () => {
    if (password === 'hemligt') {
      setIsLocked(false);
    } else {
      alert("Fel lösenord!");
    }
  };

  if (isLocked) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
        <h1>Timede.se är under konstruktion 🛠️</h1>
        <p>Ange lösenord för att förhandstitta på Carquiz:</p>
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
        />
        <button onClick={handleAccess} style={{ marginLeft: '10px', padding: '10px 20px' }}>
          Lås upp
        </button>
      </div>
    );
  }

  // ... Resten av din nuvarande kod (useEffect, quiz-logik osv)
  return (
    <div className="App">
       {/* Din quiz-kod här */}
    </div>
  );
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
