import React, { useState, useEffect } from 'react';
import { Button } from '../../components/atoms';
import { api } from '../../lib/ipc';
import { PastOrderData, PastOrderStats } from '../../types/models';
import { useHeader } from '../../contexts/HeaderContext';
import { KPICard } from '../../components/molecules/KPICard';
import { SvgIcon } from '../../components/atoms/svg-sprite-loader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/molecules/Table';

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
    const subtitle = stats
      ? `${stats.totalOrders} Orders Total • Total Revenue: ₹${Math.round(stats.totalRevenue)}`
      : undefined;

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
                setCurrentPage(1);
                setFilter(f);
              }
            }}
            className={`capitalize ${
              filter === f ? 'bg-white shadow text-emerald-500 hover:bg-white hover:text-emerald-500' : 'text-gray-600 hover:text-gray-900 hover:bg-transparent'
            }`}
          >
            {f}
          </Button>
        ))}
      </div>,
      subtitle
    );
    return () => { setHeader(null, null, null); };
  }, [filter, setHeader, stats]);

  return (
    <div className="container-responsive p-6">

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard 
            title="Total Revenue" 
            value={`₹${Math.round(stats.totalRevenue)}`} 
            icon={<SvgIcon name="indian-rupee" width={24} height={24} />}
            colorTheme="blue"
          />
          <KPICard 
            title="Total Orders" 
            value={stats.totalOrders} 
            icon={<SvgIcon name="cart" width={24} height={24} />}
            colorTheme="green"
          />
          <KPICard 
            title="Average Order Value" 
            value={`₹${Math.round(stats.averageOrderValue)}`} 
            icon={<SvgIcon name="trend-up" width={24} height={24} />}
            colorTheme="purple"
          />
        </div>
      )}

      <div className="bg-white border rounded shadow-sm overflow-hidden flex-1 flex flex-col">
        <Table className="h-full border-0 shadow-none sm:rounded-none">
          <TableHeader className="sticky top-0 z-10">
            <TableRow>
              <TableHead>Business Date</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Occupied Time</TableHead>
              <TableHead className="text-center">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(() => {
              if (loading) {
                return (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">Loading...</TableCell>
                  </TableRow>
                );
              }
              if (orders.length === 0) {
                return (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-12">No orders found for this period.</TableCell>
                  </TableRow>
                );
              }
              return orders.map((order) => (
                <React.Fragment key={order.id}>
                  <TableRow>
                    <TableCell className="text-gray-500 font-mono">
                      {order.business_date 
                        ? new Date(`${order.business_date}T12:00:00Z`).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono">
                      {new Date(`${order.date}Z`).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      ₹{Math.round(order.amount)}
                    </TableCell>
                    <TableCell className="text-center font-mono text-gray-500">
                      {formatMsToTime(order.occupiedTimeMs)}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { setExpandedRow(expandedRow === order.id ? null : order.id); }}
                      >
                        {expandedRow === order.id ? 'Hide' : 'View'}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {expandedRow === order.id && (
                    <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                      <TableCell colSpan={7}>
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
                              variant="primary" 
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
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ));
            })()}
          </TableBody>
        </Table>
        
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
