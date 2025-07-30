export async function generateGPTResponse(prompt) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',     // cheap but solid; change later if you want
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 400,
    }),
  });
  if (!res.ok) throw new Error(`GPT error ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}
