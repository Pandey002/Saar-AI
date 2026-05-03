const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const API_KEY = env.match(/GEMINI_API_KEY=(.*)/)[1].trim();

async function listModels() {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
  
  try {
    const response = await fetch(endpoint);
    const data = await response.json();
    console.log("MODELS:", JSON.stringify(data.models.map(m => m.name), null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

listModels();
