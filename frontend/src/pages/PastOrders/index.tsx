import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms';
import { api } from '../../lib/ipc';
import { PastOrderData, PastOrderStats } from '../../types/models';

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PastOrdersPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('daily');
  const [stats, setStats] = useState<PastOrderStats | null>(null);
  const [orders, setOrders] = useState<PastOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.reports.getPastOrders({ filter });
        if (active && res.success && res.data) {
          setStats(res.data.stats);
          setOrders(res.data.orders);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) { setLoading(false); }
      }
    };
    void fetchOrders();
    return () => { active = false; };
  }, [filter]);

  const formatMsToTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container-responsive p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Past Orders</h1>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {(['daily', 'weekly', 'monthly', 'yearly'] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded border shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Total Revenue</span>
            <span className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toFixed(2)}</span>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Total Orders</span>
            <span className="text-2xl font-bold text-gray-900">{stats.totalOrders}</span>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm flex flex-col">
            <span className="text-sm font-medium text-gray-500 mb-1">Average Order Value</span>
            <span className="text-2xl font-bold text-gray-900">₹{stats.averageOrderValue.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="bg-white border rounded shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied Time</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                if (loading) {
                  return (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                    </tr>
                  );
                }
                if (orders.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">No orders found for this period.</td>
                    </tr>
                  );
                }
                return orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(order.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                        ₹{order.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-mono text-gray-500">
                        {formatMsToTime(order.occupiedTimeMs)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => { setExpandedRow(expandedRow === order.id ? null : order.id); }}
                        >
                          {expandedRow === order.id ? 'Hide' : 'View'}
                        </Button>
                      </td>
                    </tr>
                    {expandedRow === order.id && (
                      <tr className="bg-blue-50/50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="text-sm text-gray-700 space-y-1">
                            <h4 className="font-bold mb-2">Order Items:</h4>
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between max-w-sm border-b border-blue-100 last:border-0 pb-1 last:pb-0">
                                <span>{item.name}</span>
                                <span className="font-medium">x{item.qty}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ));
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PastOrdersPage;
