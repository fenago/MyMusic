import { useState, useEffect, useRef } from 'react';
import { 
  Music, Sparkles, Loader2, PlayCircle, Info, 
  Disc, DownloadCloud, Mic, MicOff, RefreshCcw,
  Moon, Sun, Coins
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
  const [isDark, setIsDark] = useState(false); // Default to light theme
  
  const pollIntervalRef = useRef(null);

  // Initialize theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Fetch initial credits
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

  useEffect(() => {
    fetchCredits();
  }, []);

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
            fetchCredits(); // update credits
          } else if (
            currentStatus === 'CREATE_TASK_FAILED' || 
            currentStatus === 'GENERATE_AUDIO_FAILED' ||
            currentStatus === 'CALLBACK_EXCEPTION' ||
            currentStatus === 'SENSITIVE_WORD_ERROR'
          ) {
            clearInterval(pollIntervalRef.current);
            setIsGenerating(false);
            setError(`Generation failed: ${currentStatus}`);
            fetchCredits(); // fetch credits just in case
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Poll every 5 seconds
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
        fetchCredits(); // immediate deduct check
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
