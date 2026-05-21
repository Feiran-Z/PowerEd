import React, { useRef, useEffect } from 'react';

function LogViewer({ logs }) {
  const preRef = useRef(null);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="log-viewer">
      <div className="log-viewer__header">
        <h3>Live Output</h3>
        {logs.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            {logs.length} entries
          </span>
        )}
      </div>
      <pre
        ref={preRef}
        className="log-viewer__content"
      >
        {logs.length === 0 ? (
          <span className="log-viewer__empty">Waiting for logs...</span>
        ) : (
          logs.join('')
        )}
      </pre>
    </div>
  );
}

export default LogViewer;
