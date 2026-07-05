function App() {
  return (
    <div style={{ padding: '40px', background: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', fontSize: '32px', marginBottom: '20px' }}>
        Clinic Notector Music - Test
      </h1>
      <p style={{ color: '#666', fontSize: '18px' }}>
        If you see this, React is working correctly!
      </p>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        marginTop: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#0066cc' }}>System Check:</h2>
        <ul style={{ lineHeight: '1.8' }}>
          <li>✅ React rendering</li>
          <li>✅ JavaScript working</li>
          <li>✅ Styles applying</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
