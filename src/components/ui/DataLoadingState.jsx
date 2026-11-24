import './DataLoadingState.css';

function DataLoadingState({ label = 'Ma’lumotlar yuklanmoqda...' }) {
  return (
    <section
      className="data-loading"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="data-loading__message">
        <span className="data-loading__spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <div className="data-loading__skeleton" aria-hidden="true">
        <div className="data-loading__heading">
          <span className="data-loading__line data-loading__line--short" />
          <span className="data-loading__line data-loading__line--title" />
          <span className="data-loading__line data-loading__line--wide" />
        </div>
        <div className="data-loading__grid">
          {[0, 1, 2].map((item) => (
            <article className="data-loading__card" key={item}>
              <span className="data-loading__image" />
              <span className="data-loading__line data-loading__line--medium" />
              <span className="data-loading__line" />
              <span className="data-loading__line data-loading__line--wide" />
              <span className="data-loading__button" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default DataLoadingState;
