import FileUpload from './FileUpload';
import AudioRecorder from './AudioRecorder';

function InputPanel({
  query,
  setQuery,
  selectedFile,
  setSelectedFile,
  audioBlob,
  setAudioBlob,
  audioTranscript,
  setAudioTranscript,
  isAnalyzing,
  onAnalyze,
  error,
}) {
  return (
    <section className="card input-card">
      <div className="card-header">
        <div>
          <p className="section-label">Input</p>
          <h2>Review your agreement</h2>
        </div>
        <span className="status-pill muted">Text, file, or audio</span>
      </div>

      <div className="field-group">
        <label htmlFor="query" className="field-label">
          Text Input
        </label>
        <textarea
          id="query"
          className="textarea"
          placeholder="Ask about your rental agreement..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          rows={6}
        />
      </div>

      <div className="dual-grid">
        <FileUpload selectedFile={selectedFile} onFileSelect={setSelectedFile} isAnalyzing={isAnalyzing} />
        <AudioRecorder
          audioBlob={audioBlob}
          setAudioBlob={setAudioBlob}
          audioTranscript={audioTranscript}
          setAudioTranscript={setAudioTranscript}
          isAnalyzing={isAnalyzing}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <button className="analyze-button" type="button" onClick={onAnalyze} disabled={isAnalyzing} aria-busy={isAnalyzing}>
        {isAnalyzing ? (
          <>
            <span className="button-spinner" aria-hidden="true" />
            Processing...
          </>
        ) : (
          'Analyze Agreement'
        )}
      </button>
    </section>
  );
}

export default InputPanel;