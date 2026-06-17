import { useEffect, useState, useCallback } from 'react';
import { api } from '../../lib/ipc';
import { KDSTicket, KDSTicketItem } from '../../types/models';
import Button from '../../components/atoms/button/button';

export default function KDSPage() {
  const [tickets, setTickets] = useState<KDSTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchTickets = useCallback(() => {
    api.kds.getActiveTickets()
      .then(res => {
        if (res.success && res.data) {
          setTickets(res.data);
          setError(null);
        } else {
          setError(res.error ?? 'Failed to fetch kitchen orders');
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchTickets();
    
    // Auto-refresh every 5 seconds
    const pollInterval = setInterval(() => {
      fetchTickets();
    }, 5000);

    // Keep current time updated for wait calculation
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, [fetchTickets]);

  const handleUpdateItemStatus = (itemId: number, currentStatus: KDSTicketItem['preparation_status']) => {
    const nextStatusMap: Record<KDSTicketItem['preparation_status'], KDSTicketItem['preparation_status']> = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'served',
      served: 'pending',
    };
    const nextStatus = nextStatusMap[currentStatus];

    api.kds.updateItemStatus({ itemId, status: nextStatus })
      .then(res => {
        if (res.success) {
          fetchTickets();
        }
      })
      .catch(console.error);
  };

  const handleUpdateOrderStatus = (orderId: number, status: KDSTicketItem['preparation_status']) => {
    api.kds.updateOrderStatus({ orderId, status })
      .then(res => {
        if (res.success) {
          fetchTickets();
        }
      })
      .catch(console.error);
  };

  const getWaitTime = (createdAtStr: string) => {
    const elapsedMs = currentTime.getTime() - new Date(createdAtStr).getTime();
    const elapsedMins = Math.floor(elapsedMs / 60000);
    const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);
    return {
      mins: elapsedMins,
      text: `${elapsedMins}m ${elapsedSecs}s`,
    };
  };

  if (loading && tickets.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950 text-white">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading KDS dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-100 font-sans overflow-hidden">
      {/* KDS Premium Header */}
      <header className="flex justify-between items-center bg-gray-900 border-b border-gray-800 px-6 py-4 shadow-md z-10">
        <div className="flex items-center gap-3">
          <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Kitchen Display Screen</h1>
          <span className="px-2.5 py-1 bg-gray-800 border border-gray-700 text-xs font-semibold rounded text-gray-400">
            {tickets.length} Active Tickets
          </span>
        </div>
        <div className="flex items-center gap-4">
          {error && (
            <span className="text-red-400 text-sm bg-red-950/50 border border-red-900 px-3 py-1.5 rounded">
              {error}
            </span>
          )}
          <span className="text-lg font-mono text-gray-400">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            className="border-gray-800 text-gray-300 hover:bg-gray-800"
          >
            Refresh
          </Button>
        </div>
      </header>

      {/* Grid of Kitchen Tickets */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {tickets.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <svg className="w-20 h-20 text-gray-800 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 className="text-xl font-semibold text-gray-400">No Pending Orders</h2>
              <p className="text-gray-600 mt-1">Orders sent to kitchen will show up here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="flex gap-6 h-full pb-4 overflow-y-hidden overflow-x-auto items-start">
            {tickets.map(ticket => {
              const wait = getWaitTime(ticket.created_at);
              
              // Wait time severity indicators
              let cardHeaderBg = 'bg-gray-900 border-gray-850';
              let badgeColor = 'bg-gray-800 text-gray-400';
              
              if (wait.mins >= 20) {
                cardHeaderBg = 'bg-red-950/80 border-red-900/50 animate-pulse';
                badgeColor = 'bg-red-500 text-white font-bold animate-ping';
              } else if (wait.mins >= 10) {
                cardHeaderBg = 'bg-amber-950/75 border-amber-900/50';
                badgeColor = 'bg-amber-500 text-black font-semibold';
              }

              return (
                <div 
                  key={ticket.order_id} 
                  className={`flex flex-col w-80 max-h-[85vh] rounded-xl border bg-gray-900/80 shadow-2xl transition-transform hover:scale-[1.01] ${cardHeaderBg}`}
                >
                  {/* Ticket Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-805">
                    <div>
                      <h3 className="text-lg font-bold text-white">{ticket.table_name}</h3>
                      <span className="text-xs text-gray-500">ID: #{ticket.order_id}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${badgeColor}`}>
                      {wait.text}
                    </span>
                  </div>

                  {/* Order Items List */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {ticket.items.map(item => {
                      const statusStyles: Record<KDSTicketItem['preparation_status'], string> = {
                        pending: 'bg-red-950 text-red-400 border border-red-900/30',
                        preparing: 'bg-amber-950 text-amber-400 border border-amber-900/30',
                        ready: 'bg-emerald-950 text-emerald-400 border border-emerald-900/30',
                        served: 'bg-gray-800 text-gray-500',
                      };

                      return (
                        <div 
                          key={item.id}
                          onClick={() => { handleUpdateItemStatus(item.id, item.preparation_status); }}
                          className="flex justify-between items-start p-3 bg-gray-950/50 border border-gray-850 rounded-lg cursor-pointer hover:bg-gray-850/30 transition-colors group"
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-base font-bold text-blue-400">{item.qty}x</span>
                              <span className="font-semibold text-white group-hover:text-blue-300 transition-colors">{item.name}</span>
                            </div>
                            {item.note && (
                              <p className="text-xs text-amber-500/95 mt-1 ml-7 italic">
                                Note: {item.note}
                              </p>
                            )}
                          </div>
                          
                          <span className={`px-2 py-1 rounded text-xs font-semibold capitalize ${statusStyles[item.preparation_status]}`}>
                            {item.preparation_status}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Order Note */}
                  {ticket.order_note && (
                    <div className="px-4 py-2 border-t border-gray-850/50 bg-gray-950/30">
                      <p className="text-xs text-gray-500 font-medium">Order Note:</p>
                      <p className="text-xs text-gray-400 italic">{ticket.order_note}</p>
                    </div>
                  )}

                  {/* Bulk Actions Footer */}
                  <div className="p-3 border-t border-gray-850 bg-gray-950/40 rounded-b-xl flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { handleUpdateOrderStatus(ticket.order_id, 'ready'); }}
                      className="flex-1 text-xs border-gray-850 text-emerald-400 hover:bg-emerald-950/30"
                    >
                      All Ready
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => { handleUpdateOrderStatus(ticket.order_id, 'served'); }}
                      className="flex-1 text-xs border-gray-850 text-gray-400 hover:bg-gray-800"
                    >
                      All Served
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
