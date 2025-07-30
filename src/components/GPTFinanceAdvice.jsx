import { useState } from 'react';
import { generateGPTResponse } from '../utils/gpt';

export default function GPTFinanceAdvice() {
  const [text, setText]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const t = await generateGPTResponse(
        'Give a student 3 concise budgeting tips if they spent \
         $80 on food, $40 on entertainment, $30 on transport this week.'
      );
      setText(t);
    } catch (e) {
      console.error(e);
      setText('GPT failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      <button
        onClick={handleClick}
        className="bg-green-600 text-white px-4 py-2 rounded"
      >
        Money Advice (GPT)
      </button>

      {loading && <p className="mt-2">Loading…</p>}
      {text && (
        <pre className="mt-3 whitespace-pre-wrap bg-yellow-100 p-3 rounded text-sm">
          {text}
        </pre>
      )}
    </div>
  );
}
