import { useEffect, useMemo, useRef, useState } from 'react';
import Header from './components/Header';
import InputPanel from './components/InputPanel';
import ResultPanel from './components/ResultPanel';

const mockClauses = [
  {
    clause: 'Security deposit is 10 months rent',
    status: 'red',
    explanation: 'Exceeds legal limit of 2 months under Karnataka Rent rules',
  },
  {
    clause: 'Landlord can enter anytime without notice',
    status: 'red',
    explanation: 'Violates tenant privacy rules requiring notice',
  },
  {
    clause: 'Painting charges of ₹25,000',
    status: 'yellow',
    explanation: 'May be excessive depending on agreement terms',
  },
];

function App() {
  const analysisTimerRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const [analysisNote, setAnalysisNote] = useState('');
  const [analysisSource, setAnalysisSource] = useState('');

  useEffect(() => {
    if (error && (query.trim() || selectedFile || audioBlob)) {
      setError('');
    }
  }, [query, selectedFile, audioBlob, error]);

  useEffect(() => {
    if (!results.length) {
      setAnalysisNote('');
      setAnalysisSource('');
      return;
    }

    if (selectedFile) {
      setAnalysisSource(selectedFile.name);
    } else if (audioBlob) {
      setAnalysisSource('Recorded audio');
    } else if (query.trim()) {
      setAnalysisSource('Text query');
    }

    setAnalysisNote('Mock analysis complete. Backend integration can be wired to POST /analyze later.');
  }, [results, selectedFile, audioBlob, query]);

  useEffect(() => {
    return () => {
      window.clearTimeout(analysisTimerRef.current);
    };
  }, []);

  const extractedText = useMemo(() => {
    const sourceText = query.trim() || 'Uploaded document text will appear here after extraction.';
    if (!results.length) {
      return sourceText;
    }

    const clausePreview = results.map((item) => item.clause).join(' • ');
    return `${sourceText}\n\nHighlighted clauses: ${clausePreview}`;
  }, [query, results]);

  const handleAnalyze = () => {
    const hasInput = query.trim() || selectedFile || audioBlob;

    if (!hasInput) {
      setError('Add text, a file, or audio before analyzing.');
      return;
    }

    setError('');
    setIsAnalyzing(true);
    setResults([]);

    analysisTimerRef.current = window.setTimeout(() => {
      setResults(mockClauses);
      setIsAnalyzing(false);
    }, 1400);
  };

  return (
    <div className="app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

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
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            error={error}
          />

          <ResultPanel
            results={results}
            isAnalyzing={isAnalyzing}
            extractedText={extractedText}
            analysisNote={analysisNote}
            analysisSource={analysisSource}
          />
        </section>
      </main>
    </div>
  );
}

export default App;