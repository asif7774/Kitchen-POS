import React, { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import Button from '../../atoms/button/button';
import Input from '../../atoms/input/input';

export default function OpenShiftModal() {
  const [openingCash, setOpeningCash] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const openShift = useAuthStore(state => state.openShift);
  const logout = useAuthStore(state => state.logout);

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (openingCash === '' || openingCash < 0) {
      setError('Please enter a valid opening float');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const cashVal = typeof openingCash === 'number' ? openingCash : 0;

    openShift(cashVal)
      .then(success => {
        if (!success) {
          setError('Failed to open shift register');
          setIsSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
        setIsSubmitting(false);
      });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in border border-gray-200">
        <div className="bg-blue-600 px-6 py-5 text-white text-center">
          <h2 className="text-2xl font-bold">Open Shift Register</h2>
          <p className="text-blue-100 text-sm mt-1">Initialize the cash drawer float to start billing</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-655 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Opening Float / Cash Drawer Cash (₹)"
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={openingCash}
              onChange={e => { setOpeningCash(e.target.value === '' ? '' : Number(e.target.value)); }}
              placeholder="e.g. 1000"
              className="text-xl font-bold text-center"
            />
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Button
              type="submit"
              variant="primary"
              block
              size="lg"
              isLoading={isSubmitting}
            >
              Start Shift
            </Button>
            <Button
              type="button"
              variant="ghost"
              block
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel / Logout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
