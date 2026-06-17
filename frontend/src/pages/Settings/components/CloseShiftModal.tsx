import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../../store/auth';
import { api } from '../../../lib/ipc';
import Button from '../../../components/atoms/button/button';
import Input from '../../../components/atoms/input/input';
import Textarea from '../../../components/atoms/textarea/textarea';
import { useToast } from '../../../hooks/useToast';

interface Props {
  onClose: () => void;
}

interface PaymentTotals {
  cash: number;
  card: number;
  upi: number;
  complimentary: number;
}

export default function CloseShiftModal({ onClose }: Props) {
  const activeShift = useAuthStore(state => state.activeShift);
  const closeShift = useAuthStore(state => state.closeShift);
  const logout = useAuthStore(state => state.logout);

  const [totals, setTotals] = useState<PaymentTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [closingCash, setClosingCash] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let active = true;
    if (activeShift) {
      api.shifts.getTotals({ openedAt: activeShift.opened_at })
        .then(res => {
          if (active && res.success && res.data) {
            setTotals(res.data);
          } else if (active) {
            showToast({ message: res.error ?? 'Failed to calculate shift sales', variant: 'error' });
          }
        })
        .catch((err: unknown) => {
          if (active) {
            if (err instanceof Error) {
              showToast({ message: err.message, variant: 'error' });
            } else {
              showToast({ message: String(err), variant: 'error' });
            }
          }
        })
        .finally(() => {
          if (active) { setLoading(false); }
        });
    }
    return () => { active = false; };
  }, [activeShift, showToast]);

  if (!activeShift) {
    return null;
  }

  const expectedCash = activeShift.opening_cash + (totals?.cash ?? 0);
  const totalNonCash = (totals?.card ?? 0) + (totals?.upi ?? 0) + (totals?.complimentary ?? 0);
  const cashVal = typeof closingCash === 'number' ? closingCash : 0;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (closingCash === '' || closingCash < 0) {
      showToast({ message: 'Please enter counted closing cash', variant: 'error' });
      return;
    }

    setIsSubmitting(true);

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
          showToast({ message: 'Shift closed successfully', variant: 'success' });
          logout(); // Shift close logs staff out automatically
        } else {
          showToast({ message: 'Failed to close shift register', variant: 'error' });
          setIsSubmitting(false);
        }
      })
      .catch((err: unknown) => {
        if (!(err instanceof Error)) {
          showToast({ message: String(err), variant: 'error' });
        }
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <div className="bg-red-600 px-6 py-4 text-white -mx-6 -mt-4 mb-4 rounded-t-xl">
        <h2 className="text-xl font-bold">Close Shift Register</h2>
        <p className="text-red-100 text-xs mt-1">Reconcile cash drawer float and payments before logout</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Calculating shift aggregates...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">

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
            <Input
              label="Counted Cash in Drawer (₹)"
              type="number"
              min="0"
              step="0.01"
              required
              autoFocus
              value={closingCash}
              onChange={e => { setClosingCash(e.target.value === '' ? '' : Number(e.target.value)); }}
              className="text-lg font-bold text-gray-900 focus:ring-red-500"
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

          <Textarea
            label="Shift Notes (Optional)"
            value={note}
            onChange={e => { setNote(e.target.value); }}
            className="focus:ring-red-500 text-sm"
            placeholder="Discrepancy explanations, drawer count details, etc."
            rows={2}
          />

          <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
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
    </>
  );
}
