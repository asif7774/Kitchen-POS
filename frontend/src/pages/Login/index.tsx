import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import Button from '../../components/atoms/button/button';

const LoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleDigit = (digit: string) => {
    setPin((prev) => prev + digit);
    setError(false);
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleSubmit = async () => {
    const success = await login(pin);
    if (success) {
      navigate('/tables');
    } else {
      setError(true);
      setPin('');
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className={`card w-80 p-6 flex flex-col items-center shadow-lg ${error ? 'animate-shake' : ''}`}>
        <h2 className="text-2xl font-bold mb-6">Enter PIN</h2>
        
        <div className="flex justify-center space-x-2 mb-8">
          {[0, 1, 2, 3].map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full ${i < pin.length ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="ghost"
              onClick={() => { handleDigit(digit.toString()); }}
              className="w-16 h-16 rounded-full bg-gray-100 text-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="ghost"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-full bg-gray-100 text-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            ←
          </Button>
          <Button
            variant="ghost"
            onClick={() => { handleDigit('0'); }}
            className="w-16 h-16 rounded-full bg-gray-100 text-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            0
          </Button>
          <Button
            variant="primary"
            onClick={() => { void handleSubmit(); }}
            className="w-16 h-16 rounded-full text-xl font-medium"
          >
            ✓
          </Button>
        </div>

        {error && <p className="text-red-500 font-medium mt-2">Incorrect PIN</p>}
      </div>
    </div>
  );
};

export default LoginPage;
