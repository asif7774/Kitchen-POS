import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentTotals {
  cash: number;
  card: number;
  upi: number;
  complimentary: number;
}

export default function CloseShiftModal({ isOpen, onClose }: Props) {
  const activeShift = useAuthStore(state => state.activeShift);
  const closeShift = useAuthStore(state => state.closeShift);
  const logout = useAuthStore(state => state.logout);

  const [totals, setTotals] = useState<PaymentTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingCash, setClosingCash] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (isOpen && activeShift) {
      api.shifts.getTotals({ openedAt: activeShift.opened_at })
        .then(res => {
          if (active && res.success && res.data) {
            setTotals(res.data);
            setError(null);
          } else if (active) {
            setError(res.error ?? 'Failed to calculate shift sales');
          }
        })
        .catch((err: unknown) => {
          if (active) {
            if (err instanceof Error) {
              setError(err.message);
            } else {
              setError(String(err));
            }
          }
        })
        .finally(() => {
          if (active) { setLoading(false); }
        });
    }
    return () => { active = false; };
  }, [isOpen, activeShift]);

  if (!isOpen || !activeShift) {
    return null;
  }

  const expectedCash = activeShift.opening_cash + (totals?.cash ?? 0);
  const totalNonCash = (totals?.card ?? 0) + (totals?.upi ?? 0) + (totals?.complimentary ?? 0);
  const cashVal = typeof closingCash === 'number' ? closingCash : 0;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (closingCash === '' || closingCash < 0) {
      setError('Please enter counted closing cash');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // If discrepancy is present, append automated remarks
    const discrepancy = cashVal - expectedCash;
    let finalNote = note.trim();
    if (discrepancy !== 0) {
      const discrepancyMsg = `[Discrepancy: ₹${discrepancy.toFixed(2)}]`;
      finalNote = finalNote ? `${discrepancyMsg} ${finalNote}` : discrepancyMsg;
    }

    closeShift(cashVal, finalNote)
      .then(success => {
        if (success) {
          logout(); // Shift close logs staff out automatically
        } else {
          setError('Failed to close shift register');
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
        <div className="bg-red-600 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">Close Shift Register</h2>
          <p className="text-red-100 text-xs mt-1">Reconcile cash drawer float and payments before logout</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Calculating shift aggregates...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-650 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3.5 border rounded-lg">
                <span className="text-xs text-gray-500 font-bold block uppercase tracking-wide">Starting Cash</span>
                <span className="text-lg font-bold text-gray-900">₹{activeShift.opening_cash.toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 p-3.5 border rounded-lg">
                <span className="text-xs text-gray-500 font-bold block uppercase tracking-wide">Expected Cash</span>
                <span className="text-lg font-bold text-gray-900">₹{expectedCash.toFixed(2)}</span>
              </div>
            </div>

            {totals && (
              <div className="border border-gray-150 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-500 font-bold">
                      <th className="py-2.5 px-3">Payment Method</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    <tr>
                      <td className="py-2 px-3">Cash Sales</td>
                      <td className="py-2 px-3 text-right font-mono">₹{totals.cash.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Card Sales</td>
                      <td className="py-2 px-3 text-right font-mono">₹{totals.card.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">UPI Sales</td>
                      <td className="py-2 px-3 text-right font-mono">₹{totals.upi.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3">Complimentary</td>
                      <td className="py-2 px-3 text-right font-mono">₹{totals.complimentary.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-gray-50/50 font-bold">
                      <td className="py-2.5 px-3 text-gray-800">Total Non-Cash</td>
                      <td className="py-2.5 px-3 text-right text-gray-800 font-mono">₹{totalNonCash.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Counted Cash in Drawer (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                autoFocus
                value={closingCash}
                onChange={e => { setClosingCash(e.target.value === '' ? '' : Number(e.target.value)); }}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-lg font-bold text-gray-900"
                placeholder="e.g. 1500"
              />
              {closingCash !== '' && (
                <p className={`text-xs font-semibold mt-1.5 ${cashVal === expectedCash ? 'text-green-600' : 'text-amber-600'}`}>
                  {cashVal === expectedCash 
                    ? '✓ Cash drawer matches expected amount' 
                    : `⚠️ Discrepancy: ₹${(cashVal - expectedCash).toFixed(2)}`
                  }
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Shift Notes (Optional)</label>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                placeholder="Discrepancy explanations, drawer count details, etc."
                rows={2}
              />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="danger"
                isLoading={isSubmitting}
              >
                Reconcile & Close Shift
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
