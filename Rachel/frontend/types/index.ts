export interface YearlyData {
  [key: string]: number | null;
}

export interface RevenueFormData {
  lots_developed: YearlyData;
  lots_sold: YearlyData;
  gross_lot_sales_revenue: YearlyData;
  avg_revenue_per_front: YearlyData;
  avg_revenue_per_lot: YearlyData;
  pod_sales: YearlyData;
  marketing_fee: YearlyData;
  other_revenue: YearlyData;
  total_gross_revenue: YearlyData;
}
