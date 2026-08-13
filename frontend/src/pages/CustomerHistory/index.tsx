import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Customer, CustomerHistory } from "../../types/models";
import { api } from "../../lib/ipc";
import { BackButton, Button } from "../../components/atoms";
import { formatDateTime } from "../../utils/formatDate";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/molecules/Table';
import { useHeader } from "../../contexts/HeaderContext";

const CustomerHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setHeader } = useHeader();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [history, setHistory] = useState<CustomerHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Date filter state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const formatMsToTime = (ms: number | undefined) => {
    if (ms === undefined || isNaN(ms) || ms <= 0) { return '-'; }
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  useEffect(() => {
    if (!id) {
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      const [custRes, histRes] = await Promise.all([
        api.customers.getById(Number(id)),
        api.customers.getHistory(Number(id)),
      ]);

      if (custRes.success && custRes.data) {
        setCustomer(custRes.data);
      } else {
        navigate("/customers");
        return;
      }

      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
      setLoading(false);
    };
    void fetchData();
  }, [id, navigate]);

  useEffect(() => {
    const totalSpend = history.reduce((sum, visit) => sum + visit.totalAmount, 0);
    
    const title = customer
      ? `${customer.name}'s Order History`
      : "Order History";
    const subtitle = customer?.phone
      ? `Phone: ${customer.phone} • ${history.length} Orders Total • Total Spend: ₹${Math.round(totalSpend)}`
      : `${history.length} Orders Total • Total Spend: ₹${Math.round(totalSpend)}`;
    setHeader(title, null, subtitle);

    return () => {
      setHeader(null, null, null);
    };
  }, [customer, history, setHeader]);

  const filteredHistory = history.filter((visit) => {
    // Replace space with T for safe cross-browser parsing, and ensure it parses as local
    const visitDate = new Date(visit.date.replace(' ', 'T'));
    if (startDate) {
      // Parse YYYY-MM-DD directly as local time to avoid timezone offset bugs
      const s = new Date(`${startDate}T00:00:00`);
      if (visitDate.getTime() < s.getTime()) {
        return false;
      }
    }
    if (endDate) {
      const e = new Date(`${endDate}T23:59:59`);
      if (visitDate.getTime() > e.getTime()) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="p-6 mx-auto flex flex-col h-full">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <BackButton to="/customers" label="Back to Customers" />
        <div className="flex gap-2 items-center text-sm bg-white border border-gray-200 px-4 py-2 rounded-lg shadow-sm">
          <span className="text-gray-600 font-medium">Filter by Date:</span>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
          />
          {(startDate || endDate) && (
            <button
              className="text-gray-500 hover:text-gray-700 underline text-xs ml-2"
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        )}
        {!loading && filteredHistory.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed shadow-sm">
            {history.length > 0
              ? "No orders found in the selected date range."
              : "No past orders found for this customer."}
          </div>
        )}
        {!loading && filteredHistory.length > 0 && (
          <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill Number</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Outstanding</TableHead>
                  <TableHead className="text-center">Time Occupied</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((visit) => {
                  const isExpanded = expandedRow === visit.billNumber;
                  return (
                    <React.Fragment key={visit.billNumber}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">
                          {visit.billNumber}
                        </TableCell>
                        <TableCell className="text-gray-500 font-mono">
                          {formatDateTime(visit.date)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const type = visit.type ?? 'dine-in';
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
                          ₹{Math.round(visit.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={visit.outstandingAmount > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}>
                            ₹{Math.round(visit.outstandingAmount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-gray-500">
                          {formatMsToTime(visit.occupiedTimeMs)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => { setExpandedRow(expandedRow === visit.billNumber ? null : visit.billNumber); }}
                          >
                            {expandedRow === visit.billNumber ? 'Hide' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow className="bg-emerald-50/50 hover:bg-emerald-50/50">
                          <TableCell colSpan={7}>
                            <div className="flex justify-between items-start max-w-sm">
                              <div className="text-sm text-gray-700 space-y-1 flex-1">
                                <h4 className="font-bold mb-2">Order Items:</h4>
                                {visit.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between border-b border-blue-100 last:border-0 pb-1 last:pb-0 mr-4">
                                    <span>{item.name}</span>
                                    <span className="font-medium">x{item.qty}</span>
                                  </div>
                                ))}
                                {visit.items.length === 0 && (
                                  <div className="text-sm text-gray-400 italic">
                                    No items found
                                  </div>
                                )}
                              </div>
                              <div className="pt-2">
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  icon="printer" 
                                  onClick={() => { 
                                    api.reports.printPastBill({ orderId: visit.orderId }).catch(console.error); 
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
                  );
                })}
          </TableBody>
        </Table>
        )}
      </div>
    </div>
  );
};

export default CustomerHistoryPage;
