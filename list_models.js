const https = require('https');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const API_KEY = env.match(/GEMINI_API_KEY=(.*)/)[1].trim();

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      if (response.models) {
        response.models.forEach(m => {
          if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
            console.log(m.name);
          }
        });
      } else {
        console.log(response);
      }
    } catch (e) {
      console.log(data);
    }
  });
});
