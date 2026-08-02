export function getDateConditions(filter: string) {
  let curr: string;
  let prev: string;
  let format: string;
  
  switch (filter) {
    case 'today':
    case 'daily':
      curr = "date(created_at, 'localtime') = date('now', 'localtime')";
      prev = "date(created_at, 'localtime') = date('now', '-1 day', 'localtime')";
      format = "%H";
      break;
    case 'yesterday':
      curr = "date(created_at, 'localtime') = date('now', '-1 day', 'localtime')";
      prev = "date(created_at, 'localtime') = date('now', '-2 days', 'localtime')";
      format = "%H";
      break;
    case 'weekly':
      curr = "date(created_at, 'localtime') >= date('now', '-6 days', 'localtime')";
      prev = "date(created_at, 'localtime') >= date('now', '-13 days', 'localtime') AND date(created_at, 'localtime') < date('now', '-6 days', 'localtime')";
      format = "%Y-%m-%d";
      break;
    case 'monthly':
      curr = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')";
      prev = "strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', '-1 month', 'localtime')";
      format = "%Y-%m-%d";
      break;
    case 'yearly':
      curr = "strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', 'localtime')";
      prev = "strftime('%Y', created_at, 'localtime') = strftime('%Y', 'now', '-1 year', 'localtime')";
      format = "%Y-%m";
      break;
    default: // 'today'
      curr = "date(created_at, 'localtime') = date('now', 'localtime')";
      prev = "date(created_at, 'localtime') = date('now', '-1 day', 'localtime')";
      format = "%H";
  }
  
  return { curr, prev, format };
}

export function calcTrend(curr: number, prev: number): number {
  if (prev === 0) {
    return curr > 0 ? 100 : 0;
  }
  return Number((((curr - prev) / prev) * 100).toFixed(1));
}
