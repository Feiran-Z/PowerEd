import React, { useRef, useEffect } from 'react';

function LogViewer({ logs }) {
  const preRef = useRef(null);

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = preRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Live Output</h3>
      <pre
        ref={preRef}
        style={{
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          padding: 10,
          height: 300,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: 12,
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
      >
        {logs.length === 0 ? 'Waiting for logs...' : logs.join('')}
      </pre>
    </div>
  );
}

export default LogViewer;