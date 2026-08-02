import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/ipc";
import { Button } from "../../components/atoms";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/atoms/card";
import { useHeader } from "../../contexts/HeaderContext";
import SvgIcon from "../../components/atoms/svg-sprite-loader/SvgIcon";
import { KPICard } from "../../components/molecules/KPICard";
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
  Bar,
} from "recharts";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

type FilterType = "today" | "yesterday" | "weekly" | "monthly" | "yearly";

const filters: { label: string; value: FilterType }[] = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const formatDateLabel = (label: string) => {
  if (typeof label !== "string") {
    return label;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(label).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    return new Date(`${label}-01`).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  }
  // For %H format (hours)
  if (/^\d{2}$/.test(label)) {
    const hour = parseInt(label, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00${ampm}`;
  }
  return label;
};

const formatDateLabelShort = (label: string) => {
  if (typeof label !== "string") {
    return label;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
    return new Date(label).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  if (/^\d{4}-\d{2}$/.test(label)) {
    return new Date(`${label}-01`).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  }
  // For %H format (hours)
  if (/^\d{2}$/.test(label)) {
    const hour = parseInt(label, 10);
    const ampm = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 || 12;
    return `${hour12}:00${ampm}`;
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
        <p className="font-semibold text-gray-800 mb-2">
          {formatDateLabel(label ?? "")}
        </p>
        <div className="space-y-1 text-sm">
          <p className="flex justify-between gap-4">
            <span className="text-gray-500">Revenue:</span>
            <span className="font-bold text-emerald-500">
              ₹{Math.round(data.sales)}
            </span>
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
  const [filter, setFilter] = useState<FilterType>("today");
  const [metrics, setMetrics] = useState({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    outstandingBalances: 0,
  });
  const [trends, setTrends] = useState<{
    totalSales: number | null;
    totalOrders: number | null;
    averageOrderValue: number | null;
    totalCustomers: number | null;
    outstandingBalances: number | null;
  }>({
    totalSales: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    totalCustomers: 0,
    outstandingBalances: 0,
  });
  const [trendData, setTrendData] = useState<
    { label: string; sales: number; orders: number; customers: number }[]
  >([]);
  const [topItemsData, setTopItemsData] = useState<
    { name: string; quantity: number }[]
  >([]);
  const [peakHourData, setPeakHourData] = useState<
    { hour: string; revenue: number; orders: number; customers: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [salesChartType, setSalesChartType] = useState<"line" | "bar">("bar");

  const formatHour = (hourStr: string) => {
    const hour = parseInt(hourStr, 10);
    if (isNaN(hour)) {
      return hourStr;
    }
    if (hour === 0) {
      return "12 AM";
    }
    if (hour === 12) {
      return "12 PM";
    }
    if (hour > 12) {
      return `${hour - 12} PM`;
    }
    return `${hour} AM`;
  };

  useEffect(() => {
    let active = true;

    api.dashboard
      .getMetrics({ filter })
      .then((res) => {
        if (active && res.success && res.data) {
          setMetrics(res.data.metrics);
          setTrends(res.data.trends);
          setTrendData(res.data.trendData);
          setTopItemsData(
            (res.data as Record<string, unknown>).topItemsData as {
              name: string;
              quantity: number;
            }[],
          );
          setPeakHourData(
            ((res.data as Record<string, unknown>).peakHourData as
              | {
                  hour: string;
                  revenue: number;
                  orders: number;
                  customers: number;
                }[]
              | undefined) ?? [],
          );
        }
      })
      .catch(console.error)
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [filter]);

  // Handle filter changes to trigger loading state correctly
  const handleFilterChange = useCallback((f: FilterType) => {
    setLoading(true);
    setFilter(f);
  }, []);

  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader(
      "Dashboard",
      <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant="ghost"
            onClick={() => {
              handleFilterChange(f.value);
            }}
            className={
              filter === f.value
                ? "bg-emerald-50 text-emerald-600 shadow-sm hover:bg-emerald-100 hover:text-emerald-800"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }
          >
            {f.label}
          </Button>
        ))}
      </div>,
      `Overview for ${{ today: "Today", yesterday: "Yesterday", weekly: "This Week", monthly: "This Month", yearly: "This Year" }[filter]}`,
    );
    return () => {
      setHeader(null, null, null);
    };
  }, [setHeader, filter, handleFilterChange]);

  return (
    <div className="p-6 mx-auto space-y-6">
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPICard
              title="Total Sales"
              value={`₹${Math.round(metrics.totalSales)}`}
              icon={<SvgIcon name="indian-rupee" width={24} height={24} />}
              trend={trends.totalSales}
              trendLabel="vs last period"
              sparklineData={trendData.map((d) => d.sales)}
              colorTheme="blue"
            />
            <KPICard
              title="Orders"
              value={metrics.totalOrders}
              icon={<SvgIcon name="cart" width={24} height={24} />}
              trend={trends.totalOrders}
              trendLabel="vs last period"
              sparklineData={trendData.map((d) => d.orders)}
              colorTheme="green"
            />
            <KPICard
              title="Avg Order Value"
              value={`₹${Math.round(metrics.averageOrderValue)}`}
              icon={<SvgIcon name="trend-up" width={24} height={24} />}
              trend={trends.averageOrderValue}
              trendLabel="vs last period"
              sparklineData={trendData.map((d) =>
                d.orders > 0 ? d.sales / d.orders : 0,
              )}
              colorTheme="purple"
            />
            <KPICard
              title="Customers"
              value={metrics.totalCustomers}
              icon={<SvgIcon name="users" width={24} height={24} />}
              trend={trends.totalCustomers}
              trendLabel="vs last period"
              sparklineData={trendData.map((d) => d.customers)}
              colorTheme="orange"
            />
            <KPICard
              title="Customer Dues"
              value={`₹${Math.round(metrics.outstandingBalances)}`}
              icon={<SvgIcon name="wallet" width={24} height={24} />}
              trend={trends.outstandingBalances}
              trendLabel=""
              sparklineData={[]}
              colorTheme="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Trend Chart */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Sales Trend</CardTitle>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => {
                      setSalesChartType("line");
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${salesChartType === "line" ? "bg-white shadow-sm text-emerald-500 font-medium" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Line
                  </button>
                  <button
                    onClick={() => {
                      setSalesChartType("bar");
                    }}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${salesChartType === "bar" ? "bg-white shadow-sm text-emerald-500 font-medium" : "text-gray-500 hover:text-gray-900"}`}
                  >
                    Bar
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minHeight={1}
                    minWidth={1}
                  >
                    {salesChartType === "line" ? (
                      <LineChart
                        data={trendData}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={formatDateLabelShort}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={(val: number) => `₹${val}`}
                        />
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
                      <BarChart
                        data={trendData}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={formatDateLabelShort}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={(val: number) => `₹${val}`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="sales"
                          fill="#2563eb"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={50}
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
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={1}
                      minWidth={1}
                    >
                      <PieChart>
                        <Pie
                          data={topItemsData.map((item, index) => ({
                            ...item,
                            fill: COLORS[index % COLORS.length],
                          }))}
                          dataKey="quantity"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={80}
                          innerRadius={50}
                          paddingAngle={2}
                          label={(props: {
                            cx?: number;
                            cy?: number;
                            midAngle?: number;
                            outerRadius?: number;
                            percent?: number;
                          }) => {
                            const {
                              cx = 0,
                              cy = 0,
                              midAngle = 0,
                              outerRadius = 0,
                              percent = 0,
                            } = props;
                            const RADIAN = Math.PI / 180;
                            const radius = outerRadius + 15;
                            const x =
                              cx + radius * Math.cos(-midAngle * RADIAN);
                            const y =
                              cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#666"
                                fontSize={12}
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                              >
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}
                        />
                        <Tooltip
                          formatter={(value: unknown) => [
                            value as React.ReactNode,
                            "Quantity",
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
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
            {/* Peak Hours Analysis Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Customers Traffic by Hour</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {peakHourData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={1}
                      minWidth={1}
                    >
                      <BarChart
                        data={peakHourData.map((d) => ({
                          ...d,
                          formattedHour: formatHour(d.hour),
                        }))}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="formattedHour"
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={(val: number) => `${val}`}
                        />
                        <Tooltip
                          formatter={(value: unknown) => [
                            value as React.ReactNode,
                            "Customers",
                          ]}
                        />
                        <Bar
                          dataKey="customers"
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No traffic data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Peak Hour Revenue Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Peak Hour Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  {peakHourData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      minHeight={1}
                      minWidth={1}
                    >
                      <BarChart
                        data={peakHourData.map((d) => ({
                          ...d,
                          formattedHour: formatHour(d.hour),
                        }))}
                        margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="formattedHour"
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                        />
                        <YAxis
                          tick={{ fill: "#6b7280", fontSize: 10 }}
                          tickFormatter={(val: number) => `₹${val}`}
                        />
                        <Tooltip
                          formatter={(value: unknown) => [
                            `₹${value as number}`,
                            "Revenue",
                          ]}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No revenue data available
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
