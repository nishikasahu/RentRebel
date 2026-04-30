import ClauseCard from './ClauseCard';

function ResultPanel({ results, summary, isAnalyzing, extractedText, audioTranscript, analysisSource }) {
  return (
    <section className="card result-card">
      <div className="card-header">
        <div>
          <p className="section-label">Results</p>
          <h2>
            Agreement audit
            <span className="source-chip">Source: {analysisSource || 'Text input'}</span>
          </h2>
        </div>
      </div>

      <div className="result-meta stats-grid">
        <div className="stat-card total">
          <p className="meta-label">Total clauses</p>
          <p className="stat-number">{summary.totalClauses}</p>
        </div>
        <div className="stat-card violations">
          <p className="meta-label">Violations</p>
          <p className="stat-number">{summary.violations}</p>
        </div>
        <div className="stat-card cautions">
          <p className="meta-label">Cautions</p>
          <p className="stat-number">{summary.cautions}</p>
        </div>
        <div className="stat-card ok">
          <p className="meta-label">OK</p>
          <p className="stat-number">{summary.ok}</p>
        </div>
      </div>

      <div className="document-view">
        <div className="document-header">
          <span>Submitted input</span>
          <span className="status-pill muted">Preview</span>
        </div>
        <p className="document-text">{extractedText}</p>

        {audioTranscript ? (
          <div className="preview-block">
            <h4>Audio Transcript</h4>
            <p>{audioTranscript}</p>
          </div>
        ) : null}
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
          {results.map((item, index) => (
            <ClauseCard key={`${item.clause_text || 'clause'}-${index}`} clause={item} />
          ))}
        </div>
      ) : null}

      {!isAnalyzing && results.length === 0 ? (
        <div className="empty-state">
          <p>No clauses analyzed yet.</p>
          <span>Run the analyzer to see flagged clauses and remedies here.</span>
        </div>
      ) : null}
    </section>
  );
}

export default ResultPanel;