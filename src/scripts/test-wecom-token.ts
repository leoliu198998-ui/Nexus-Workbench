import axios, { AxiosError } from 'axios';
import fs from 'fs';
import path from 'path';

// 手动加载 .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // 去除可能的引号
      process.env[key] = value;
    }
  });
}

interface WeComSimpleUser {
  userid: string;
  name: string;
  department: number[];
}

interface WeDriveSpace {
  spaceid: string;
  space_name: string;
  auth_info?: unknown;
}

interface WeDriveFile {
  fileid: string;
  file_name: string;
  file_type?: number;
}

interface WeDriveListResponse {
  errcode: number;
  errmsg: string;
  file_list: WeDriveFile[];
}

interface WeDriveSpaceListResponse {
  errcode: number;
  errmsg: string;
  space_list: WeDriveSpace[];
}

interface WeDocCreateResponse {
  errcode: number;
  errmsg: string;
  docid: string;
  url: string;
}

const CORP_ID = process.env.WECOM_CORP_ID;
const SECRET = process.env.WECOM_SECRET;

async function testToken() {
  console.log('=== WeCom Token Test ===');
  console.log(`CorpID: ${CORP_ID}`);
  console.log(`Secret: ${SECRET ? SECRET.slice(0, 5) + '...' : 'undefined'}`);

  if (!CORP_ID || !SECRET) {
    console.error('Error: Missing CorpID or Secret in .env');
    return;
  }

  const url = `https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${CORP_ID}&corpsecret=${SECRET}`;
  
  try {
    console.log('Requesting Access Token...');
    const res = await axios.get(url);
    
    if (res.data.errcode === 0) {
      console.log('✅ Success! Access Token retrieved.');
      const token = res.data.access_token;
      console.log(`Token: ${token.slice(0, 10)}...`);
      console.log('Conclusion: IP Whitelist is working. Secret is correct.');

      // Step 1: Try to auto-discover users from Root Department (ID=1)
      // This is CRITICAL to fix 60111 error. We need the real UserID.
      let targetUserId = process.env.WECOM_TEST_USER_ID || "";
      if (targetUserId) {
          console.log(`\n[Config] Found WECOM_TEST_USER_ID in .env: ${targetUserId}`);
      }
      
      try {
        if (!targetUserId) {
            console.log('\n=== Discovering Users (to fix UserID not found) ===');
            console.log('Attempting to list users from Root Department (ID=1)...');
            const userListUrl = `https://qyapi.weixin.qq.com/cgi-bin/user/simplelist?access_token=${token}&department_id=1&fetch_child=1`;
            const userListRes = await axios.get(userListUrl);
            
            if (userListRes.data.errcode === 0 && userListRes.data.userlist && userListRes.data.userlist.length > 0) {
            console.log('✅ Found users:');
            userListRes.data.userlist.slice(0, 10).forEach((u: WeComSimpleUser) => {
                console.log(` -> Name: [${u.name}] | UserID: [${u.userid}]`);
            });
            
            targetUserId = userListRes.data.userlist[0].userid;
            console.log(`\nAuto-selected first UserID: ${targetUserId}`);
            } else {
                console.log('⚠️ Could not list users (Permission Denied or Empty).');
                if (userListRes.data.errcode !== 0) {
                    console.log(`   Error: ${userListRes.data.errcode} - ${userListRes.data.errmsg}`);
                }
            }
        }
      } catch (_e) {
        console.log('⚠️ Network error during user discovery.');
      }

      // Fallback
      if (!targetUserId) {
          console.log('⚠️ No UserID found in .env or Discovery. Falling back to "houmingguo".');
          targetUserId = "houmingguo";
      }

      // Diagnostic: Check Department List to verify App Visibility Scope
      console.log('\n=== Diagnostic: Checking App Visibility ===');
      const deptListUrl = `https://qyapi.weixin.qq.com/cgi-bin/department/list?access_token=${token}`;
      try {
          const deptRes = await axios.get(deptListUrl);
          if (deptRes.data.errcode === 0) {
              console.log('✅ App can access Department List.');
          } else {
              console.error('⚠️ App cannot access Department List.');
          }
      } catch (deptErr) {
           console.log('⚠️ Network error checking departments.');
      }

      // Test WeDrive Path Resolution using Known Space ID
      let spaceId = process.env.WECOM_SPACE_ID;
      
      if (!spaceId) {
          console.log('\n⚠️ No WECOM_SPACE_ID in .env. Attempting to discover spaces for user...');
          // Try to list spaces to find "Butter项目组文档"
          // We assume the user has access.
          const spaceListUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedrive/space_list?access_token=${token}`;
          try {
              // Try with the found targetUserId
              const spaceRes = await axios.post<WeDriveSpaceListResponse>(spaceListUrl, { userid: targetUserId });
              if (spaceRes.data.errcode === 0) {
                  const spaces = spaceRes.data.space_list || [];
                  console.log(`✅ Found ${spaces.length} spaces for user ${targetUserId}:`);
                  spaces.forEach(s => console.log(` - ${s.space_name} (ID: ${s.spaceid})`));
                  
                  const targetSpace = spaces.find(s => s.space_name.includes('Butter') || s.space_name.includes('项目组'));
                  if (targetSpace) {
                      spaceId = targetSpace.spaceid;
                      console.log(`\n🎯 Auto-detected likely target space: [${targetSpace.space_name}] ID: ${spaceId}`);
                      console.log('👉 Please add this ID to your .env file as WECOM_SPACE_ID');
                  }
              }
          } catch (e) {
              console.log('⚠️ Could not list spaces (API might be restricted or 404). Manual ID required.');
          }
      }

      if (!spaceId) {
          // Fallback to the example one only if we really have nothing, but warn heavily
          spaceId = 's.1970325061031686.631245655er1'; 
          console.log(`\n⚠️ Using EXAMPLE Space ID: ${spaceId} (Likely Incorrect!)`);
      } else {
          console.log(`\n=== Testing Path Resolution in Space: ${spaceId} ===`);
      }

      console.log('Target Path: Butter项目组文档/升级记录/Release Notes/Butter Release Notes');
      
      try {
          // 1. List Root of the Space
          console.log(`\n1. Listing Root of Space (${spaceId})...`);
          const listUrl = `https://qyapi.weixin.qq.com/cgi-bin/wedrive/file_list?access_token=${token}`;
          
          // Note: For file_list, if we want root, we usually pass spaceid as fatherid too, or omit fatherid?
          // Docs say: fatherid is parent folder ID. For root, it's usually the spaceid itself.
          // 40203 deprecated parameter often means userid is no longer needed/allowed for app tokens here
          const listPayload = { 
              spaceid: spaceId, 
              fatherid: spaceId, 
              limit: 100 
          };
          
          const listRes = await axios.post<WeDriveListResponse>(listUrl, listPayload);
          
          if (listRes.data.errcode === 0) {
              console.log('✅ Space Root Listed!');
              // ... (Success logic unchanged)
              const files = listRes.data.file_list || [];
              console.log(`Found ${files.length} files/folders in root.`);
              
              files.slice(0, 10).forEach((f) => {
                 console.log(` - [${f.file_type === 1 ? 'Folder' : 'File'}] ${f.file_name} (ID: ${f.fileid})`);
              });

          } else {
              console.error(`❌ Failed to list space root: ${listRes.data.errcode} - ${listRes.data.errmsg}`);
              if (listRes.data.errcode === 640008) {
                  console.log('\n🚨🚨🚨 CRITICAL PERMISSION ERROR 🚨🚨🚨');
                  // ... (Error message unchanged)
                  console.log('Error 640008 means "Permission Denied".');
                  console.log('Your App Token is valid, BUT the App is NOT a member of this WeDrive Space.');

                  console.log('-----------------------------------------------------------------------');
                  console.log('👉 ACTION REQUIRED:');
                  console.log('1. Open WeCom App (Desktop/Mobile).');
                  console.log('2. Go to "WeDrive" (微盘) -> Find the Space (or matching Space ID).');
                  console.log('3. Click "..." or Settings -> "Member Management" (成员管理).');
                  console.log('4. Click "Add Member" -> Select your App "Nexus-Workbench" from the address book.');
                  console.log('   (You might need to search for it in the "Apps" tab or by name).');
                  console.log('-----------------------------------------------------------------------');
              }
          }
      } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          console.error(`❌ Network Error: ${msg}`);
      }

    } else {
      console.error('❌ Failed to get token.');
      console.error(`Error Code: ${res.data.errcode}`);
      console.error(`Error Msg: ${res.data.errmsg}`);
      
      if (res.data.errcode === 48002) {
         console.error('Analysis: Still IP Forbidden. Please double check IP Whitelist settings.');
      }
    }
  } catch (error) {
    console.error('Network Error:', error);
  }
}

testToken();