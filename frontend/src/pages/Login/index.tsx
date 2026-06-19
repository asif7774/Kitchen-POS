import { Button, Input } from '../../components/atoms';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { api } from '../../lib/ipc';
import { useToast } from '../../hooks/useToast';

const LoginPage: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'verify' | 'reset'>('verify');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleExportBackup = async () => {
    setIsExporting(true);
    try {
      const res = await api.backup.export({});
      if (res.success) {
        showToast({ message: `Backup exported to ${res.data as string}`, variant: 'success' });
      } else {
        showToast({ message: res.error ?? 'Failed to export backup', variant: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to export backup', variant: 'error' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportBackup = async () => {
    setIsImporting(true);
    try {
      const res = await api.backup.import({});
      if (res.success) {
        showToast({ message: 'Backup imported. App will restart.', variant: 'success' });
      } else if (res.error && res.error !== 'Import cancelled') {
        showToast({ message: res.error, variant: 'error' });
      }
    } catch {
      showToast({ message: 'Failed to import backup', variant: 'error' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDigit = React.useCallback((digit: string) => {
    setPin((prev) => prev + digit);
    setError(false);
  }, []);

  const handleBackspace = React.useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  }, []);

  const handleSubmit = React.useCallback(async () => {
    const success = await login(pin);
    if (success) {
      navigate('/tables');
    } else {
      setError(true);
      setPin('');
    }
  }, [login, navigate, pin]);

  const handleVerifyRecoveryCode = async () => {
    const res = await api.system.verifyRecoveryCode({ code: recoveryCode });
    if (res.success) {
      setRecoveryStep('reset');
      setError(false);
    } else {
      setError(true);
      showToast({ message: 'Invalid Recovery Code', variant: 'error' });
    }
  };

  const handleResetAdminPin = async () => {
    if (newAdminPin.length !== 4) {
      showToast({ message: 'PIN must be 4 digits', variant: 'warning' });
      return;
    }
    const res = await api.system.resetAdminPin({ code: recoveryCode, newPin: newAdminPin });
    if (res.success) {
      showToast({ message: 'Admin PIN reset successfully', variant: 'success' });
      setIsRecovering(false);
      setRecoveryStep('verify');
      setRecoveryCode('');
      setNewAdminPin('');
    } else {
      showToast({ message: res.error ?? 'Failed to reset PIN', variant: 'error' });
    }
  };

  React.useEffect(() => {
    if (isRecovering) { return; }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (pin.length < 4) {
          handleDigit(e.key);
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          void handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [pin, handleDigit, handleBackspace, handleSubmit, isRecovering]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-cyan-900 animate-gradient-bg">
      <div className={`w-80 sm:w-96 p-8 flex flex-col items-center rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl animate-fade-in ${error && !isRecovering ? 'animate-shake' : ''}`}>
        
        {isRecovering ? (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-white tracking-widest uppercase">Recover PIN</h2>
            {recoveryStep === 'verify' ? (
              <>
                <p className="text-sm text-white/80 mb-6 text-center">Enter your 6-character Recovery Code.</p>
                <Input 
                  placeholder="Recovery Code" 
                  value={recoveryCode} 
                  onChange={(e) => { setRecoveryCode(e.target.value.toUpperCase()); }} 
                  className="mb-6 text-center tracking-widest uppercase font-mono bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  maxLength={6}
                />
                <Button variant="primary" className="w-full mb-3 bg-cyan-500 hover:bg-cyan-400 border-none shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white" onClick={() => { void handleVerifyRecoveryCode(); }}>Verify Code</Button>
                <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setIsRecovering(false); }}>Cancel</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-white/80 mb-6 text-center">Enter a new 4-digit Admin PIN.</p>
                <Input 
                  placeholder="New Admin PIN" 
                  type="password"
                  value={newAdminPin} 
                  onChange={(e) => { setNewAdminPin(e.target.value.replace(/\D/g, '')); }} 
                  className="mb-6 text-center tracking-widest text-lg bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  maxLength={4}
                />
                <Button variant="primary" className="w-full mb-3 bg-cyan-500 hover:bg-cyan-400 border-none shadow-[0_0_15px_rgba(34,211,238,0.4)] text-white" onClick={() => { void handleResetAdminPin(); }}>Reset PIN</Button>
                <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10" onClick={() => { setIsRecovering(false); setRecoveryStep('verify'); }}>Cancel</Button>
              </>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-6 text-white tracking-widest uppercase">ENTER PIN</h2>
        
        <div className="flex justify-center space-x-3 mb-8">
          {[0, 1, 2, 3].map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)] scale-110' : 'bg-white/20'}`}></div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <Button
              key={digit}
              variant="ghost"
              onClick={() => { handleDigit(digit.toString()); }}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 text-white text-3xl font-light hover:bg-white/20 hover:scale-105 active:scale-95 active:bg-white/30 transition-all duration-200 shadow-sm"
            >
              {digit}
            </Button>
          ))}
          <Button
            variant="ghost"
            onClick={handleBackspace}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 text-white text-3xl font-light hover:bg-white/20 hover:scale-105 active:scale-95 active:bg-white/30 transition-all duration-200 shadow-sm flex items-center justify-center"
          >
            ←
          </Button>
          <Button
            variant="ghost"
            onClick={() => { handleDigit('0'); }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 border border-white/10 text-white text-3xl font-light hover:bg-white/20 hover:scale-105 active:scale-95 active:bg-white/30 transition-all duration-200 shadow-sm"
          >
            0
          </Button>
          <Button
            variant="ghost"
            onClick={() => { void handleSubmit(); }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-cyan-500/80 border border-cyan-400/50 text-white text-3xl font-light hover:bg-cyan-400 hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(34,211,238,0.6)] transition-all duration-200 shadow-md flex items-center justify-center"
          >
            ✓
          </Button>
        </div>

        {error && <p className="text-red-300 font-medium mt-4 tracking-wide text-sm bg-red-900/40 px-4 py-1 rounded-full backdrop-blur-sm border border-red-500/30">Incorrect PIN</p>}

        <div className="mt-8 pt-6 border-t border-white/10 w-full flex flex-col items-center gap-3">
          <button onClick={() => { setIsRecovering(true); }} className="text-white/60 hover:text-white text-sm tracking-wide transition-colors">
            Forgot PIN?
          </button>
          <div className="flex gap-4 mt-2">
            <button disabled={isExporting || isImporting} onClick={() => { void handleExportBackup(); }} className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50">
              {isExporting ? 'Exporting... Do not close' : 'Export Backup'}
            </button>
            <button disabled={isExporting || isImporting} onClick={() => { void handleImportBackup(); }} className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 disabled:opacity-50">
              {isImporting ? 'Importing... Do not close' : 'Import Backup'}
            </button>
          </div>
          </div>
        </>)}
      </div>
    </div>
  );
};

export default LoginPage;
