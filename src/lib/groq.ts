const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const PROXY_HOST = import.meta.env.VITE_PROXY_HOST || '161.115.231.113';
const PROXY_PORT = import.meta.env.VITE_PROXY_PORT || '9149';
const PROXY_USER = import.meta.env.VITE_PROXY_USER || 'UZtsd1';
const PROXY_PASS = import.meta.env.VITE_PROXY_PASS || 'h4fWKh';

interface ParsedTask {
  title: string;
  description: string;
  assignee?: string;
  dueDate?: string;
  amount?: number;
  externalUrl?: string;
  priority?: 'low' | 'medium' | 'high';
}

export async function parseTaskWithAI(text: string): Promise<ParsedTask | null> {
  const prompt = `Parse the following task description and extract structured information. Return ONLY valid JSON without any markdown or extra text.

Extract:
- title: short task name (required)
- description: full description
- assignee: who should do this task (if mentioned)
- dueDate: deadline in YYYY-MM-DD format (if mentioned, like "до понедельника", "к 15 числу" → convert to actual date)
- amount: money amount in rubles (if mentioned like "5000 рублей" or "на 10 тысяч")
- externalUrl: any links found (like bitrix24 links)
- priority: low, medium, or high (detect from urgency words like "срочно", "важно", "критично")

Text: "${text}"

Return JSON like:
{"title":"...","description":"...","assignee":"...","dueDate":"2024-12-31","amount":5000,"externalUrl":"...","priority":"high"}`;

  try {
    const targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Groq API error:', errorData);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing task:', error);
    return null;
  }
}
