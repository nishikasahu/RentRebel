const statusMap = {
  violation: { label: 'Violation', className: 'danger' },
  caution: { label: 'Caution', className: 'warning' },
  ok: { label: 'OK', className: 'success' },
};

function ClauseCard({ clause }) {
  const status = statusMap[clause.verdict] || statusMap.caution;

  return (
    <article className={`clause-card ${status.className}`}>
      <div className="clause-head">
        <span className={`status-pill ${status.className}`}>{status.label}</span>
      </div>
      <p className="clause-text">{clause.clause_text || 'Clause text unavailable'}</p>
      <p className="clause-explanation">{clause.explanation || 'No explanation returned.'}</p>
      {clause.statute_cited ? <p className="clause-detail"><strong>Statute:</strong> {clause.statute_cited}</p> : null}
      {clause.tenant_right ? <p className="clause-detail"><strong>Tenant right:</strong> {clause.tenant_right}</p> : null}
      {clause.remedy ? <p className="clause-detail"><strong>Remedy:</strong> {clause.remedy}</p> : null}
    </article>
  );
}

export default ClauseCard;