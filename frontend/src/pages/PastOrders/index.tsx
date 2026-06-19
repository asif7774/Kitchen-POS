import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms';
import { api } from '../../lib/ipc';
import { PastOrderData, PastOrderStats } from '../../types/models';
import { useHeader } from '../../contexts/HeaderContext';

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly';

const PastOrdersPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('daily');
  const [stats, setStats] = useState<PastOrderStats | null>(null);
  const [orders, setOrders] = useState<PastOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await api.reports.getPastOrders({ filter, page: currentPage, limit: 15 });
        if (active && res.success && res.data) {
          setStats(res.data.stats);
          setOrders(res.data.orders);
          setTotalPages(res.data.totalPages);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) { setLoading(false); }
      }
    };
    void fetchOrders();
    return () => { active = false; };
  }, [filter, currentPage]);

  const formatMsToTime = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}`;
  };

  const { setHeader } = useHeader();
  useEffect(() => {
    setHeader(
      'Past Orders',
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
        {(['daily', 'weekly', 'monthly', 'yearly'] as FilterType[]).map(f => (
          <Button
            key={f}
            size="sm"
            variant="ghost"
            onClick={() => { 
              if (filter !== f) {
                setFilter(f);
                setCurrentPage(1);
              }
            }}
            className={`capitalize ${
              filter === f ? 'bg-white shadow text-blue-600 hover:bg-white hover:text-blue-600' : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            }`}
          >
            {f}
          </Button>
        ))}
      </div>
    );
    return () => { setHeader(null, null); };
  }, [filter, setHeader]);

  return (
    <div className="container-responsive p-6">

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
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
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                    </tr>
                  );
                }
                if (orders.length === 0) {
                  return (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No orders found for this period.</td>
                    </tr>
                  );
                }
                return orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(`${order.date  }Z`).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const type = order.type ?? 'dine-in';
                          const typeStyles: Record<string, string> = {
                            takeaway: 'bg-orange-100 text-orange-800',
                            delivery: 'bg-purple-100 text-purple-800',
                            'dine-in': 'bg-green-100 text-green-800',
                          };
                          const style = typeStyles[type] ?? typeStyles['dine-in'];
                          return (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${style}`}>
                              {type.toUpperCase()}
                            </span>
                          );
                        })()}
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
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex justify-between items-start max-w-sm">
                            <div className="text-sm text-gray-700 space-y-1 flex-1">
                              <h4 className="font-bold mb-2">Order Items:</h4>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between border-b border-blue-100 last:border-0 pb-1 last:pb-0 mr-4">
                                  <span>{item.name}</span>
                                  <span className="font-medium">x{item.qty}</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2">
                              <Button 
                                variant="secondary" 
                                size="sm" 
                                icon="printer" 
                                onClick={() => { 
                                  api.reports.printPastBill({ orderId: order.id }).catch(console.error); 
                                }}
                              >
                                Print Bill
                              </Button>
                            </div>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-700">
              Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); }}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); }}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastOrdersPage;
