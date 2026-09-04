import { useState, type FormEvent } from "react";
import { ADMIN_PASSWORD, UNLOCK_STORAGE } from "../config/authConfig";

const STORAGE_KEY = "jew_admin_unlocked";

function getStorage(): Storage {
  return UNLOCK_STORAGE === "local" ? localStorage : sessionStorage;
}

function isUnlocked(): boolean {
  return getStorage().getItem(STORAGE_KEY) === "true";
}

interface Props {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(isUnlocked());
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      getStorage().setItem(STORAGE_KEY, "true");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="gate">
      <form className="gate-card" onSubmit={handleSubmit}>
        <h1>Jensi Electrical Works</h1>
        <p>Enter the admin password to open the bill generator.</p>
        <input
          type="password"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
        />
        {error && <p className="gate-error">Incorrect password — try again.</p>}
        <button type="submit" className="btn btn-generate">
          Unlock
        </button>
      </form>
    </div>
  );
}
