function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shiftMonth(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

function shiftYear(dateStr: string, years: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d.toISOString().slice(0, 10);
}

export function getDateConditions(filter: string, activeBizDate?: string | null) {
  let curr: string;
  let prev: string;
  let format: string;

  switch (filter) {
    case 'today':
    case 'daily':
      curr = activeBizDate
        ? `business_date = '${activeBizDate}'`
        : "business_date = date('now', 'localtime')";
      prev = activeBizDate
        ? `business_date = '${shiftDate(activeBizDate, -1)}'`
        : "business_date = date('now', '-1 day', 'localtime')";
      format = '%H';
      break;
    case 'yesterday':
      curr = activeBizDate
        ? `business_date = '${shiftDate(activeBizDate, -1)}'`
        : "business_date = date('now', '-1 day', 'localtime')";
      prev = activeBizDate
        ? `business_date = '${shiftDate(activeBizDate, -2)}'`
        : "business_date = date('now', '-2 days', 'localtime')";
      format = '%H';
      break;
    case 'weekly':
      if (activeBizDate) {
        const weekStart = shiftDate(activeBizDate, -6);
        const prevWeekEnd = shiftDate(activeBizDate, -7);
        const prevWeekStart = shiftDate(activeBizDate, -13);
        curr = `business_date >= '${weekStart}' AND business_date <= '${activeBizDate}'`;
        prev = `business_date >= '${prevWeekStart}' AND business_date <= '${prevWeekEnd}'`;
      } else {
        curr = "business_date >= date('now', '-6 days', 'localtime')";
        prev = "business_date >= date('now', '-13 days', 'localtime') AND business_date < date('now', '-6 days', 'localtime')";
      }
      format = '%Y-%m-%d';
      break;
    case 'monthly':
      if (activeBizDate) {
        const ym = activeBizDate.slice(0, 7);
        const prevYm = shiftMonth(activeBizDate, -1).slice(0, 7);
        curr = `strftime('%Y-%m', business_date) = '${ym}'`;
        prev = `strftime('%Y-%m', business_date) = '${prevYm}'`;
      } else {
        curr = "strftime('%Y-%m', business_date) = strftime('%Y-%m', 'now', 'localtime')";
        prev = "strftime('%Y-%m', business_date) = strftime('%Y-%m', 'now', '-1 month', 'localtime')";
      }
      format = '%Y-%m-%d';
      break;
    case 'yearly':
      if (activeBizDate) {
        const yr = activeBizDate.slice(0, 4);
        const prevYr = shiftYear(activeBizDate, -1).slice(0, 4);
        curr = `strftime('%Y', business_date) = '${yr}'`;
        prev = `strftime('%Y', business_date) = '${prevYr}'`;
      } else {
        curr = "strftime('%Y', business_date) = strftime('%Y', 'now', 'localtime')";
        prev = "strftime('%Y', business_date) = strftime('%Y', 'now', '-1 year', 'localtime')";
      }
      format = '%Y-%m';
      break;
    default:
      curr = activeBizDate
        ? `business_date = '${activeBizDate}'`
        : "business_date = date('now', 'localtime')";
      prev = activeBizDate
        ? `business_date = '${shiftDate(activeBizDate, -1)}'`
        : "business_date = date('now', '-1 day', 'localtime')";
      format = '%H';
  }

  return { curr, prev, format };
}

export function calcTrend(curr: number, prev: number): number {
  if (prev === 0) {
    return curr > 0 ? 100 : 0;
  }
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}
