import ClauseCard from './ClauseCard';

function ResultPanel({ results, isAnalyzing, extractedText, analysisNote, analysisSource }) {
  return (
    <section className="card result-card">
      <div className="card-header">
        <div>
          <p className="section-label">Results</p>
          <h2>Agreement audit</h2>
        </div>
        <span className="status-pill success">Mock data enabled</span>
      </div>

      <div className="result-meta">
        <div>
          <p className="meta-label">Source</p>
          <p className="meta-value">{analysisSource || 'Awaiting input'}</p>
        </div>
        <div>
          <p className="meta-label">Mode</p>
          <p className="meta-value">{analysisNote || 'Local prototype'}</p>
        </div>
      </div>

      <div className="document-view">
        <div className="document-header">
          <span>Highlighted document</span>
          <span className="status-pill muted">Preview</span>
        </div>
        <p className="document-text">{extractedText}</p>
      </div>

      {isAnalyzing ? (
        <div className="skeleton-stack" aria-live="polite">
          <div className="skeleton-line short" />
          <div className="skeleton-line" />
          <div className="skeleton-line medium" />
        </div>
      ) : null}

      {!isAnalyzing && results.length > 0 ? (
        <div className="clause-list">
          {results.map((item) => (
            <ClauseCard key={item.clause} clause={item} />
          ))}
        </div>
      ) : null}

      {!isAnalyzing && results.length === 0 ? (
        <div className="empty-state">
          <p>No clauses analyzed yet.</p>
          <span>Run the analyzer to see red, yellow, and green findings here.</span>
        </div>
      ) : null}
    </section>
  );
}

export default ResultPanel;