import { useState } from "react";

interface Props {
  onSubmit: (key: string) => void;
}

export default function ApiKeyPrompt({ onSubmit }: Props) {
  const [key, setKey] = useState("");

  return (
    <div className="api-key-prompt">
      <h2>Gemini API Key</h2>
      <p>Enter your Gemini API key to get started. It won't be stored permanently.</p>
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
    </div>
  );
}
