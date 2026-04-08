import { useState, useEffect, useRef } from 'react';
import { 
  Music, Sparkles, Loader2, PlayCircle, Info, 
  Disc, DownloadCloud, Mic, MicOff, RefreshCcw,
  Moon, Sun, Coins, Cloud, Wind, Droplets, MapPin, Search, Thermometer
} from 'lucide-react';
import './App.css';

const API_KEY = import.meta.env.VITE_SUNO_API_KEY;
const API_URL = 'https://api.sunoapi.org/api/v1';

const MODELS = [
  { value: 'V5', label: 'V5 (Latest, Best Music)' },
  { value: 'V5_5', label: 'V5.5 (Custom Voice)' },
  { value: 'V4_5ALL', label: 'V4.5-All (Better Structure)' },
  { value: 'V4_5PLUS', label: 'V4.5+ (Richer Sound)' },
  { value: 'V4_5', label: 'V4.5' },
  { value: 'V4', label: 'V4' }
];

function App() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('V5');
  const [withLyrics, setWithLyrics] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState(null);
  const [status, setStatus] = useState('');
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(null);
  const [isDark, setIsDark] = useState(false); 
  
  // Weather state
  const [cityInput, setCityInput] = useState('Fort Lauderdale');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const pollIntervalRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const fetchCredits = async () => {
    try {
      const res = await fetch(`${API_URL}/generate/credit`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      const data = await res.json();
      if (data.code === 200) {
        setCredits(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch credits', err);
    }
  };

  const fetchWeather = async (cityName) => {
    setWeatherLoading(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('City not found');
      }
      
      const { latitude, longitude, name, admin1, country } = geoData.results[0];
      
      // Fetch Weather with advanced daily metrics
      const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`);
      const weatherJson = await weatherRes.json();
      
      setWeatherData({
        name: `${name}, ${admin1 || country}`,
        temp: Math.round(weatherJson.current.temperature_2m),
        unit: weatherJson.current_units.temperature_2m,
        humidity: Math.round(weatherJson.current.relative_humidity_2m),
        wind: Math.round(weatherJson.current.wind_speed_10m),
        windUnit: weatherJson.current_units.wind_speed_10m,
        high: Math.round(weatherJson.daily.temperature_2m_max[0]),
        low: Math.round(weatherJson.daily.temperature_2m_min[0]),
        uv: weatherJson.daily.uv_index_max[0]
      });
    } catch (err) {
      console.error('Weather error:', err);
    } finally {
      setWeatherLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    fetchWeather('Fort Lauderdale');
  }, []);

  const handleCitySearch = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (cityInput.trim()) {
        fetchWeather(cityInput);
      }
    }
  };

  const startPolling = (tid) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    setStatus('PENDING');
    
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/generate/record-info?taskId=${tid}`, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        
        const data = await res.json();
        
        if (data.code === 200 && data.data) {
          const currentStatus = data.data.status;
          setStatus(currentStatus);
          
          if (data.data.response && data.data.response.sunoData) {
              setSongs(data.data.response.sunoData);
          }

          if (currentStatus === 'SUCCESS') {
            clearInterval(pollIntervalRef.current);
            setIsGenerating(false);
            fetchCredits();
          } else if (
            currentStatus === 'CREATE_TASK_FAILED' || 
            currentStatus === 'GENERATE_AUDIO_FAILED' ||
            currentStatus === 'CALLBACK_EXCEPTION' ||
            currentStatus === 'SENSITIVE_WORD_ERROR'
          ) {
            clearInterval(pollIntervalRef.current);
            setIsGenerating(false);
            setError(`Generation failed: ${currentStatus}`);
            fetchCredits();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  };

  const generateMusic = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setSongs([]);
    setError('');
    setStatus('Initializing...');
    
    try {
      const res = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model,
          instrumental: !withLyrics,
          customMode: false,
          callBackUrl: "https://mymusic123.netlify.app/api/callback"
        })
      });

      const data = await res.json();

      if (data.code === 200 && data.data?.taskId) {
        setTaskId(data.data.taskId);
        startPolling(data.data.taskId);
        fetchCredits();
      } else {
        setIsGenerating(false);
        setError(data.msg || 'Failed to start generation task');
      }
    } catch (err) {
      setIsGenerating(false);
      setError(err.message || 'Network error occurred');
    }
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const getStatusText = () => {
    if (!isGenerating && status === 'SUCCESS') return 'Generation Complete!';
    switch (status) {
      case 'PENDING': return 'Waiting in queue...';
      case 'TEXT_SUCCESS': return 'Lyrics generated... crafting the melody...';
      case 'FIRST_SUCCESS': return 'First track ready, working on variations...';
      default: return status || 'Generating...';
    }
  };

  const handleDownload = (url, title) => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'song'}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="credits-badge">
          <Coins size={18} color="var(--accent)" />
          {credits !== null ? `${credits} Credits` : '...'}
        </div>
        
        {/* Weather Widget */}
        <div className="weather-widget">
          <div className="weather-search">
            <Search size={14} color="var(--icon-color)" />
            <input 
               type="text" 
               className="weather-input"
               value={cityInput}
               onChange={(e) => setCityInput(e.target.value)}
               onKeyDown={handleCitySearch}
               placeholder="Search city..."
             />
          </div>
          {weatherLoading ? (
            <div className="weather-info"><Loader2 size={16} className="generating-spinner" /> Loading...</div>
          ) : weatherData ? (
             <div className="weather-info">
               <span className="weather-location" title={weatherData.name}>
                 <MapPin size={14} color="var(--accent)" /> {weatherData.name.split(',')[0]}
               </span>
               <span className="weather-detail">
                 <Cloud size={14} color="var(--icon-color)" /> {weatherData.temp}{weatherData.unit}
               </span>
               <span className="weather-detail hidden-mobile">
                 <Thermometer size={14} color="#ef4444" /> H:{weatherData.high}° L:{weatherData.low}°
               </span>
               <span className="weather-detail hidden-mobile">
                 <Droplets size={14} color="#3b82f6" /> {weatherData.humidity}%
               </span>
               <span className="weather-detail hidden-mobile">
                 <Wind size={14} color="#10b981" /> {weatherData.wind} {weatherData.windUnit}
               </span>
               <span className="weather-detail hidden-mobile" title="UV Index">
                 <Sun size={14} color="#f59e0b" /> UV {weatherData.uv}
               </span>
             </div>
          ) : (
            <div className="weather-info" style={{color: '#ff6b6b'}}>City not found</div>
          )}
        </div>

        <button 
          className="theme-toggle" 
          onClick={() => setIsDark(!isDark)}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      <header className="header">
        <h1 className="title">
          Sonic AI <Sparkles size={36} color="var(--accent)" style={{display: 'inline', verticalAlign: 'text-bottom'}} />
        </h1>
        <p className="subtitle">Turn your ideas into studio-quality music with Suno AI.</p>
      </header>

      <main className="main-content">
        <form className="glass-panel" onSubmit={generateMusic}>
          <div className="form-group">
            <label htmlFor="prompt">What's your song idea?</label>
            <textarea 
              id="prompt"
              className="input-field"
              placeholder="e.g. A relaxing lo-fi hip hop track to study to on a rainy day..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              maxLength={500}
            />
          </div>

          <div className="controls-row">
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label htmlFor="model">AI Model</label>
              <select 
                id="model" 
                className="input-field" 
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isGenerating}
              >
                {MODELS.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div className="switch-wrapper" onClick={() => !isGenerating && setWithLyrics(!withLyrics)}>
              {withLyrics ? <Mic size={24} color="var(--accent)" /> : <MicOff size={24} color="var(--icon-color)" />}
              <span style={{ fontWeight: 600 }}>{withLyrics ? 'Include Lyrics' : 'Instrumental Only'}</span>
            </div>
          </div>

          {error && <div style={{ color: '#ef4444', marginTop: '1rem', fontSize: '0.9rem', fontWeight: '500' }}>{error}</div>}

          <button 
            type="submit" 
            className="generate-button"
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="generating-spinner" size={24} />
                Creating magic...
              </>
            ) : (
              <>
                <Music size={24} />
                Generate Music
              </>
            )}
          </button>
        </form>

        {(isGenerating || status === 'SUCCESS') && (
          <div className="glass-panel" style={{ marginTop: '0' }}>
            <div className={`status-badge ${isGenerating ? 'polling' : ''}`}>
              {isGenerating ? <RefreshCcw size={16} className="generating-spinner" /> : <Info size={16} />}
              {getStatusText()}
            </div>

            {songs.length > 0 && (
              <div className="results-grid">
                {songs.map((song) => (
                  <div key={song.id} className="song-card">
                    <div className="cover-art-container">
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt="Cover art" className="cover-art" />
                      ) : (
                        <Disc size={64} color="var(--icon-color)" style={{opacity: 0.5}} />
                      )}
                    </div>
                    
                    <div className="song-info">
                      <h3 className="song-title">{song.title || 'Untitled Track'}</h3>
                      <div className="song-tags">{song.tags || (withLyrics ? 'With Vocals' : 'Instrumental')}</div>
                      
                      {song.audioUrl ? (
                         <audio 
                           className="audio-player" 
                           controls 
                           src={song.audioUrl}
                         />
                      ) : (
                         <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Audio processing...
                         </div>
                      )}

                      <div className="action-buttons">
                        <button 
                          className="action-btn"
                          onClick={() => handleDownload(song.audioUrl, song.title)}
                          disabled={!song.audioUrl}
                        >
                          <DownloadCloud size={18} /> Download
                        </button>
                        {song.streamAudioUrl && (
                          <a 
                            className="action-btn"
                            href={song.streamAudioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ textDecoration: 'none' }}
                          >
                            <PlayCircle size={18} /> Stream
                          </a>
                        )}
                      </div>

                      {song.prompt && withLyrics && (
                        <div className="lyrics-container">
                          <strong>Lyrics:</strong><br />
                          {song.prompt}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ marginTop: 'auto', paddingTop: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
        Version 0.2
      </footer>
    </div>
  );
}

export default App;
