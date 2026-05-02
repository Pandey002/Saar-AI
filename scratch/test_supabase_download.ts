import { createClient } from "@supabase/supabase-js";
import "dotenv/config"; // To load .env.local

async function testDownload() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRole) {
    console.log("Missing credentials.");
    return;
  }

  const admin = createClient(supabaseUrl, serviceRole);
  
  // List files to find one to download
  const { data, error } = await admin.storage.from("source-materials").list("temp-extracts", { limit: 1 });
  
  if (error) {
    console.error("List Error:", error);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No files found in temp-extracts");
    return;
  }

  const fileName = data[0].name;
  console.log("Found file:", fileName);

  const { data: fileData, error: downloadError } = await admin.storage.from("source-materials").download(`temp-extracts/${fileName}`);
  
  if (downloadError) {
    console.error("Download Error:", downloadError);
  } else {
    console.log("Download successful! Size:", fileData.size);
  }
}

testDownload();
