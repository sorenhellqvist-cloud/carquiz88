// Version: 2.7.1 - Login Layout Fix
if (gameState === 'auth') {
  return (
    <div style={styles.appWrapper}>
      <div style={styles.container}>
        <h2 style={{fontSize: '24px', marginBottom: '15px'}}>Välkommen till Bilquizet! 🏎️</h2>
        
        <div style={styles.infoBox}>
          <p style={{fontSize: '14px', marginBottom: '10px'}}>
            Ange alias för att spara framsteg och tävla om priser!
          </p>
          <ul style={{fontSize: '12px', textAlign: 'left', color: '#cbd5e1', margin: '0', paddingLeft: '20px'}}>
            <li>Rätt år: 100p | 1 år fel: 50p | 2 år fel: 25p</li>
            <li>3 missar (>2 år fel) = Game Over</li>
          </ul>
        </div>

        {/* Flex-container för att tvinga vertikal layout */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <input 
            placeholder="Ditt Alias" 
            value={user} 
            onChange={(e) => setUser(e.target.value)} 
            style={styles.input} 
          />
          <input 
            placeholder="E-post (valfritt)" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={styles.input} 
          />
          <button onClick={handleStartGame} style={styles.primaryButton}>
            STARTA / FORTSÄTT
          </button>
        </div>
      </div>
    </div>
  );
}

// Uppdaterade stilar för att säkerställa att allt ryms
const styles = {
  // ... (tidigare stilar behålls)
  container: { 
    width: '100%', 
    maxWidth: '400px', 
    textAlign: 'center',
    padding: '20px',
    boxSizing: 'border-box' // Säkerställer att padding inte ökar bredden
  },
  input: { 
    width: '100%', 
    padding: '15px', 
    borderRadius: '10px', 
    border: 'none', 
    backgroundColor: '#1e293b', 
    color: 'white',
    boxSizing: 'border-box', // Fixar så inputen inte sticker ut
    fontSize: '16px'
  },
  primaryButton: { 
    width: '100%', 
    padding: '15px', 
    backgroundColor: '#2563eb', 
    color: 'white', 
    borderRadius: '10px', 
    fontWeight: 'bold', 
    border: 'none', 
    cursor: 'pointer',
    boxSizing: 'border-box'
  }
};
