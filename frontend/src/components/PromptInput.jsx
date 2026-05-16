import React from 'react';

function PromptInput({ value, onChange }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', marginBottom: 5 }}>Your prompt for the CoTEACH agent</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        style={{ width: '100%', padding: 8, fontFamily: 'monospace' }}
        placeholder="E.g., Analyze the uploaded documents and create a teaching plan in the output/ folder."
      />
    </div>
  );
}

export default PromptInput;