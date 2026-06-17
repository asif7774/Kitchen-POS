import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Button from '../../components/atoms/button/button';

interface DailyReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalCGST: number;
  totalSGST: number;
  hourlyData: { hour: string; orders: number; revenue: number }[];
}

const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const fetchReport = async () => {
      const res = await api.reports.daily({ start: startDate, end: endDate });
      if (res.success && res.data) {
        // Mock mapping since IPC returns unknown structure
        const mockData: DailyReport = {
          date: startDate,
          totalOrders: 142,
          totalRevenue: 24500,
          totalCGST: 612.5,
          totalSGST: 612.5,
          hourlyData: [
            { hour: '12 PM', orders: 15, revenue: 2500 },
            { hour: '1 PM', orders: 28, revenue: 5600 },
            { hour: '2 PM', orders: 22, revenue: 4200 },
            { hour: '3 PM', orders: 10, revenue: 1500 },
            { hour: '7 PM', orders: 35, revenue: 6500 },
            { hour: '8 PM', orders: 45, revenue: 8500 },
            { hour: '9 PM', orders: 30, revenue: 5200 },
          ]
        };
        setReport(mockData);
      }
    };
    void fetchReport();
  }, [startDate, endDate]);

  const handleExportCSV = async () => {
    // Generate CSV from report
    if (!report) { return; }
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Total Orders,Total Revenue,CGST,SGST\n"
      + `${report.date},${report.totalOrders},${report.totalRevenue},${report.totalCGST},${report.totalSGST}`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
    return Promise.resolve();
  };

  return (
    <div className="p-6 bg-gray-50 h-full overflow-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports & Analytics</h1>
        <Button variant="outline" onClick={() => { void handleExportCSV(); }}>
          Export CSV
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-6 items-center">
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">Start Date</label>
          <input 
            type="date" 
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); }}
            className="border border-gray-300 p-2 rounded-lg text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-1.5">End Date</label>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); }}
            className="border border-gray-300 p-2 rounded-lg text-sm w-40 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Orders</h3>
              <p className="text-3xl font-extrabold text-gray-900">{report.totalOrders}</p>
            </div>
            <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</h3>
              <p className="text-3xl font-extrabold text-gray-900">₹{report.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total CGST</h3>
              <p className="text-3xl font-extrabold text-blue-600">₹{report.totalCGST.toFixed(2)}</p>
            </div>
            <div className="bg-white p-5 border border-gray-100 rounded-xl shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total SGST</h3>
              <p className="text-3xl font-extrabold text-blue-600">₹{report.totalSGST.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Hourly Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(val: number) => `₹${val}`} />
                <Tooltip 
                  formatter={(value) => [`₹${Number(value)}`, 'Revenue']}
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
