const statusMap = {
  red: { label: 'Illegal', className: 'danger' },
  yellow: { label: 'Risky', className: 'warning' },
  green: { label: 'Safe', className: 'success' },
};

function ClauseCard({ clause }) {
  const status = statusMap[clause.status] || statusMap.yellow;

  return (
    <article className={`clause-card ${status.className}`}>
      <div className="clause-head">
        <span className={`status-pill ${status.className}`}>{status.label}</span>
      </div>
      <p className="clause-text">{clause.clause}</p>
      <p className="clause-explanation">{clause.explanation}</p>
    </article>
  );
}

export default ClauseCard;