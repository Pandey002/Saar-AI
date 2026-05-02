const API_KEY = "AIzaSyB5r-L4kNYNZQTXYCxnpntB1PMAkwvsAeQ";
const model = "gemini-1.5-flash";

async function testVision() {
  // Use the native Gemini endpoint instead of OpenAI-compatibility for Vision
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: "Describe this image." },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==" // 1x1 transparent pixel
          }
        }
      ]
    }]
  };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("RESPONSE:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

testVision();
