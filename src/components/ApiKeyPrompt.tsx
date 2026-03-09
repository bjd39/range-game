import { useState } from "react";

interface Props {
  onSubmit: (key: string) => void;
  onSkip?: () => void;
  onUnset?: () => void;
}

export default function ApiKeyPrompt({ onSubmit, onSkip, onUnset }: Props) {
  const [key, setKey] = useState("");

  return (
    <div className="api-key-prompt">
      <h2>Gemini API Key</h2>
      <p>Enter your Gemini API key to enable AI features, or skip to play without them.</p>
      <div className="api-key-row">
        <input
          type="password"
          placeholder="API key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && key.trim()) onSubmit(key.trim());
          }}
        />
        <button
          className="btn-primary"
          disabled={!key.trim()}
          onClick={() => onSubmit(key.trim())}
        >
          Set Key
        </button>
      </div>
      {onSkip && (
        <button className="btn-secondary skip-key-btn" onClick={onSkip}>
          Play without AI features
        </button>
      )}
      {onUnset && (
        <button className="btn-secondary unset-key-btn" onClick={onUnset}>
          Unset API key
        </button>
      )}
    </div>
  );
}
