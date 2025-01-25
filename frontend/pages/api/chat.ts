import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { irr, npv } from 'financial';

const openai = new OpenAI(process.env.OPENAI_API_KEY!);

export type RevenueData = {
  lots_developed: Record<string, number | null>;
  lots_sold: Record<string, number | null>;
  gross_lot_sales_revenue: Record<string, number | null>;
  avg_revenue_per_front: Record<string, number | null>;
  avg_revenue_per_lot: Record<string, number | null>;
  pod_sales: Record<string, number | null>;
  marketing_fee: Record<string, number | null>;
  other_revenue: Record<string, number | null>;
  total_gross_revenue: Record<string, number | null>;
};

function calculateFinancialMetrics(data: RevenueData) {
  // Convert yearly data into cash flows
  const cashFlows = Object.entries(data.total_gross_revenue)
    .sort(([yearA], [yearB]) => yearA.localeCompare(yearB))
    .map(([_, value]) => value || 0);

  // Calculate IRR
  const irrValue = cashFlows.some(v => v !== 0) ? irr(cashFlows) * 100 : 0;
  
  // Calculate NPV with a 10% discount rate
  const npvValue = npv(0.10, ...cashFlows);
  
  // Calculate Peak Equity (maximum negative cash flow)
  const peakEquity = Math.min(...cashFlows);

  return {
    irr: irrValue.toFixed(2) + '%',
    npv: new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(npvValue),
    peakEquity: new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(peakEquity)
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;
    
    // Calculate financial metrics
    const metrics = calculateFinancialMetrics(context);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful financial analyst assistant. Analyze the revenue data and answer questions about it."
        },
        {
          role: "user",
          content: `Context: ${JSON.stringify(context)}\nFinancial Metrics: ${JSON.stringify(metrics)}\n\nQuestion: ${message}`
        }
      ]
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    res.status(200).json({ response, metrics });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
