import { Button, Input } from "../../components/atoms";
import React, { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/ipc";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/atoms/card";
import { useHeader } from "../../contexts/HeaderContext";
import SvgIcon from "../../components/atoms/svg-sprite-loader/SvgIcon";
import { KPICard } from "../../components/molecules/KPICard";

interface DailyReport {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  totalCGST: number;
  totalSGST: number;
  trends?: {
    totalOrders: number;
    totalRevenue: number;
    totalCGST: number;
    totalSGST: number;
    averageOrderValue: number;
    peakHourlyRevenue: number;
  };
  hourlyData: {
    hour: string;
    orders: number;
    revenue: number;
  }[];
}

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
  payload?: { payload: { revenue: number; orders: number } }[];
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
              ₹{Math.round(data.revenue)}
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

type FilterType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const filters: { label: string; value: FilterType }[] = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const ReportsPage: React.FC = () => {
  const [report, setReport] = useState<DailyReport | null>(null);
  const [filter, setFilter] = useState<FilterType>("daily");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customEnd, setCustomEnd] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let active = true;
    void api.settings.get().then((res) => {
      if (active && res.success && res.data) {
        setSettings(res.data as Record<string, unknown>);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const payload =
      filter === "custom"
        ? { filter, start: customStart, end: customEnd }
        : { filter };
    api.reports
      .daily(payload)
      .then((res) => {
        if (active && res.success && res.data) {
          setReport(res.data);
        }
      })
      .catch((err: unknown) => {
        console.error(err);
      });
    return () => {
      active = false;
    };
  }, [filter, customStart, customEnd]);

  const handleExportCSV = useCallback(async () => {
    if (!report) {
      return;
    }
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Filter,Total Orders,Total Revenue,CGST,SGST\n" +
      `${filter},${report.totalOrders},${report.totalRevenue},${report.totalCGST},${report.totalSGST}`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_report_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return Promise.resolve();
  }, [report, filter]);

  const { setHeader } = useHeader();

  useEffect(() => {
    setHeader(
      "Sales Report",
      <div className="flex items-center gap-4">
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant="ghost"
              onClick={() => {
                setFilter(f.value);
                setShowDatePicker(false);
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
        </div>

        <div className="relative">
          <Button
            variant="outline"
            onClick={() => {
              setShowDatePicker(!showDatePicker);
            }}
            className={
              filter === "custom"
                ? "bg-emerald-50 text-emerald-600 border-blue-200"
                : ""
            }
          >
            Custom Dates
          </Button>
          {showDatePicker && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 shadow-xl rounded-lg p-4 z-50 flex flex-col gap-4">
              <h4 className="font-semibold text-gray-800 mb-2">Custom Range</h4>
              <Input
                type="date"
                label="Start Date"
                value={customStart}
                onChange={(e) => {
                  setCustomStart(e.target.value);
                }}
              />
              <Input
                type="date"
                label="End Date"
                value={customEnd}
                onChange={(e) => {
                  setCustomEnd(e.target.value);
                }}
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={() => {
                    setFilter("custom");
                    setShowDatePicker(false);
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            void handleExportCSV();
          }}
        >
          Export CSV
        </Button>
      </div>,
      `Viewing: ${{ daily: 'Daily', weekly: 'This Week', monthly: 'This Month', yearly: 'This Year', custom: 'Custom Range' }[filter]}`
    );
    return () => { setHeader(null, null, null); };
  }, [
    setHeader,
    handleExportCSV,
    filter,
    showDatePicker,
    customStart,
    customEnd,
  ]);

  return (
    <div className="p-6 bg-gray-50 h-full gap-4 flex flex-col overflow-auto relative">
      {report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Total Orders"
              value={report.totalOrders}
              icon={<SvgIcon name="cart" width={24} height={24} />}
              trend={report.trends?.totalOrders ?? 0}
              trendLabel="vs last period"
              sparklineData={report.hourlyData.map(d => d.orders)}
              colorTheme="green"
            />
            <KPICard
              title="Total Sales"
              value={`₹${Math.round(report.totalRevenue)}`}
              icon={<SvgIcon name="indian-rupee" width={24} height={24} />}
              trend={report.trends?.totalRevenue ?? 0}
              trendLabel="vs last period"
              sparklineData={report.hourlyData.map(d => d.revenue)}
              colorTheme="blue"
            />
            {settings.is_gst_enabled !== false ? (
              <>
                <KPICard
                  title="Total CGST"
                  value={`₹${Math.round(report.totalCGST)}`}
                  icon={<SvgIcon name="document-text" width={24} height={24} />}
                  trend={report.trends?.totalCGST ?? 0}
                  trendLabel="vs last period"
                  sparklineData={report.hourlyData.map(d => d.revenue * 0.025)}
                  colorTheme="purple"
                />
                <KPICard
                  title="Total SGST"
                  value={`₹${Math.round(report.totalSGST)}`}
                  icon={<SvgIcon name="document-text" width={24} height={24} />}
                  trend={report.trends?.totalSGST ?? 0}
                  trendLabel="vs last period"
                  sparklineData={report.hourlyData.map(d => d.revenue * 0.025)}
                  colorTheme="orange"
                />
              </>
            ) : (
              <>
                <KPICard
                  title="Avg Order Value"
                  value={`₹${Math.round(report.totalOrders > 0 ? report.totalRevenue / report.totalOrders : 0)}`}
                  icon={<SvgIcon name="trend-up" width={24} height={24} />}
                  trend={report.trends?.averageOrderValue ?? 0}
                  trendLabel="vs last period"
                  sparklineData={report.hourlyData.map(d => d.orders > 0 ? d.revenue / d.orders : 0)}
                  colorTheme="purple"
                />
                <KPICard
                  title="Peak Hr Revenue"
                  value={`₹${Math.round(report.hourlyData.reduce((prev, curr) => (prev.revenue > curr.revenue) ? prev : curr, {hour: 'N/A', revenue: 0, orders: 0}).revenue)}`}
                  icon={<SvgIcon name="clock" width={24} height={24} />}
                  trend={report.trends?.peakHourlyRevenue ?? 0}
                  trendLabel={report.hourlyData.reduce((prev, curr) => (prev.revenue > curr.revenue) ? prev : curr, {hour: 'N/A', revenue: 0, orders: 0}).hour}
                  sparklineData={report.hourlyData.map(d => d.revenue)}
                  colorTheme="orange"
                />
              </>
            )}
          </div>

          <Card className="h-96">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minHeight={1}
                  minWidth={1}
                >
                  <BarChart
                    data={report.hourlyData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      dataKey="hour"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      dy={10}
                      tickFormatter={formatDateLabelShort}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#6b7280", fontSize: 12 }}
                      tickFormatter={(val: number) => `₹${val}`}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#f3f4f6" }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
