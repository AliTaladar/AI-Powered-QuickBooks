import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import ChatInterface from '../components/ChatInterface';

interface YearlyData {
  [key: string]: number | null;
}

interface RevenueFormData {
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

const Home: NextPage = () => {
  const years = Array.from({ length: 13 }, (_, i) => `Year ${i + 1}`);
  const metrics = [
    'lots_developed',
    'lots_sold',
    'gross_lot_sales_revenue',
    'avg_revenue_per_front',
    'avg_revenue_per_lot',
    'pod_sales',
    'marketing_fee',
    'other_revenue',
    'total_gross_revenue'
  ];

  const [formData, setFormData] = useState<RevenueFormData>({
    lots_developed: {
      'Year 4': 124,
      'Year 5': 73,
      'Year 6': 72,
      'Year 7': 211,
      'Year 8': 73,
      'Year 9': 50,
      'Year 10': 57
    },
    lots_sold: {
      'Year 4': 70,
      'Year 5': 95,
      'Year 6': 123,
      'Year 7': 142,
      'Year 8': 50,
      'Year 9': 57
    },
    gross_lot_sales_revenue: {
      'Year 4': 6443700,
      'Year 5': 9896752,
      'Year 6': 13847710,
      'Year 7': 26831600,
      'Year 8': 14079540,
      'Year 9': 9156894
    },
    avg_revenue_per_front: {},
    avg_revenue_per_lot: {
      'Year 4': 84766,
      'Year 5': 99957,
      'Year 6': 113366,
      'Year 7': 147426,
      'Year 8': 156439,
      'Year 9': 160682
    },
    pod_sales: {},
    marketing_fee: {
      'Year 4': 626068,
      'Year 5': 793533,
      'Year 6': 1067134,
      'Year 7': 1047523,
      'Year 8': 896017,
      'Year 9': 654338,
      'Year 10': 160643
    },
    other_revenue: {
      'Year 4': 750,
      'Year 5': 2758,
      'Year 6': 241700
    },
    total_gross_revenue: {}
  });

  const shouldShowPerUnit = (field: string) => {
    return ['gross_lot_sales_revenue', 'marketing_fee', 'total_gross_revenue'].includes(field);
  };

  const formatNumber = (value: number | null, showDecimals: boolean = false): string => {
    if (value === null || value === undefined) return '';
    const options = showDecimals 
      ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 0, maximumFractionDigits: 0 };
    return new Intl.NumberFormat('en-US', options).format(value);
  };

  const shouldShowDecimals = (field: string): boolean => {
    return field === 'marketing_fee' || 
           field === 'gross_lot_sales_revenue' || 
           field === 'total_gross_revenue' ||
           field === 'pod_sales' ||
           field === 'other_revenue';
  };

  const calculateRowTotal = (field: keyof RevenueFormData): number => {
    return Object.values(formData[field]).reduce((sum, value) => {
      return sum + (value || 0);
    }, 0);
  };

  const calculatePerUnit = (field: keyof RevenueFormData): number | null => {
    const total = calculateRowTotal(field);
    const totalLotsSold = calculateRowTotal('lots_sold');
    return totalLotsSold ? total / totalLotsSold : null;
  };

  const calculateGrossRevenue = (data: RevenueFormData, year: string): number => {
    const grossLotSales = data.gross_lot_sales_revenue[year] || 0;
    const podSales = data.pod_sales[year] || 0;
    const marketingFee = data.marketing_fee[year] || 0;
    const otherRevenue = data.other_revenue[year] || 0;
    return grossLotSales + podSales + marketingFee + otherRevenue;
  };

  const handleInputChange = (field: keyof RevenueFormData, year: string, value: string) => {
    // Remove any non-numeric characters except decimal point
    const cleanValue = value.replace(/[^0-9.-]/g, '');
    const numValue = cleanValue === '' ? null : parseFloat(cleanValue);
    
    const newFormData = {
      ...formData,
      [field]: {
        ...formData[field],
        [year]: numValue
      }
    };

    // Calculate total gross revenue
    if (field !== 'total_gross_revenue') {
      const grossRevenue = calculateGrossRevenue(newFormData, year);
      newFormData.total_gross_revenue = {
        ...newFormData.total_gross_revenue,
        [year]: grossRevenue
      };
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8000/api/revenue-forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to save data');
      }

      alert('Data saved successfully! You can now ask questions about your revenue forecast.');
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Error saving data. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <Head>
        <title>Revenue Forecast Form</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Revenue Forecast</h1>
        <div className="grid grid-cols-2 gap-6">
          {/* Left side - Revenue Form */}
          <div className="bg-white shadow-lg rounded-lg p-6">
            <form onSubmit={handleSubmit}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border">
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[200px]">
                        Metric
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[120px]">
                        Total
                      </th>
                      <th className="bg-gray-50 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[120px]">
                        Per Unit
                      </th>
                      {years.map(year => (
                        <th key={year} className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r min-w-[120px]">
                          {year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {Object.keys(formData).map((field) => (
                      <tr key={field}>
                        <td className="sticky left-0 z-10 bg-white px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                          {field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm border-r">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border rounded bg-gray-50 text-right"
                            value={formatNumber(calculateRowTotal(field as keyof RevenueFormData), shouldShowDecimals(field))}
                            readOnly
                          />
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-sm border-r">
                          {shouldShowPerUnit(field) ? (
                            <input
                              type="text"
                              className="w-full px-2 py-1 border rounded bg-gray-50 text-right"
                              value={formatNumber(calculatePerUnit(field as keyof RevenueFormData), true)}
                              readOnly
                            />
                          ) : null}
                        </td>
                        {years.map(year => (
                          <td key={year} className="px-2 py-2 whitespace-nowrap text-sm border-r">
                            {field === 'total_gross_revenue' ? (
                              <input
                                type="text"
                                className="w-full px-2 py-1 border rounded bg-gray-50 text-right"
                                value={formatNumber(formData[field][year], shouldShowDecimals(field))}
                                readOnly
                              />
                            ) : (
                              <input
                                type="text"
                                className="w-full px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-right"
                                value={formatNumber(formData[field as keyof RevenueFormData][year], shouldShowDecimals(field))}
                                onChange={(e) => handleInputChange(field as keyof RevenueFormData, year, e.target.value)}
                              />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>

          {/* Right side - Chat Interface */}
          <div className="bg-white shadow-lg rounded-lg p-6 h-[800px]">
            <ChatInterface formData={formData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
