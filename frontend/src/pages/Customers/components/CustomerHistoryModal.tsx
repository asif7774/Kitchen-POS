import React, { useEffect, useState } from 'react';
import { Customer, CustomerHistory } from '../../../types/models';
import { api } from '../../../lib/ipc';
import { Button } from '../../../components/atoms';

interface Props {
  customer: Customer;
  onClose: () => void;
}

const CustomerHistoryModal: React.FC<Props> = ({ customer, onClose }) => {
  const [history, setHistory] = useState<CustomerHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const res = await api.customers.getHistory(customer.id);
      if (res.success && res.data) {
        setHistory(res.data);
      }
      setLoading(false);
    };
    void fetchHistory();
  }, [customer.id]);

  return (
    <div className="flex flex-col h-[600px]">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">{customer.name}'s Order History</h3>
        <p className="text-sm text-gray-500">Phone: {customer.phone ?? 'N/A'}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
        {!loading && history.length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            No past orders found for this customer.
          </div>
        )}
        {!loading && history.length > 0 && (
          history.map(visit => (
            <div key={visit.orderId} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <div className="bg-gray-50 px-4 py-3 border-b flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-700">{visit.billNumber}</span>
                  <span className="text-sm text-gray-500 ml-3">
                    {new Date(visit.date).toLocaleString()}
                  </span>
                </div>
                <div className="font-bold text-lg text-gray-800">
                  ₹{visit.totalAmount.toFixed(2)}
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-1">
                  {visit.items.map((item, idx) => (
                    <li key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.name}</span>
                      <span className="text-gray-500 font-medium">x{item.qty}</span>
                    </li>
                  ))}
                  {visit.items.length === 0 && (
                    <li className="text-sm text-gray-400 italic">No items found</li>
                  )}
                </ul>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default CustomerHistoryModal;
