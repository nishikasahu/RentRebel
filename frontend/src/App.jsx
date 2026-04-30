import { useEffect, useMemo, useState } from 'react';
import Header from './components/Header';
import SplashScreen from './components/SplashScreen';
import InputPanel from './components/InputPanel';
import ResultPanel from './components/ResultPanel';

const ANALYZE_URL = 'http://localhost:8000/analyze/';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFade(true), 4200);
    const t2 = setTimeout(() => setShowSplash(false), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ totalClauses: 0, violations: 0, cautions: 0, ok: 0 });
  const [error, setError] = useState('');
  const [analysisSource, setAnalysisSource] = useState('');

  useEffect(() => {
    if (error && (query.trim() || selectedFile || audioBlob)) {
      setError('');
    }
  }, [query, selectedFile, audioBlob, error]);

  const inputSummary = useMemo(() => {
    if (audioBlob) {
      return 'Audio recording ready for backend transcription and audit.';
    }

    if (selectedFile) {
      return `Uploaded file: ${selectedFile.name}`;
    }

    if (query.trim()) {
      return query.trim();
    }

    return 'Awaiting input';
  }, [query, selectedFile, audioBlob]);

  const handleClearInput = () => {
    setQuery('');
    setSelectedFile(null);
    setAudioBlob(null);
    setAudioTranscript('');
    setResults([]);
    setSummary({ totalClauses: 0, violations: 0, cautions: 0, ok: 0 });
    setAnalysisSource('');
    setError('');
  };

  const handleAnalyze = async () => {
    const hasText = Boolean(query.trim());
    const hasFile = Boolean(selectedFile);
    const hasAudio = Boolean(audioBlob);
    const hasInput = hasText || hasFile || hasAudio;

    if (!hasInput) {
      setError('Add text, a file, or audio before analyzing.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResults([]);
    setSummary({ totalClauses: 0, violations: 0, cautions: 0, ok: 0 });

    try {
      let response;

      if (hasAudio) {
        setAnalysisSource('Recorded audio');
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');

        response = await fetch('http://localhost:8000/ingest/audio', {
          method: 'POST',
          body: formData,
        });
      } else if (hasFile) {
        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
        setAnalysisSource(isPdf ? `Uploaded PDF: ${selectedFile.name}` : `Uploaded image: ${selectedFile.name}`);

        const formData = new FormData();
        formData.append('file', selectedFile);

        response = await fetch(isPdf ? 'http://localhost:8000/ingest/pdf' : 'http://localhost:8000/ingest/image', {
          method: 'POST',
          body: formData,
        });
      } else {
        setAnalysisSource('Text input');

        response = await fetch(ANALYZE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: query.trim() }),
        });
      }

      if (!response.ok) {
        throw new Error(`Analysis failed (${response.status})`);
      }

      const data = await response.json();
      const safeResults = Array.isArray(data?.results) ? data.results : [];

      setSummary({
        totalClauses: Number(data?.total_clauses) || safeResults.length,
        violations: Number(data?.violations) || 0,
        cautions: Number(data?.cautions) || 0,
        ok: Number(data?.ok) || 0,
      });
      setResults(safeResults);

      if (!safeResults.length) {
        setError('Analysis completed, but no clause results were returned.');
      }
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Unable to analyze agreement right now.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      {showSplash ? <SplashScreen fade={splashFade} /> : null}

      <main className="app-frame">
        <Header />
        
        <section className="content-grid">
          <InputPanel
            query={query}
            setQuery={setQuery}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
            audioTranscript={audioTranscript}
            setAudioTranscript={setAudioTranscript}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            onClearInput={handleClearInput}
            error={error}
          />

          <ResultPanel
            results={results}
            summary={summary}
            isAnalyzing={isAnalyzing}
            extractedText={inputSummary}
            audioTranscript={audioTranscript}
            analysisSource={analysisSource}
          />
        </section>
      </main>
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-line1">RentRebel · AI-powered rental agreement analysis</div>
          <div className="footer-line2">Powered by Multi-Modal Graph RAG · Karnataka Rent Act 2025 · Not legal advice</div>
        </div>
      </footer>
    </div>
  );
}

export default App;