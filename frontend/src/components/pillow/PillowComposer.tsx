import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import styles from "./PillowComposer.module.css";

interface PillowComposerProps {
  disabled?: boolean;
  streaming?: boolean;
  onSend: (message: string, provider?: string) => void;
}

export function PillowComposer({ disabled, streaming, onSend }: PillowComposerProps) {
  const [message, setMessage] = useState("");
  const [provider, setProvider] = useState<string>("");

  const submit = () => {
    if (!message.trim() || disabled || streaming) return;
    onSend(message, provider || undefined);
    setMessage("");
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <label>
          Provider
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
            disabled={disabled || streaming}
          >
            <option value="">Auto (Brain router)</option>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
        </label>
        {streaming && <span className={styles.live}>Streaming…</span>}
      </div>
      <div className={styles.inputRow}>
        <textarea
          rows={3}
          placeholder="Ask Pillow about Empire operations, missions, or repository state…"
          value={message}
          disabled={disabled || streaming}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <button type="button" disabled={disabled || streaming || !message.trim()} onClick={submit}>
          <SendHorizonal size={18} aria-hidden="true" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
}
