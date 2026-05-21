import React from 'react';

function PromptInput({ value, onChange }) {
  return (
    <div className="prompt-input">
      <textarea
        className="prompt-input__textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder="E.g., Analyze the uploaded documents and create a unit plan and lesson plans in the output/ folder."
      />
    </div>
  );
}

export default PromptInput;
