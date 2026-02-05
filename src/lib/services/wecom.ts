import axios from 'axios';
import fs from 'fs';
import path from 'path';

interface WeComTokenResponse {
  errcode: number;
  errmsg: string;
  access_token: string;
  expires_in: number;
}

interface WeComDocListResponse {
  errcode: number;
  errmsg: string;
  doc_list: {
    docid: string;
    doc_name: string;
    doc_type: number; // 3: doc, 4: sheet
  }[];
  next_index: number;
  has_more: boolean;
}

interface WeDriveFile {
  fileid: string;
  file_name: string;
  file_type?: number;
}

interface WeDriveListResponse {
  errcode: number;
  errmsg: string;
  file_list: WeDriveFile[] | { item: WeDriveFile[] };
}

interface WeComCreateDocResponse {
  errcode: number;
  errmsg: string;
  docid: string;
  url: string;
}

export class WeComService {
  private corpId: string;
  private secret: string;
  private accessToken: string = '';
  private tokenExpiresAt: number = 0;
  private targetFolderPath: string;
  private spaceId: string;
  private cachedFolderId: string | null = null;
  private docStorePath: string;

  constructor() {
    this.corpId = process.env.WECOM_CORP_ID || '';
    this.secret = process.env.WECOM_SECRET || '';
    this.targetFolderPath = process.env.WECOM_FOLDER_PATH || '';
    this.spaceId = process.env.WECOM_SPACE_ID || '';
    this.docStorePath = path.resolve(process.cwd(), 'data/wecom-docids.json');
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${this.corpId}&corpsecret=${this.secret}`;
    try {
      const res = await axios.get<WeComTokenResponse>(url);
      if (res.data.errcode !== 0) {
        throw new Error(`WeCom Auth Failed: ${res.data.errmsg}`);
      }

      this.accessToken = res.data.access_token;
      this.tokenExpiresAt = Date.now() + (res.data.expires_in - 300) * 1000; // Buffer 5 mins
      return this.accessToken;
    } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.error(`[WeComService] GetToken Failed. URL: ${url}`, errorMessage);
        throw e;
    }
  }

  /**
   * Resolves the configured folder path to a folder_id.
   * e.g., "A/B/C" -> finds ID of C inside B inside A.
   */
  private async listContents(folderId: string): Promise<{id: string, name: string, type: number}[]> {
    const token = await this.getAccessToken();
    
    // 1. Try WeDoc List API first - This returns standard docids that work with update APIs
    try {
        const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/list?access_token=${token}`;
        const res = await axios.post<WeComDocListResponse>(url, { folder_id: folderId, limit: 100 });
        if (res.data.errcode === 0 && Array.isArray(res.data.doc_list)) {
            console.log(`[WeComService] listContents (WeDoc) found ${res.data.doc_list.length} docs`);
            return res.data.doc_list.map(d => ({ id: d.docid, name: d.doc_name, type: d.doc_type }));
        }
    } catch (e) {
        console.warn(`[WeComService] WeDoc List failed, falling back to WeDrive:`, e);
    }

    // 2. Fallback to WeDrive API if WeDoc list is not supported or fails
    if (this.spaceId) {
        const url = `https://qyapi.weixin.qq.com/cgi-bin/wedrive/file_list?access_token=${token}`;
        const payload = {
            spaceid: this.spaceId,
            fatherid: folderId,
            limit: 100
        };
        const res = await axios.post<WeDriveListResponse>(url, payload);
        if (res.data.errcode !== 0) {
             throw new Error(`Failed to list space folder '${folderId}': ${res.data.errmsg}`);
        }
        
        console.log(`[WeComService] listContents (WeDrive) raw response:`, JSON.stringify(res.data));
        
        let fileList: WeDriveFile[] = [];
        const rawList = res.data.file_list;

        if (Array.isArray(rawList)) {
            fileList = rawList;
        } else {
            const listObj = rawList as { item: WeDriveFile[] };
            if (listObj && Array.isArray(listObj.item)) {
                fileList = listObj.item;
            }
        }
        
        return fileList.map(f => ({ id: f.fileid, name: f.file_name, type: f.file_type || 0 }));
    } else {
        // Standard folder fallback
        const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/list?access_token=${token}`;
        const res = await axios.post<WeComDocListResponse>(url, { folder_id: folderId, limit: 100 });
        if (res.data.errcode !== 0) throw new Error(`List failed: ${res.data.errmsg}`);
        return res.data.doc_list.map(d => ({ id: d.docid, name: d.doc_name, type: d.doc_type }));
    }
  }

  // Lightweight local docid store
  private ensureStoreDir() {
    const dir = path.dirname(this.docStorePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.docStorePath)) fs.writeFileSync(this.docStorePath, JSON.stringify({}), 'utf8');
  }

  private loadDocStore(): Record<string, string> {
    try {
      this.ensureStoreDir();
      const raw = fs.readFileSync(this.docStorePath, 'utf8');
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  }

  private saveDocStore(store: Record<string, string>) {
    this.ensureStoreDir();
    fs.writeFileSync(this.docStorePath, JSON.stringify(store, null, 2), 'utf8');
  }

  /**
   * Resolves the configured folder path to a folder_id.
   * e.g., "A/B/C" -> finds ID of C inside B inside A.
   */
  private async resolveFolderId(): Promise<string> {
    if (this.cachedFolderId) return this.cachedFolderId;
    
    // Start from Space ID if available, otherwise Root
    let currentFolderId = this.spaceId || ''; 
    
    if (!this.targetFolderPath) return currentFolderId;

    const parts = this.targetFolderPath.split('/').filter(p => p.trim());
    
    // If the only part is "发布管理" and we are already at the space root, just return the space ID.
    if (parts.length === 1 && (parts[0] === '发布管理' || parts[0] === 'Butter项目组文档') && this.spaceId) {
        console.log(`Path is just the Space Name '${parts[0]}'. Using Space ID directly.`);
        this.cachedFolderId = this.spaceId;
        return this.spaceId;
    }

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Special Case: If we are at the Space Root, and the path segment matches the Space Name (e.g. "发布管理"),
      // we assume the user included the space name in the path, so we skip it and stay at Space Root.
      if (currentFolderId === this.spaceId && (part === '发布管理' || part === 'Butter项目组文档')) {
          console.log(`Path segment '${part}' matches Space Name. Skipping resolution for this segment.`);
          continue;
      }

      const contents = await this.listContents(currentFolderId);
      const match = contents.find(c => c.name === part);
      
      if (!match) {
        // Folder not found in path
        throw new Error(`Folder '${part}' not found in path '${this.targetFolderPath}'`);
      }
      
      currentFolderId = match.id;
    }

    this.cachedFolderId = currentFolderId;
    return currentFolderId;
  }

  /**
   * Find a document ID by name in the configured folder.
   */
  async findDocIdByName(name: string, fileType?: number): Promise<string | null> {
    const folderId = await this.resolveFolderId();
    try {
        const contents = await this.listContents(folderId);
        // Find match with name AND (optional) fileType
        const match = contents.find(c => c.name === name && (!fileType || c.type === fileType));
        return match ? match.id : null;
    } catch (e) {
        console.warn(`WeCom List Docs Failed: ${e}`);
        return null;
    }
  }

  /**
   * Create a new Document (file_type=3).
   */
  async createDoc(name: string): Promise<string> {
    const token = await this.getAccessToken();
    const folderId = await this.resolveFolderId();
    
    console.log(`[WeComService] Creating Doc: ${name} in folder ${folderId}`);
    
    // Always use WeDoc Create API if possible, as it returns a proper docid immediately
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/create_doc?access_token=${token}`;
    
    const payload: Record<string, unknown> = {
        doc_type: 3, 
        doc_name: name
    };

    if (this.spaceId) {
        payload.spaceid = this.spaceId;
        payload.fatherid = folderId;
    } else {
        payload.folder_id = folderId;
    }
    
    const res = await axios.post<WeComCreateDocResponse>(url, payload);
    if (res.data.errcode === 0) {
        console.log(`[WeComService] Created doc successfully. DocId: ${res.data.docid}`);
        return res.data.docid;
    }

    // Fallback logic removed as wedoc/create_doc covers both scenarios if params are correct.
    throw new Error(`WeCom Create Doc Failed: ${res.data.errmsg}`);
  }

  /**
   * Create a new Smart Sheet.
   */
  async createSheet(name: string): Promise<string> {
    const token = await this.getAccessToken();
    const folderId = await this.resolveFolderId();
    
    // If we are in a Space (WeDrive), we MUST use the WeDrive Create API
    if (this.spaceId) {
        console.log(`[WeComService] Creating sheet in Space: ${this.spaceId}, Parent: ${folderId}`);
        const url = `https://qyapi.weixin.qq.com/cgi-bin/wedrive/file_create?access_token=${token}`;
        
        const payload = {
            spaceid: this.spaceId,
            fatherid: folderId,
            file_type: 4, // 4 = Smart Sheet
            file_name: name
        };
        
        const res = await axios.post<WeDriveFile>(url, payload);
        
        // Note: wedrive/file_create returns different error structure sometimes, 
        // but typically follows errcode/errmsg pattern or direct object if success in some legacy versions.
        // Let's assume standard response based on docs.
        const responseData = res.data as { errcode?: number; errmsg?: string; fileid: string }; 
        
        if (responseData.errcode && responseData.errcode !== 0) {
            throw new Error(`WeDrive Create Failed: ${responseData.errmsg}`);
        }
        
        // Success: returns fileid
        return responseData.fileid;
    } else {
        // Legacy/Standard Doc API
        const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/create_doc?access_token=${token}`;
        const payload = {
            doc_type: 4, 
            doc_name: name,
            folder_id: folderId
        };
        const res = await axios.post<WeComCreateDocResponse>(url, payload);
        if (res.data.errcode !== 0) {
             throw new Error(`WeCom Create Sheet Failed: ${res.data.errmsg}`);
        }
        return res.data.docid;
    }
  }

  /**
   * Update Document content.
   * Note: This inserts content at the beginning.
   */
  async updateDoc(fileId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    let targetDocId = fileId;
    let docVersion: number | undefined;

    // 1) 通过 WeDrive 映射为有效 docid（不使用 URL 中的 w3_ 字串）
    if (targetDocId.startsWith('s.')) {
      const infoUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedrive/file_info?access_token=${token}`;
      try {
        const infoRes = await axios.post(infoUrl, { fileid: fileId });
        if (infoRes.data.errcode === 0 && infoRes.data.file_info && infoRes.data.file_info.docid) {
          targetDocId = infoRes.data.file_info.docid;
        } else {
          console.warn(`[WeComService] 无法通过 wedrive/file_info 获取有效 docid，尝试直接使用 fileid`);
        }
      } catch (e) {
        console.error(`[WeComService] 获取 docid 失败:`, e);
      }
    }

    // 2) 校验 docid 并获取最新 version
    const getUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/get?access_token=${token}`;
    const getRes = await axios.post(getUrl, { docid: targetDocId });
    
    // API 文档显示 version 在根节点，而不是 doc_info 内
    // Response: { errcode: 0, doc_info: {...}, version: 123 }
    if (getRes.data.errcode === 0 && typeof getRes.data.version === 'number') {
      docVersion = getRes.data.version;
    } else {
      console.warn(`[WeComService] 获取文档版本可能失败，API响应:`, JSON.stringify(getRes.data));
      // 尝试从 doc_info 获取作为 fallback，虽然官方文档没说
      if (getRes.data.doc_info && typeof getRes.data.doc_info.version === 'number') {
          docVersion = getRes.data.doc_info.version;
      } else {
          // 如果获取不到版本，可能导致冲突，但在 batch_update 中 version 是可选的（如果不传则不校验冲突）
          // 但为了安全，最好有。如果这里没有，我们暂且设为 undefined
      }
    }
    
    // 3) 提交 batch_update
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/batch_update?access_token=${token}`;
    const payload: Record<string, unknown> = {
      docid: targetDocId,
      requests: [
        {
          insert_text: {
            text: content + "\n\n",
            location: { index: 0 }
          }
        },
        {
          update_text_property: {
            text_property: {
              // 5号字体约等于 10.5pt，API 可能需要整数或特定值
              font_size: 10
            },
            ranges: [
              {
                start_index: 0,
                length: content.length
              }
            ]
          }
        }
      ]
    };

    if (docVersion !== undefined) {
        payload.version = docVersion;
    }
    
    const res = await axios.post(url, payload);
    if (res.data.errcode !== 0) {
      throw new Error(`文档更新失败: ${res.data.errmsg} (errcode=${res.data.errcode})`);
    }
  }

  /**
   * Append content to a Smart Sheet.
   * Assumes the content is a list of strings (rows).
   */
  async appendSheetRows(docId: string, title: string, contentLines: string[]): Promise<void> {
    const token = await this.getAccessToken();
    
    const addUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/add_rows?access_token=${token}`;
    
    // We construct rows.
    // Each row is an object.
    const rows = contentLines.map(line => ({
        values: [{ text: line }] // Col A
    }));

    // Add a header row with the Title
    rows.unshift({ values: [{ text: `--- ${title} ---` }] });

    const propsUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/smartsheet/get_sheet_properties?access_token=${token}`;
    const propsRes = await axios.post(propsUrl, { docid: docId });
    
    if (propsRes.data.errcode !== 0) {
        throw new Error(`Failed to get sheet props: ${propsRes.data.errmsg}`);
    }
    
    const sheetId = propsRes.data.properties?.[0]?.sheet_id;
    if (!sheetId) throw new Error("No sheet found in doc");

    const payload = {
      docid: docId,
      sheet_id: sheetId,
      add_rows: rows
    };

    const res = await axios.post(addUrl, payload);
    if (res.data.errcode !== 0) {
      throw new Error(`WeCom Sync Failed: ${res.data.errmsg}`);
    }
  }

  async findDocIdByNameStandard(name: string): Promise<string | null> {
    // 1) prefer local store
    const store = this.loadDocStore();
    if (store[name]) return store[name];

    const token = await this.getAccessToken();
    const folderId = process.env.WEDOC_FOLDER_ID || '';
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/list?access_token=${token}`;
    const payload: Record<string, unknown> = { limit: 100 };
    if (folderId) payload.folder_id = folderId;
    try {
      const res = await axios.post<WeComDocListResponse>(url, payload);
      if (res.data.errcode !== 0) return null;
      const match = (res.data.doc_list || []).find(d => d.doc_name === name && d.doc_type === 3);
      if (match?.docid) {
        store[name] = match.docid;
        this.saveDocStore(store);
        return match.docid;
      }
      return null;
    } catch (e) {
      console.warn(`[WeComService] WeDoc list failed in standard mode, will create instead:`, e);
      return null;
    }
  }

  async createDocStandard(name: string): Promise<string> {
    const token = await this.getAccessToken();
    const folderId = process.env.WEDOC_FOLDER_ID || '';
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/create_doc?access_token=${token}`;
    const payload: Record<string, unknown> = { doc_type: 3, doc_name: name };
    if (folderId) payload.folder_id = folderId;
    if (this.spaceId) {
      const father = await this.resolveFolderId();
      payload.spaceid = this.spaceId;
      payload.fatherid = father || this.spaceId;
      console.log(
        `[WeComService] create_doc in space:`,
        `spaceid=`, this.spaceId,
        `fatherid=`, payload.fatherid
      );
    }
    const res = await axios.post<WeComCreateDocResponse>(url, payload);
    if (res.data.errcode !== 0) throw new Error(res.data.errmsg);
    const docid = res.data.docid;
    const store = this.loadDocStore();
    store[name] = docid;
    this.saveDocStore(store);
    return docid;
  }

  async updateDocByDocId(docId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    const getUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/get?access_token=${token}`;
    const getRes = await axios.post(getUrl, { docid: docId });
    if (getRes.data.errcode !== 0 || typeof getRes.data.version !== 'number') {
      throw new Error(getRes.data.errmsg || '获取文档版本失败');
    }
    const version = getRes.data.version;
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/batch_update?access_token=${token}`;
    const payload = {
      docid: docId,
      version,
      requests: [
        {
          insert_text: {
            text: content,
            location: { index: 0 }
          }
        }
        ,
        {
          update_text_property: {
            text_property: {
              // 5号字体约等于 10.5pt，接口若需整数将自动取整
              font_size: 10.5
            },
            ranges: [
              {
                start_index: 0,
                length: content.length
              }
            ]
          }
        }
      ]
    };
    const res = await axios.post(url, payload);
    if (res.data.errcode !== 0) throw new Error(res.data.errmsg);
  }

  async getDocVersion(docId: string): Promise<number | null> {
    const token = await this.getAccessToken();
    const getUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/document/get?access_token=${token}`;
    const getRes = await axios.post(getUrl, { docid: docId });
    if (getRes.data.errcode !== 0 || typeof getRes.data.version !== 'number') {
      return null;
    }
    return getRes.data.version as number;
  }

  async getDocShareUrl(docId: string): Promise<string | null> {
    const token = await this.getAccessToken();
    const url = `https://qyapi.weixin.qq.com/cgi-bin/wedoc/doc_share?access_token=${token}`;
    const res = await axios.post(url, { docid: docId });
    if (res.data.errcode !== 0 || typeof res.data.share_url !== 'string') {
      return null;
    }
    return res.data.share_url as string;
  }
}
