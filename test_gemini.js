const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const API_KEY = env.match(/GEMINI_API_KEY=(.*)/)[1].trim();
const fetch = globalThis.fetch;

async function test() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${API_KEY}`;
  const payload = {
    systemInstruction: {
      parts: [{ text: "You return only valid JSON and no surrounding commentary." }]
    },
    contents: [
      { role: "user", parts: [{ text: "Test prompt give me JSON" }] }
    ],
    generationConfig: {
      maxOutputTokens: 1000,
      temperature: 0.4,
      responseMimeType: "application/json"
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  console.log('EXTRACTED TEXT:', result.candidates?.[0]?.content?.parts?.[0]?.text);
  console.log('FULL RESPONSE:', JSON.stringify(result, null, 2));
}

test();
