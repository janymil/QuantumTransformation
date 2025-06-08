function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111', marginBottom: '1rem' }}>
          AI Coaching Platform
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '2rem' }}>
          Document processing system operational
        </p>
        <div style={{ 
          backgroundColor: '#d4edda', 
          border: '1px solid #c3e6cb', 
          color: '#155724', 
          padding: '0.75rem 1rem', 
          borderRadius: '0.25rem' 
        }}>
          System Status: Running on Port 5000
        </div>
      </div>
    </div>
  );
}

export default App;