import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env manually since we are running a standalone script
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const apiKey = envConfig.GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key not found in .env.local");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

async function listModels() {
  try {
    // If using @google/genai (new SDK)
    if (ai.models && typeof ai.models.list === 'function') {
        const response: any = await ai.models.list();
        console.log("Response type:", typeof response);
        
        // Write to file for inspection
        fs.writeFileSync('models_full_dump.json', JSON.stringify(response, null, 2));
        console.log("Full model list dumped to models_full_dump.json");

        if (response.models) {
             response.models.forEach((m: any) => {
                 if (m.name.includes('gemini')) {
                     console.log(`- ${m.name}`);
                 }
             });
        }
        return;
    }
    
    console.log("Could not find a standard list method via ai.models.list().");
    
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
