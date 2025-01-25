import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, context } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful financial analyst assistant. Analyze the revenue data and answer questions about it."
        },
        {
          role: "user",
          content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${message}`
        }
      ]
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    res.status(200).json({ response });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
