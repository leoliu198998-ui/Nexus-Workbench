import { NextResponse } from 'next/server';
import { WeComService } from '@/lib/services/wecom';
import fs from 'fs';
import path from 'path';
import axios from 'axios'; // Add axios import

// Force load .env for debugging purposes if variables are missing
const loadEnv = () => {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const envConfig = fs.readFileSync(envPath, 'utf8');
      envConfig.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
    }
  } catch (e) {
    console.error('Failed to load .env manually:', e);
  }
};

export async function POST(request: Request) {
  loadEnv(); // Ensure env is loaded

  try {
    const { content, title, docName } = await request.json();

    if (!content || !docName) {
      return NextResponse.json(
        { error: 'Content and Document Name are required' },
        { status: 400 }
      );
    }

    console.log('[Sync API] Starting Sync...');
    console.log('[Sync API] Env Check - WECOM_SPACE_ID:', process.env.WECOM_SPACE_ID ? 'OK' : 'MISSING');
    console.log('[Sync API] Env Check - WECOM_FOLDER_PATH:', process.env.WECOM_FOLDER_PATH);

    const wecom = new WeComService();
    
    const useStandard = process.env.WECOM_USE_WEDOC_STANDARD !== '0';
    console.log('[Sync API] Mode - WECOM_USE_WEDOC_STANDARD:', useStandard ? 'STANDARD' : 'SPACE');
    console.log('[Sync API] Standard Folder - WEDOC_FOLDER_ID:', process.env.WEDOC_FOLDER_ID || '(root)');
    let docId: string | null = null;
    console.log(`[Sync API] Finding doc: ${docName}`);
    if (useStandard) {
      docId = await wecom.findDocIdByNameStandard(docName);
      if (!docId) {
        docId = await wecom.createDocStandard(docName);
        console.log(`[Sync API] Created standard doc: ${docId}`);
      } else {
        console.log(`[Sync API] Found standard doc: ${docId}`);
      }
    } else {
      docId = await wecom.findDocIdByName(docName, 3);
      if (!docId) {
        docId = await wecom.createDoc(docName);
        console.log(`[Sync API] Created space doc: ${docId}`);
      } else {
        console.log(`[Sync API] Found space doc: ${docId}`);
      }
    }

    // 2. Update Content (Replace)
    const updateContent = `${title}\n\n${content}`;
    if (useStandard && docId) {
      await wecom.updateDocByDocId(docId, updateContent);
      const version = await wecom.getDocVersion(docId);
      const shareUrl = await wecom.getDocShareUrl(docId);
      console.log('[Sync API] Update successful, docid:', docId, 'version:', version, 'url:', shareUrl);
      return NextResponse.json({ success: true, docId, version, url: shareUrl });
    } else if (docId) {
      await wecom.updateDoc(docId, updateContent);
      console.log('[Sync API] Update successful (space mode), fileid:', docId);
      return NextResponse.json({ success: true, docId });
    }

    return NextResponse.json({ success: false, error: 'No docId' }, { status: 500 });
  } catch (error: unknown) {
    console.error('WeCom Sync Error Full:', error);
    
    // Check for Axios Error
    if (axios.isAxiosError(error) && error.response) {
      console.error('Axios Response Status:', error.response.status);
      console.error('Axios Response Data:', error.response.data);
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: `Sync Failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
