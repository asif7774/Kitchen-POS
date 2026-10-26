import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/auth";

const PinPad: React.FC = () => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleDigit = useCallback((digit: string) => {
    setPin((prev) => {
      if (prev.length >= 4) {
        return prev;
      }
      return prev + digit;
    });
    setError(false);
  }, []);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    const success = await login(pin);
    if (success) {
      navigate("/tables");
    } else {
      setError(true);
      setPin("");
    }
  }, [login, navigate, pin]);

  React.useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => {
        void handleSubmit();
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [pin, handleSubmit]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keypresses if the user is typing in an input field (e.g. inside a modal)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key >= "0" && e.key <= "9") {
        handleDigit(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Enter" && pin.length > 0) {
        void handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleDigit, handleBackspace, handleSubmit, pin.length]);

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white/50 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/20">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Enter your PIN to continue
        </p>

        <div className="flex justify-center gap-4 mb-8 h-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > i
                  ? "bg-emerald-500 scale-100 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "bg-gray-200 scale-75"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-center mb-4 text-sm bg-red-50 py-2 rounded-lg font-medium animate-in slide-in-from-top-2">
            Incorrect PIN. Please try again.
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              onClick={() => {
                handleDigit(digit);
              }}
              className="h-16 rounded-2xl bg-white/80 hover:bg-white text-2xl font-semibold text-gray-800 shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95 border border-gray-100 backdrop-blur-sm"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-white/80 hover:bg-white text-gray-600 shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95 border border-gray-100 flex items-center justify-center backdrop-blur-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
              />
            </svg>
          </button>
          <button
            onClick={() => {
              handleDigit("0");
            }}
            className="h-16 rounded-2xl bg-white/80 hover:bg-white text-2xl font-semibold text-gray-800 shadow-sm transition-all hover:scale-105 hover:shadow-md active:scale-95 border border-gray-100 backdrop-blur-sm"
          >
            0
          </button>
          <button
            onClick={() => {
              void handleSubmit();
            }}
            disabled={pin.length === 0}
            className="h-16 rounded-2xl bg-brand-gradient hover:opacity-90 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinPad;
