import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const apiKey = envConfig.GEMINI_API_KEY;

if (!apiKey) {
  console.error("API Key not found");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-001',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-001',
  'gemini-pro',
  'gemini-1.0-pro',
  'gemini-2.0-flash-exp'
];

async function testModels() {
  for (const modelName of modelsToTest) {
    console.log(`Testing model: ${modelName}...`);
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Hello, are you working?"
      });
      console.log(`✅ SUCCESS: ${modelName} worked!`);
      // console.log("Response:", response.text);
      return; // Stop after first success
    } catch (e: any) {
      console.log(`❌ FAILED: ${modelName}`);
      if (e.message) console.log(`   Error: ${e.message.substring(0, 200)}...`);
    }
  }
}

testModels();
