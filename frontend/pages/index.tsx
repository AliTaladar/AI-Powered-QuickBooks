import { useState } from 'react';
import type { RevenueData } from './api/chat';

interface Metrics {
  irr: string;
  npv: string;
  peakEquity: string;
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          context: {} // You'll populate this with actual QuickBooks data
        }),
      });

      const data = await res.json();
      setResponse(data.response);
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Failed to get response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-3xl font-bold mb-8">QuickBooks AI Assistant</h1>
                
                {metrics && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-blue-800">IRR</h3>
                      <p className="text-lg font-bold text-blue-900">{metrics.irr}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-green-800">NPV</h3>
                      <p className="text-lg font-bold text-green-900">{metrics.npv}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-sm font-semibold text-purple-800">Peak Equity</h3>
                      <p className="text-lg font-bold text-purple-900">{metrics.peakEquity}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full p-2 border rounded"
                    rows={4}
                    placeholder="Ask about your QuickBooks data..."
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                  >
                    {loading ? 'Loading...' : 'Send'}
                  </button>
                </form>
                {response && (
                  <div className="mt-4 p-4 bg-gray-50 rounded">
                    <h2 className="font-semibold mb-2">Response:</h2>
                    <p>{response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
