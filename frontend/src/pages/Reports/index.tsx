import { Button, Input } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { api } from '../../lib/ipc';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/atoms/card';

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
    let active = true;
    api.reports.daily({ start: startDate, end: endDate })
      .then(res => {
        if (active && res.success && res.data) {
          setReport(res.data as DailyReport);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
      });
    return () => { active = false; };
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

      <Card className="mb-6 flex-row items-center gap-6 p-4 border-gray-100 shadow-sm">
        <div className="w-40">
          <Input 
            type="date" 
            label="Start Date"
            value={startDate} 
            onChange={e => { setStartDate(e.target.value); }}
          />
        </div>
        <div className="w-40">
          <Input 
            type="date" 
            label="End Date"
            value={endDate} 
            onChange={e => { setEndDate(e.target.value); }}
          />
        </div>
      </Card>

      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-5 border-gray-100 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Orders</h3>
              <p className="text-3xl font-extrabold text-gray-900">{report.totalOrders}</p>
            </Card>
            <Card className="p-5 border-gray-100 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total Revenue</h3>
              <p className="text-3xl font-extrabold text-gray-900">₹{report.totalRevenue.toFixed(2)}</p>
            </Card>
            <Card className="p-5 border-gray-100 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total CGST</h3>
              <p className="text-3xl font-extrabold text-blue-600">₹{report.totalCGST.toFixed(2)}</p>
            </Card>
            <Card className="p-5 border-gray-100 shadow-sm">
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Total SGST</h3>
              <p className="text-3xl font-extrabold text-blue-600">₹{report.totalSGST.toFixed(2)}</p>
            </Card>
          </div>

          <Card className="h-96">
            <CardHeader>
              <CardTitle>Hourly Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
