import { useState } from 'react';
import './App.css';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  margin: '2rem 0',
};

function App() {
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');
  const [profile, setProfile] = useState('');
  const [interests, setInterests] = useState('');
  const [places, setPlaces] = useState([]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [walkingInfo, setWalkingInfo] = useState(null);
  const [summary, setSummary] = useState("");

  // Use Vite env variable
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    setPlaces([]);

    const payload = {
      message,
      location,
      profile: profile + (interests ? ', ' + interests : '')
    };

    try {
      const res = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.places) {
        setPlaces(data.places);
        setResponse('');
      } else if (data.error) {
        setResponse(data.error);
      } else {
        setResponse('No places found.');
      }
    } catch (err) {
      setResponse('Something went wrong 😕');
    }
    setLoading(false);
  };

  // Remove a stop from the list
  const removePlace = (idx) => {
    setPlaces((prev) => prev.filter((_, i) => i !== idx));
  };

  // Only show places with valid coordinates
  const validPlaces = places.filter(p => p.lat && p.lng);

  // Calculate map center
  const mapCenter = validPlaces.length > 0
    ? { lat: validPlaces[0].lat, lng: validPlaces[0].lng }
    : { lat: 51.5074, lng: -0.1278 }; // Default: London

  // Finalize the route
  const finalizeRoute = async () => {
    setFinalized(true);
    // Call backend for walking distances
    try {
      const res = await fetch('http://localhost:5000/walking_distances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ places })
      });
      const data = await res.json();
      setWalkingInfo(data);
    } catch (err) {
      setWalkingInfo({ error: 'Could not calculate walking distances.' });
    }
  };

  // Call backend for route summary
  const getRouteSummary = async () => {
    try {
      const res = await fetch('http://localhost:5000/route_summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_info: `${message} | Location: ${location} | Profile: ${profile}${interests ? ', ' + interests : ''}`,
          places: validPlaces,
          walking_info: walkingInfo
        })
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummary('Could not generate summary.');
    }
  };

  return (
    <div className="app">
      <h1>guide.y</h1>
      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div>
            <label>Where are you?</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter your location"
              style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
              required
            />
            <button type="button" onClick={nextStep}>Next</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <label>Your preferences</label>
            <input
              type="text"
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
              placeholder="e.g. loves local, cheap eats"
              style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={prevStep}>Back</button>
              <button type="button" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <label>Any interests or must-sees?</label>
            <input
              type="text"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="e.g. art, history, coffee shops"
              style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={prevStep}>Back</button>
              <button type="button" onClick={nextStep}>Next</button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <label>What do you want to ask your guide?</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask your guide anything..."
              style={{ width: '100%', marginBottom: '1rem', padding: '1rem', fontSize: '1rem' }}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={prevStep}>Back</button>
              <button type="submit" disabled={loading}>
                {loading ? 'Thinking...' : 'Find My Route'}
              </button>
            </div>
          </div>
        )}
      </form>
      <div className="response">
        {response && <p style={{ color: 'black' }}>{response}</p>}
        {validPlaces.length > 0 && (
          <div>
            <h2>Recommended Places</h2>
            <ul>
              {validPlaces.map((place, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>
                    <strong>{place.name}</strong>
                    <span> — ({place.lat.toFixed(5)}, {place.lng.toFixed(5)})</span>
                  </span>
                  {!finalized && (
                    <button style={{ marginLeft: '1rem' }} onClick={() => removePlace(idx)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!finalized && (
              <button onClick={finalizeRoute} style={{ marginTop: '1rem' }}>
                Finalize Route
              </button>
            )}
            {isLoaded && (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={13}
              >
                {validPlaces.map((place, idx) =>
                  <Marker
                    key={idx}
                    position={{ lat: place.lat, lng: place.lng }}
                    label={(idx + 1).toString()}
                  />
                )}
              </GoogleMap>
            )}
            {finalized && walkingInfo && (
              <div style={{ marginTop: '1rem' }}>
                <h3>Walking Route Info</h3>
                {walkingInfo.error && <p style={{ color: 'red' }}>{walkingInfo.error}</p>}
                {walkingInfo.segments && (
                  <ul>
                    {walkingInfo.segments.map((seg, idx) => (
                      <li key={idx}>
                        {seg.from} → {seg.to}: {seg.text}
                      </li>
                    ))}
                  </ul>
                )}
                {walkingInfo.total_distance !== undefined && (
                  <p><strong>Total distance:</strong> {Math.round(walkingInfo.total_distance / 1000 * 10) / 10} km</p>
                )}
                <button style={{ marginTop: '1rem' }} onClick={getRouteSummary}>
                  Summarise My Day
                </button>
                {summary && (
                  <div style={{ marginTop: '1rem', background: '#f9f9f9', padding: '1rem', borderRadius: '8px' }}>
                    <h3>Day Summary</h3>
                    <p>{summary}</p>
                  </div>
                )}
              </div>
            )}
            {finalized && !walkingInfo && <p style={{ color: 'green', marginTop: '1rem' }}>Route finalized!</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
