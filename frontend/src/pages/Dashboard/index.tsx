import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/ipc';
import { Button } from '../../components/atoms';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/atoms/card';
import { useHeader } from '../../contexts/HeaderContext';
import SvgIcon from '../../components/atoms/svg-sprite-loader/SvgIcon';
import { KPICard } from '../../components/molecules/KPICard';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
  BarChart,
  Bar
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

type FilterType = 'today' | 'yesterday' | 'weekly' | 'monthly' | 'yearly';

const filters: { label: string; value: FilterType }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
];

const formatDateLabel = (label: string) => {
  if (typeof label !== 'string') {return label;}
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(label).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    return new Date(`${label  }-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  // For %H format (hours)
  if (/^\d{2}$/.test(label)) {
    const hour = parseInt(label, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  }
  return label;
};

const formatDateLabelShort = (label: string) => {
  if (typeof label !== 'string') {return label;}
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(label).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    return new Date(`${label  }-01`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }
  // For %H format (hours)
  if (/^\d{2}$/.test(label)) {
    const hour = parseInt(label, 10);
    const ampm = hour >= 12 ? 'p' : 'a';
    const hour12 = hour % 12 || 12;
    return `${hour12}${ampm}`;
  }
  return label;
};

interface TooltipProps {
  active?: boolean;
  payload?: { payload: { sales: number; orders: number } }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
        <p className="font-semibold text-gray-800 mb-2">{formatDateLabel(label)}</p>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Revenue:</span>
            <span className="font-bold text-blue-600">₹{Math.round(data.sales)}</span>
          </p>
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Orders:</span>
            <span className="font-bold text-gray-900">{data.orders}</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

const DashboardPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('today');
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    outstandingBalances: 0
  });
  const [trendData, setTrendData] = useState<{ label: string; sales: number; orders: number }[]>([]);
  const [topItemsData, setTopItemsData] = useState<{ name: string; quantity: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [salesChartType, setSalesChartType] = useState<'line' | 'bar'>('line');

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
            <KPICard 
              title="Total Sales" 
              value={`₹${Math.round(metrics.totalSales)}`} 
              icon={<SvgIcon name="indian-rupee" width={24} height={24} />}
              trend={12.5}
              trendLabel="vs last period"
              sparklineData={[10, 25, 20, 45, 30, 50, 60]}
              colorTheme="blue"
            />
            <KPICard 
              title="Orders" 
              value={metrics.totalOrders} 
              icon={<SvgIcon name="cart" width={24} height={24} />}
              trend={8.2}
              trendLabel="vs last period"
              sparklineData={[5, 10, 15, 12, 20, 18, 25]}
              colorTheme="green"
            />
            <KPICard 
              title="Avg Order Value" 
              value={`₹${Math.round(metrics.averageOrderValue)}`} 
              icon={<SvgIcon name="trend-up" width={24} height={24} />}
              trend={-2.4}
              trendLabel="vs last period"
              sparklineData={[30, 28, 25, 26, 24, 22, 20]}
              colorTheme="purple"
            />
            <KPICard 
              title="Customers" 
              value={metrics.totalCustomers} 
              icon={<SvgIcon name="users" width={24} height={24} />}
              trend={15.0}
              trendLabel="vs last period"
              sparklineData={[20, 30, 40, 35, 50, 65, 80]}
              colorTheme="orange"
            />
            <KPICard 
              title="Balances" 
              value={`₹${Math.round(metrics.outstandingBalances)}`} 
              icon={<SvgIcon name="wallet" width={24} height={24} />}
              trend={-5.1}
              trendLabel="vs last period"
              sparklineData={[50, 45, 40, 35, 30, 25, 20]}
              colorTheme="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sales Trend</CardTitle>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => { setSalesChartType('line'); }} 
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${salesChartType === 'line' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Line
                  </button>
                  <button 
                    onClick={() => { setSalesChartType('bar'); }} 
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${salesChartType === 'bar' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    Bar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                    {salesChartType === 'line' ? (
                      <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tickFormatter={formatDateLabelShort} />
                        <YAxis tickFormatter={(val: number) => `₹${val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line 
                          type="monotone" 
                          dataKey="sales" 
                          stroke="#2563eb" 
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    ) : (
                      <BarChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tickFormatter={formatDateLabelShort} />
                        <YAxis tickFormatter={(val: number) => `₹${val}`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="sales" 
                          fill="#2563eb" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    )}
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
                    <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
                      <PieChart>
                        <Pie
                          data={topItemsData.map((item, index) => ({ ...item, fill: COLORS[index % COLORS.length] }))}
                          dataKey="quantity"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        />
                        <Tooltip formatter={(value: number) => [value, 'Quantity']} />
                        <Legend />
                      </PieChart>
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



export default DashboardPage;
