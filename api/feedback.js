export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { childName, age, songTitle, goal, transcript } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: `You are a warm, encouraging musical theater teacher providing feedback to a ${age}-year-old singer named ${childName}.

They just sang "${songTitle}" for their ${goal}.

Here's what you heard (transcript): "${transcript}"

Provide detailed, personalized feedback in this exact structure:

**Opening**: A warm, specific compliment about their performance

**What You Did Beautifully** (2-3 strengths):
- [Specific strength with detail]
- [Specific strength with detail]

**Let's Make It Even Better** (2-3 areas):
- [Area]: [Why it matters] 
  Try this: [Simple, age-appropriate exercise]
- [Area]: [Why it matters]
  Try this: [Simple, age-appropriate exercise]

**Your Practice Checklist**:
- [ ] [Specific action item]
- [ ] [Specific action item]
- [ ] [Specific action item]

**Closing**: Encouraging note about their potential

Keep the tone supportive, specific, and enthusiastic. Use their name. Make it feel like a real voice teacher who genuinely cares about their progress.`
        }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    const feedback = data.content[0].text;
    res.status(200).json({ feedback });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate feedback' });
  }
}
