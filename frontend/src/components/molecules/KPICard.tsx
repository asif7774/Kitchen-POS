import React from 'react';
import { Card, CardContent } from '../atoms/card';
import SvgIcon from '../atoms/svg-sprite-loader/SvgIcon';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number | null;
  trendLabel?: string;
  sparklineData?: number[];
  colorTheme?: 'blue' | 'green' | 'purple' | 'orange';
}

const themeMap = {
  blue: { bg: 'bg-blue-50', icon: 'text-blue-600', stroke: '#3b82f6', fill: '#dbeafe' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', stroke: '#10b981', fill: '#d1fae5' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', stroke: '#8b5cf6', fill: '#ede9fe' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-600', stroke: '#f97316', fill: '#ffedd5' }
};

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  trend,
  trendLabel,
  sparklineData,
  colorTheme = 'blue'
}) => {
  const isPositive = trend && trend > 0;
  const isNegative = trend && trend < 0;
  
  const formattedData = sparklineData?.map((val, i) => ({ index: i, value: val })) ?? [];
  const theme = themeMap[colorTheme];

  let trendColor = 'text-gray-500';
  if (isPositive) { trendColor = 'text-green-600'; }
  else if (isNegative) { trendColor = 'text-red-600'; }

  return (
    <Card className="relative overflow-hidden group border-gray-100 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-gray-500 text-sm font-bold uppercase tracking-wider">{title}</p>
            <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          </div>
          <div className={`p-3 rounded-full ${theme.bg} ${theme.icon} flex items-center justify-center`}>
            {icon}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          {trend !== null && trend !== undefined && (
            <div className={`flex items-center gap-1 text-sm font-bold ${trendColor}`}>
              {isPositive && <SvgIcon name="trend-up" width={16} height={16} strokeWidth={3} />}
              {isNegative && <SvgIcon name="trend-down" width={16} height={16} strokeWidth={3} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          {trendLabel && (
            <span className="text-xs text-gray-400 font-medium">{trendLabel}</span>
          )}
        </div>
      </CardContent>

      {/* Sparkline Background */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity">
          <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
            <AreaChart data={formattedData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={theme.stroke} 
                fill={theme.fill} 
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
