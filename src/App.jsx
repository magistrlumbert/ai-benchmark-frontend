import React, { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

function App() {
  const [screen, setScreen] = useState('profile');
  const [profile, setProfile] = useState({
    org_type: '',
    size_range: '',
    role: '',
    user_id: 'konstantin_test_' + Date.now().toString().slice(-6), // unique per session
  });
  const [heatmapData, setHeatmapData] = useState([]);
  const [composite, setComposite] = useState(null);
  const [comparison, setComparison] = useState({ current: null, previous: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const submitProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await axios.post(`${API_BASE}/heatmap`, profile, {
        headers: { 'Content-Type': 'application/json' },
      });

      setHeatmapData(res.data.heatmap_data || []);
      setComposite(res.data.composite_score || null);

      // Get comparison (previous benchmark)
      const compRes = await axios.get(`${API_BASE}/compare/${profile.user_id}`);
      setComparison(compRes.data);

      setScreen('heatmap');
    } catch (err) {
      console.error('Request failed:', err);
      setError(
        err.response?.data?.detail ||
        err.message ||
        'Failed to load data. Check backend connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00C853'; // green
    if (score >= 50) return '#FFEB3B'; // yellow
    if (score >= 30) return '#FF9800'; // orange
    return '#F44336'; // red
  };

  const goBack = () => {
    setScreen('profile');
    // Optional: reset data if you want fresh start each time
    // setHeatmapData([]);
    // setComposite(null);
    // setComparison({ current: null, previous: null });
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      {screen === 'profile' ? (
        <div>
          <h1>AI Readiness Benchmark {API_BASE}</h1>
          <p style={{ color: '#555', marginBottom: '32px' }}>
            Select your organization and role to see personalized results.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
            <input
              name="org_type"
              placeholder="Organization Type (e.g., Law Firm)"
              value={profile.org_type}
              onChange={handleChange}
              style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <input
              name="size_range"
              placeholder="Size Range (e.g., Small, Medium, Large)"
              value={profile.size_range}
              onChange={handleChange}
              style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <input
              name="role"
              placeholder="Your Role (e.g., CTO, Operations Manager)"
              value={profile.role}
              onChange={handleChange}
              style={{ padding: '12px', fontSize: '16px', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <button
              onClick={submitProfile}
              disabled={loading || !profile.org_type || !profile.size_range || !profile.role}
              style={{
                padding: '14px',
                fontSize: '18px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '16px',
              }}
            >
              {loading ? 'Loading...' : 'Generate Heat Map'}
            </button>
          </div>

          {error && <p style={{ color: 'red', marginTop: '16px' }}>{error}</p>}
        </div>
      ) : (
        <div>
          <h1>AI Readiness Heat Map</h1>

          <div style={{ marginBottom: '24px' }}>
            <p><strong>Composite Score:</strong> {composite !== null ? composite.toFixed(1) : '—'}</p>
            <p>
              <strong>Comparison:</strong>{' '}
              {comparison.current !== null ? comparison.current.toFixed(1) : '—'}{' '}
              {comparison.previous !== null && `(previous: ${comparison.previous.toFixed(1)})`}
            </p>
          </div>

          {error && <p style={{ color: 'red' }}>{error}</p>}

          {heatmapData.length === 0 ? (
            <p>No data available for this profile.</p>
          ) : (
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '16px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#1976d2', color: 'white' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Workflow</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Score</th>
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((item, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '12px' }}>{item.workflow}</td>
                    <td style={{ padding: '12px' }}>{item.category}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '16px',
                          backgroundColor: getScoreColor(item.score),
                          color: 'white',
                          fontWeight: 'bold',
                        }}
                      >
                        {item.score.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            onClick={goBack}
            style={{
              marginTop: '32px',
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#757575',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Back to Profile
          </button>
        </div>
      )}
    </div>
  );
}

export default App;