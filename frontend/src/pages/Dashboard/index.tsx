import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/ipc';
import { Button } from '../../components/atoms';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/atoms/card';
import { useHeader } from '../../contexts/HeaderContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

type FilterType = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly';

const filters: { label: string; value: FilterType }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
];

const DashboardPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('today');
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    outstandingBalances: 0
  });
  const [trendData, setTrendData] = useState<{ label: string; sales: number }[]>([]);
  const [topItemsData, setTopItemsData] = useState<{ name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    api.dashboard.getMetrics({ filter })
      .then(res => {
        if (active && res.success && res.data) {
          setMetrics(res.data.metrics);
          setTrendData(res.data.trendData);
          setTopItemsData(res.data.topItemsData);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) { setLoading(false); }
      });

    return () => { active = false; };
  }, [filter]);

  // Handle filter changes to trigger loading state correctly
  const handleFilterChange = useCallback((f: FilterType) => {
    setLoading(true);
    setFilter(f);
  }, []);

  const { setHeader } = useHeader();
  
  useEffect(() => {
    setHeader(
      'Dashboard',
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        {filters.map(f => (
          <Button
            key={f.value}
            variant="ghost"
            onClick={() => { handleFilterChange(f.value); }}
            className={
              filter === f.value 
                ? 'bg-blue-50 text-blue-700 shadow-sm hover:bg-blue-100 hover:text-blue-800' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }
          >
            {f.label}
          </Button>
        ))}
      </div>
    );
    return () => { setHeader(null, null); };
  }, [setHeader, filter, handleFilterChange]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <MetricCard 
              title="Total Sales" 
              value={`₹${metrics.totalSales.toFixed(2)}`} 
              subtitle="Revenue for selected period"
            />
            <MetricCard 
              title="Orders" 
              value={metrics.totalOrders.toString()} 
              subtitle="Total orders placed"
            />
            <MetricCard 
              title="Average Order Value" 
              value={`₹${metrics.averageOrderValue.toFixed(2)}`} 
              subtitle="Average spend per order"
            />
            <MetricCard 
              title="Customers Served" 
              value={metrics.totalCustomers.toString()} 
              subtitle="Based on covers count"
            />
            <MetricCard 
              title="Outstanding Balances" 
              value={`₹${metrics.outstandingBalances.toFixed(2)}`} 
              subtitle="Global pending payments"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(val: number) => `₹${val}`} />
                      <Tooltip formatter={(value: unknown) => [`₹${Number(value).toFixed(2)}`, 'Sales']} />
                      <Line 
                        type="monotone" 
                        dataKey="sales" 
                        stroke="#2563eb" 
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Items Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {topItemsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar dataKey="quantity" fill="#10b981" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-500">
                      No item sales found for this period.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ title: string; value: string; subtitle: string }> = ({ title, value, subtitle }) => (
  <Card>
    <CardContent className="p-6">
      <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-400">{subtitle}</p>
    </CardContent>
  </Card>
);

export default DashboardPage;
