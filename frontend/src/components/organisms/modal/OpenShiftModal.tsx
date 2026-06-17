import React, { useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import Button from '../../atoms/button/button';

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="bg-blue-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">Open Shift Register</h2>
          <p className="text-blue-100 text-xs mt-1">Initialize the cash drawer float to start billing</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-655 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Opening Float / Cash Drawer Cash (₹)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={openingCash}
              onChange={e => { setOpeningCash(e.target.value === '' ? '' : Number(e.target.value)); }}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              placeholder="e.g. 1000"
            />
          </div>

          <div className="pt-4 flex justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel / Logout
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Start Shift
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
