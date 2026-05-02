const API_KEY = "AIzaSyB5r-L4kNYNZQTXYCxnpntB1PMAkwvsAeQ";

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
