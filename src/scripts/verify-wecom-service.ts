import fs from 'fs';
import path from 'path';
import axios from 'axios';

// Manually load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

// Import WeComService
// Note: We need to use dynamic import or require because of tsx/module resolution in scripts sometimes
import { WeComService } from '../lib/services/wecom';

async function run() {
    console.log('=== WeComService Verification ===');
    console.log('WECOM_FOLDER_PATH:', process.env.WECOM_FOLDER_PATH);
    console.log('WECOM_SPACE_ID:', process.env.WECOM_SPACE_ID);

    const service = new WeComService();
    const docName = "Iteration 110 Butter Release Notes";

    try {
        console.log(`\nStep 1: Find Document "${docName}"...`);
        // Check if we can resolve folder ID first (internal method, but we can infer from findDocIdByName)
        const docId = await service.findDocIdByName(docName);
        
        if (docId) {
            console.log(`✅ Document Found! ID: ${docId}`);
            
            console.log(`\nStep 2: Append Test Data...`);
            await service.appendSheetRows(docId, "Debug Test", ["Row 1: Sync Test", "Row 2: " + new Date().toISOString()]);
            console.log(`✅ Append Successful!`);
        } else {
            console.log(`⚠️ Document NOT found.`);
            
            console.log(`\nStep 2: Create Document...`);
            const newDocId = await service.createSheet(docName);
            console.log(`✅ Document Created! ID: ${newDocId}`);
        }

    } catch (error: unknown) {
        console.error('\n❌ ERROR OCCURRED:');
        if (axios.isAxiosError(error)) {
            console.error('Status:', error.response?.status);
            console.error('Status Text:', error.response?.statusText);
            console.error('URL:', error.config?.url);
            console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        } else {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(msg);
        }
    }
}

run();