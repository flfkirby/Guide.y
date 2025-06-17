import { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('Trafalgar Square, London');
  const [profile, setProfile] = useState('loves local, cheap eats');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');

    const payload = {
      message,
      location,
      profile
    };

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setResponse('Something went wrong 😕');
    }

    setLoading(false);
  };

  return (
    <div className="app">
      <h1>guide.y</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask your guide anything..."
        />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
        />
        <input
          type="text"
          value={profile}
          onChange={(e) => setProfile(e.target.value)}
          placeholder="Profile"
          style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      <div className="response">
        <p style={{ color: 'black' }}>{response}</p>
      </div>
    </div>
  );
}

export default App;
