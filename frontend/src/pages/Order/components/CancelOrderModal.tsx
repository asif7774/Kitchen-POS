import React, { useState } from 'react';
import Button from '../../../components/atoms/button/button';
import Textarea from '../../../components/atoms/textarea/textarea';

interface Props {
  onClose: () => void;
  onConfirm: (note: string) => void;
}

const CancelOrderModal: React.FC<Props> = ({ onClose, onConfirm }) => {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);



  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    onConfirm(note);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-100 mb-2">
        <p className="font-semibold text-sm">Are you sure you want to void this order?</p>
        <p className="text-xs mt-1">This action cannot be undone. Inventory items deducted via KOT will be automatically restored.</p>
      </div>

      <Textarea 
        label="Cancellation Reason / Note (Optional)"
        value={note}
        onChange={(e) => { setNote(e.target.value); }}
        placeholder="e.g. Customer walked out, ordered by mistake..."
        className="focus:ring-red-500 min-h-[80px]"
      />

      <div className="-mx-6 -mb-4 px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 mt-8">
        <Button variant="outline" onClick={onClose} type="button">Go Back</Button>
        <Button variant="danger" type="submit" isLoading={isSubmitting}>
          Confirm Void Order
        </Button>
      </div>
    </form>
  );
};

export default CancelOrderModal;
