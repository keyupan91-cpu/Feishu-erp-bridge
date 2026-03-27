import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { TaskExecutor, TaskStatus, getRunningTasks, addRunningTask, removeRunningTask, getRunningTask } from './taskExecutor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 閹嗗厴娴兼ê瀵查敍姘▏閻劌鍞寸€涙绱︾€涙ê噺灏戞枃浠惰鍙?
const cache = new Map();
const CACHE_TTL = 5000; // 5 缁夋帞绱︾€?

const app = express();
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kingdee-sync-secret-key-2024';
const DATA_DIR = path.join(__dirname, 'data');

// 閸樺缂夋稉顓㈡？娴?- 閸戝繐鐨导鐘虹翻閺佺増宓侀柌?
app.use((req, res, next) => {
  const gzip = require('zlib').gzip;
  const origWrite = res.write.bind(res);
  const origEnd = res.end.bind(res);

  if (req.headers['accept-encoding']?.includes('gzip')) {
    const chunks = [];
    res.write = (chunk) => {
      if (chunk !== null) chunks.push(Buffer.from(chunk));
      return true;
    };
    res.end = (chunk) => {
      if (chunk) chunks.push(Buffer.from(chunk));
      if (chunks.length > 0) {
        const data = Buffer.concat(chunks);
        gzip(data, (err, compressed) => {
          if (!err) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', compressed.length);
            origWrite(compressed);
          } else {
            origWrite(data);
          }
          origEnd();
        });
        return;
      }
      origEnd();
    };
  }
  next();
});

// 涓棿浠?
app.use(cors());
app.use(express.json({ limit: '100mb' }));

// 鐠囬攱鐪伴弮銉ョ箶娑擃參妫挎禒?
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] --> ${req.method} ${req.url}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] <-- ${req.method} ${req.url} ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// 缂傛挸鐡ㄦ稉顓㈡？娴?
function cacheMiddleware(ttl = CACHE_TTL) {
  return (req, res, next) => {
    if (req.method !== 'GET') return next();

    const cacheKey = `cache:${req.originalUrl}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }

    // 鎷︽埅鍝嶅簲
    const origJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return origJson(data);
    };

    next();
  };
}

// 定期清理缓存
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL * 2) {
      cache.delete(key);
    }
  }
}, CACHE_TTL * 2);

// 绾喕绻氶弫鐗堝祦閻╊喖缍嶇€涙ê婀?
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// 閼惧嘲褰囩拹锔藉煕娑撶粯鏋冩禒鎯扮熅瀵?
function getAccountFilePath(username) {
  return path.join(DATA_DIR, `${username}.json`);
}

// 鑾峰彇璐︽埛鎵ц璁板綍鐩綍
function getAccountInstancesDir(username) {
  return path.join(DATA_DIR, `${username}_instances`);
}

// 鑾峰彇璐︽埛鏃ュ織鐩綍
function getAccountLogsDir(username) {
  return path.join(DATA_DIR, `${username}_logs`);
}

// 閼惧嘲褰囬弮銉ョ箶閺傚洣娆㈢捄顖氱窞
function getLogFilePath(username, instanceId) {
  return path.join(getAccountLogsDir(username), `${instanceId}.json`);
}

// 閼惧嘲褰囬幍褑顢戠拋鏉跨秿閺傚洣娆㈢捄顖氱窞
function getInstanceFilePath(username, filename) {
  return path.join(getAccountInstancesDir(username), filename);
}

// 閻㈢喐鍨氶幍褑顢戠拋鏉跨秿閺傚洣娆㈤崥?
function generateInstanceFileName(taskName, startTime) {
  const sanitizedName = taskName.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  const timestamp = new Date(startTime).toISOString().replace(/[:.]/g, '-');
  return `${sanitizedName}_${timestamp}.json`;
}

// 妤犲矁鐦?Token 涓棿浠?- 娴兼ê瀵查敍姘▏閻劎绱︾€涙﹢鐛欑拠浣虹波閺?
const tokenCache = new Map();
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  // 濡偓閺屻儳绱︾€?
  const cached = tokenCache.get(token);
  if (cached && Date.now() - cached.timestamp < 60000) {
    req.user = cached.user;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    tokenCache.set(token, { user: decoded, timestamp: Date.now() });
    next();
  } catch (error) {
    tokenCache.delete(token);
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

// 娣囨繂鐡?WebAPI 閺冦儱绻?- 閸欘亙绻氱€涙顑囨稉鈧弶陇顔囪ぐ鏇犳畱閺冦儱绻?
async function saveWebApiLog(username, instanceId, logData) {
  const logsDir = getAccountLogsDir(username);

  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }

  const logFilePath = getLogFilePath(username, instanceId);

  // 濡偓閺屻儲妲搁崥锕€鍑＄€涙ê婀弮銉ョ箶閺傚洣娆㈤敍灞筋洤閺嬫粌鐡ㄩ崷銊ュ灟娑撳秴鍟€娣囨繂鐡ㄩ敍鍫濆涧娣囨繂鐡ㄧ粭顑跨閺夆槄绱?
  try {
    await fs.access(logFilePath);
    console.log(`閺冦儱绻旈弬鍥︽瀹告彃鐡ㄩ崷顭掔礉鐠哄疇绻冩穱婵嗙摠: ${instanceId}`);
    return false;
  } catch {
    // 閺傚洣娆㈡稉宥呯摠閸︻煉绱濋崣顖欎簰娣囨繂鐡?
  }

  const logEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    instanceId,
    timestamp: new Date().toISOString(),
    ...logData,
  };

  await fs.writeFile(logFilePath, JSON.stringify(logEntry, null, 2));
  console.log(`WebAPI 閺冦儱绻斿韫箽鐎? ${instanceId}`);
  return true;
}

// 鑾峰彇鏃ュ織
async function getWebApiLog(username, instanceId) {
  const logFilePath = getLogFilePath(username, instanceId);

  try {
    const data = await fs.readFile(logFilePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

// 鍒犻櫎鏃ュ織
async function deleteWebApiLog(username, instanceId) {
  const logFilePath = getLogFilePath(username, instanceId);

  try {
    await fs.unlink(logFilePath);
    return true;
  } catch {
    return false;
  }
}

// 閸掓繂顫愰崠鏍閹撮攱鏆熼幑顔剧波閺?
async function initAccountData(username) {
  const accountPath = getAccountFilePath(username);
  const instancesDir = getAccountInstancesDir(username);
  const logsDir = getAccountLogsDir(username);

  try {
    await fs.access(accountPath);
  } catch {
    const accountData = {
      account: null,
      tasks: [],
      lastModified: new Date().toISOString(),
    };
    await fs.writeFile(accountPath, JSON.stringify(accountData, null, 2));
  }

  try {
    await fs.access(instancesDir);
  } catch {
    await fs.mkdir(instancesDir, { recursive: true });
  }

  try {
    await fs.access(logsDir);
  } catch {
    await fs.mkdir(logsDir, { recursive: true });
  }
}

// 鐠囪褰囩拹锔藉煕閺佺増宓?- 娴兼ê瀵查敍姘嫙鐞涘矁顕伴崣鏍ㄦ瀮娴?
async function readAccountData(username) {
  const accountPath = getAccountFilePath(username);
  const instancesDir = getAccountInstancesDir(username);

  try {
    const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));

    const taskInstances = [];
    try {
      await fs.access(instancesDir);
      const files = await fs.readdir(instancesDir);

      // 楠炴儼顢戠拠璇插絿閹碘偓閺堝墽琛岃褰曟枃浠?
      const readPromises = files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          try {
            return JSON.parse(await fs.readFile(path.join(instancesDir, file), 'utf8'));
          } catch {
            return null;
          }
        });

      const results = await Promise.all(readPromises);
      results.filter(r => r).forEach(r => taskInstances.push(r));
    } catch {
      // 閻╊喖缍嶆稉宥呯摠閸︺劍鍨ㄦ稉铏光敄
    }

    // 閹稿绱戞慨瀣闂存帓搴?
    taskInstances.sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0));

    return { ...data, taskInstances };
  } catch (error) {
    throw new Error('璇诲彇璐︽埛鏁版嵁澶辫触');
  }
}

// 娣囨繂鐡ㄧ拹锔藉煕娑撶粯鏆熼幑?
async function saveAccountData(username, data) {
  const accountPath = getAccountFilePath(username);
  const { taskInstances, ...accountData } = data;

  await fs.writeFile(
    accountPath,
    JSON.stringify({ ...accountData, lastModified: new Date().toISOString() }, null, 2)
  );
}

// 娣囨繂鐡ㄩ崡鏇氶嚋閹笛嗩攽鐠佹澘缍?- 娴兼ê瀵查敍姘▏閻劍澹掗柌蹇撳晸閸?
const writeQueue = new Map();
async function saveInstanceFile(username, instance) {
  const instancesDir = getAccountInstancesDir(username);

  try {
    await fs.access(instancesDir);
  } catch {
    await fs.mkdir(instancesDir, { recursive: true });
  }

  // 娴ｈ法鏁ょ€圭偘绶?ID 娴ｆ粈璐熼弬鍥︽鍚嶏紝纭繚鍞竴鎬?
  const filename = `${instance.id}.json`;
  const filepath = path.join(instancesDir, filename);

  await fs.writeFile(filepath, JSON.stringify(instance, null, 2));
  console.log(`[实例创建] ${instance.id} 已保存到文件 ${filename}`);
  return filename;
}

// 閸掔娀娅庨幍褑顢戠拋鏉跨秿閺傚洣娆?
async function deleteInstanceFile(username, instanceId) {
  const instancesDir = getAccountInstancesDir(username);

  try {
    await fs.access(instancesDir);
  } catch {
    return false;
  }

  const files = await fs.readdir(instancesDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const instance = JSON.parse(await fs.readFile(path.join(instancesDir, file), 'utf8'));
        if (instance.id === instanceId) {
          await fs.unlink(path.join(instancesDir, file));
          // 閸氬本妞傞崚鐘绘珟閸忓疇浠堥惃鍕）韫囨枃浠?
          await deleteWebApiLog(username, instanceId);
          return true;
        }
      } catch {
        // 韫囩晫鏆愮拠璇插絿婢惰精瑙﹂惃鍕瀮娴?
      }
    }
  }
  return false;
}

// 閸掔娀娅庢禒璇插閻ㄥ嫭澧嶉張澶嬪⒔鐞涘矁顔囪ぐ?
async function deleteTaskInstances(username, taskId) {
  const instancesDir = getAccountInstancesDir(username);
  let deletedCount = 0;

  try {
    await fs.access(instancesDir);
  } catch {
    return 0;
  }

  const files = await fs.readdir(instancesDir);
  const deletePromises = files
    .filter(f => f.endsWith('.json'))
    .map(async (file) => {
      try {
        const instance = JSON.parse(await fs.readFile(path.join(instancesDir, file), 'utf8'));
        if (instance.taskId === taskId) {
          await fs.unlink(path.join(instancesDir, file));
          deletedCount++;
        }
      } catch {
        // 忽略
      }
    });

  await Promise.all(deletePromises);
  return deletedCount;
}

// 娉ㄥ唽璐︽埛
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const accountPath = getAccountFilePath(username);

    try {
      await fs.access(accountPath);
      return res.status(409).json({ error: '用户名已存在' });
    } catch {
      // 閺傚洣娆㈡稉宥呯摠閸︻煉绱濋崣顖欎簰閸掓稑缂?
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = {
      id: Date.now().toString(),
      username,
      passwordHash: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    await initAccountData(username);

    const accountData = {
      account,
      tasks: [],
      lastModified: new Date().toISOString(),
    };
    await fs.writeFile(accountPath, JSON.stringify(accountData, null, 2));

    const token = jwt.sign(
      { userId: account.id, username: account.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      account: {
        id: account.id,
        username: account.username,
        createdAt: account.createdAt,
      },
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({ error: '注册失败: ' + error.message });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const accountPath = getAccountFilePath(username);

    try {
      await fs.access(accountPath);
    } catch {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const accountData = JSON.parse(await fs.readFile(accountPath, 'utf8'));
    const account = accountData.account;

    if (!account) {
      return res.status(401).json({ error: '账户数据损坏' });
    }

    const isValidPassword = await bcrypt.compare(password, account.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    account.lastLoginAt = new Date().toISOString();
    await fs.writeFile(accountPath, JSON.stringify(accountData, null, 2));

    const token = jwt.sign(
      { userId: account.id, username: account.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 娓呴櫎璇ョ敤鎴风殑缂撳瓨
    for (const [key] of cache.entries()) {
      if (key.includes(username)) {
        cache.delete(key);
      }
    }

    const fullData = await readAccountData(username);

    res.json({
      success: true,
      token,
      account: {
        id: account.id,
        username: account.username,
        createdAt: account.createdAt,
      },
      data: {
        tasks: fullData.tasks || [],
        taskInstances: fullData.taskInstances || [],
      },
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ error: '登录失败: ' + error.message });
  }
});

// 获取数据 - 使用缓存
app.get('/api/data', cacheMiddleware(3000), authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const data = await readAccountData(username);

    res.json({
      tasks: data.tasks || [],
      taskInstances: data.taskInstances || [],
    });
  } catch (error) {
    console.error('获取数据失败:', error);
    res.status(500).json({ error: '获取数据失败' });
  }
});

// 娣囨繂鐡ㄩ弫鐗堝祦 - 娴兼ê瀵查敍姘閲忓啓鍏?
app.post('/api/data', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { tasks, taskInstances } = req.body;

    // 娣囨繂鐡ㄦ稉缁樻殶閹?
    const accountData = await readAccountData(username);
    accountData.tasks = tasks || [];
    await saveAccountData(username, accountData);

    // 娣囨繂鐡ㄩ幍褑顢戠拋鏉跨秿
    if (taskInstances && taskInstances.length > 0) {
      const instancesDir = getAccountInstancesDir(username);
      let existingFiles = new Map();

      try {
        await fs.access(instancesDir);
        const files = await fs.readdir(instancesDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const existing = JSON.parse(await fs.readFile(path.join(instancesDir, file), 'utf8'));
            existingFiles.set(existing.id, file);
          }
        }
      } catch {
        // 閻╊喖缍嶆稉宥呯摠閸?
      }

      // 楠炴儼顢戞穱婵嗙摠閹碘偓閺堝澧界悰宀冾唶瑜?
      const savePromises = taskInstances.map(async (instance) => {
        const existingFile = existingFiles.get(instance.id);
        const task = tasks?.find(t => t.id === instance.taskId);
        const taskName = task?.name || '未命名任务';
        const instanceData = { ...instance, taskName };

        if (existingFile) {
          await fs.writeFile(path.join(instancesDir, existingFile), JSON.stringify(instanceData, null, 2));
        } else {
          await saveInstanceFile(username, instanceData);
        }
      });

      await Promise.all(savePromises);
    }

    res.json({ success: true, message: '数据保存成功' });
  } catch (error) {
    console.error('保存数据失败:', error);
    res.status(500).json({ error: '保存数据失败: ' + error.message });
  }
});

// 閸掔娀娅庨崡鏇氶嚋閹笛嗩攽鐠佹澘缍?
app.delete('/api/instances/:instanceId', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { instanceId } = req.params;

    const deleted = await deleteInstanceFile(username, instanceId);

    if (deleted) {
      res.json({ success: true, message: '执行记录已删除' });
    } else {
      res.status(404).json({ error: '执行记录不存在' });
    }
  } catch (error) {
    console.error('删除执行记录失败:', error);
    res.status(500).json({ error: '删除执行记录失败' });
  }
});

// 閸掔娀娅庢禒璇插閸欏﹤鍙鹃幍鈧張澶嬪⒔鐞涘矁顔囪ぐ?
app.delete('/api/tasks/:taskId', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { taskId } = req.params;

    const deletedCount = await deleteTaskInstances(username, taskId);

    res.json({
      success: true,
      message: `任务删除成功，共删除 ${deletedCount} 条执行记录`
    });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

// 导出数据
app.get('/api/export', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const data = await readAccountData(username);

    const exportData = {
      tasks: data.tasks || [],
      exportAt: new Date().toISOString(),
      version: '1.0',
      description: '金蝶数据传输平台 - 任务配置导出',
    };

    const filename = `tasks_export_${username}_${Date.now()}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(exportData);
  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({ error: '导出数据失败' });
  }
});

// 导入数据
app.post('/api/import', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { tasks } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: '无效的任务数据' });
    }

    const importedTasks = tasks.map(task => ({
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      enabled: false,
    }));

    const accountData = await readAccountData(username);
    accountData.tasks = [...accountData.tasks, ...importedTasks];
    await saveAccountData(username, accountData);

    res.json({
      success: true,
      message: `成功导入 ${importedTasks.length} 个任务`,
      data: {
        tasks: accountData.tasks,
        importedCount: importedTasks.length,
      },
    });
  } catch (error) {
    console.error('导入数据失败:', error);
    res.status(500).json({ error: '导入数据失败: ' + error.message });
  }
});

// 鍒犻櫎璐︽埛
app.delete('/api/account', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const accountPath = getAccountFilePath(username);
    const instancesDir = getAccountInstancesDir(username);

    try {
      await fs.unlink(accountPath);
    } catch {
      console.log('账户文件不存在或已删除');
    }

    try {
      await fs.rm(instancesDir, { recursive: true, force: true });
    } catch {
      console.log('执行记录目录不存在或已删除');
    }

    // 清除缓存
    for (const [key] of cache.entries()) {
      if (key.includes(username)) {
        cache.delete(key);
      }
    }
    for (const [key] of tokenCache.entries()) {
      tokenCache.delete(key);
    }

    res.json({ success: true, message: '账户已删除' });
  } catch (error) {
    console.error('删除账户失败:', error);
    res.status(500).json({ error: '删除账户失败' });
  }
});

// 娴狅絿鎮婃炰功 API 鐠囬攱鐪?- 娴兼ê寲锛氳繛鎺ュ鐢?
const feishuAgent = new (require('https')).Agent({
  keepAlive: true,
  maxSockets: 50,
});

app.all('/open-apis/*', async (req, res) => {
  try {
    const targetUrl = `https://open.feishu.cn${req.path}`;

    // 閺嬪嫬缂撶拠閿嬬湴娴ｆ搫绱濈涵顔荤箽濮濓絿鈥樻导鐘烩偓?params
    let bodyData = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // 閸氬牆鑻?query params 閸?body
      bodyData = {
        ...req.body,
        ...req.query,
      };
      // 婵″倹鐏夌拠閿嬬湴娴ｆ挷璐熺粚鍝勵嚠鐠炩槄绱濈拋鍙ヨ礋 undefined
      if (Object.keys(bodyData).length === 0) {
        bodyData = undefined;
      }
    }

    console.log('椋炰功浠ｇ悊璇锋眰:', {
      url: targetUrl,
      method: req.method,
      path: req.path,
      body: bodyData,
      params: req.params,
      query: req.query,
    });

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': req.headers.authorization || '',
      },
      body: bodyData ? JSON.stringify(bodyData) : undefined,
    });

    const data = await response.json();

    console.log('椋炰功浠ｇ悊鍝嶅簲:', {
      status: response.status,
      code: data.code,
      msg: data.msg,
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('椋炰功代理请求失败:', error);
    res.status(500).json({ error: '代理请求失败: ' + error.message });
  }
});

// 娴狅絿鎮婇柌鎴ｆ緩 API 鐠囬攱鐪?- 娴兼ê瀵查敍姘崇箾閹恒儱顦查悽顭掔礉濮濓絿鈥樻径鍕倞 Cookie
const kingdeeAgent = new (require('http')).Agent({
  keepAlive: true,
  maxSockets: 50,
});

// 金蝶 Session Cookie 瀛樺偍锛堟寜鐢ㄦ埛瀛樺偍锛?
const kingdeeSessions = new Map();

function extractCookiePairsFromSetCookie(setCookieHeaders) {
  if (!setCookieHeaders) {
    return '';
  }
  const cookieList = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
  return cookieList
    .map(cookie => String(cookie).split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
}

function getSetCookieArray(headers) {
  if (!headers) {
    return [];
  }
  if (typeof headers.getSetCookie === 'function') {
    const cookies = headers.getSetCookie();
    if (Array.isArray(cookies) && cookies.length > 0) {
      return cookies;
    }
  }
  const setCookieRaw = headers.get('set-cookie');
  if (!setCookieRaw) {
    return [];
  }
  // Fallback split for combined Set-Cookie header.
  return setCookieRaw.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map(item => item.trim()).filter(Boolean);
}

function normalizeEncodingAlias(encoding) {
  if (!encoding) {
    return 'utf-8';
  }
  const normalized = String(encoding).trim().toLowerCase();
  if (normalized === 'utf8') return 'utf-8';
  if (normalized === 'gb2312') return 'gbk';
  if (normalized === 'gb18030') return 'gbk';
  return normalized;
}

function decodeBufferByEncoding(buffer, encoding) {
  try {
    const decoder = new TextDecoder(normalizeEncodingAlias(encoding));
    return decoder.decode(buffer);
  } catch {
    return null;
  }
}

app.all('/K3Cloud/*', async (req, res) => {
  try {
    const incomingBody = req.body && typeof req.body === 'object' ? req.body : {};
    let baseUrl = incomingBody.baseUrl || 'http://47.113.148.159:8090';
    // 娴?baseUrl 娑擃厼骞撻梽銈呭讲閼宠棄鐡ㄩ崷銊ф畱 /K3Cloud 鍚庣紑锛岄伩鍏嶉噸澶?
    if (baseUrl.endsWith('/K3Cloud')) {
      baseUrl = baseUrl.replace(/\/K3Cloud$/, '');
    }
    // req.path 閸栧懎鎯?/K3Cloud/...閿涘矂娓剁憰浣稿箵閹哄澧犻棃銏㈡畱 /K3Cloud 闁灝鍘ら柌宥咁槻
    const pathWithoutPrefix = req.path.replace(/^\/K3Cloud/, '');
    const targetUrl = `${baseUrl}/K3Cloud${pathWithoutPrefix}`;

    // 閸戝棗顦拠閿嬬湴婢?
    const headers = {
      'Content-Type': 'application/json',
    };

    // 婵″倹鐏夐張澶婄摠閸屻劎娈?Cookie 閹存牞鈧懓顕Ч備腑浼犳潵鐨?Cookie锛屾坊鍔犲埌璇锋眰澶?
    const sessionKey = incomingBody.sessionKey || req.headers['x-session-key'];
    if (sessionKey && kingdeeSessions.has(sessionKey)) {
      headers['Cookie'] = kingdeeSessions.get(sessionKey);
      console.log('娴ｈ法鏁ょ€涙ê偍鐨?Cookie:', sessionKey, kingdeeSessions.get(sessionKey).substring(0, 50));
    }
    // 婵″倹鐏夌拠閿嬬湴娴ｆ挷鑵戦張?Cookie閿涘牅绮?taskExecutor 娴肩姵娼甸敍澶涚礉閻╁瓨甯存担璺ㄦ暏
    if (req.headers['cookie']) {
      headers['Cookie'] = headers['Cookie']
        ? `${headers['Cookie']}; ${req.headers['cookie']}`
        : req.headers['cookie'];
      console.log('娴ｈ法鏁ょ拠閿嬬湴娴肩姵娼甸惃?Cookie:', req.headers['cookie'].substring(0, 50));
    }

    // 鏉烆剙褰?Host 婢?
    const urlObj = new URL(targetUrl);
    headers['Host'] = urlObj.host;

    const forwardBody = req.method !== 'GET' && req.method !== 'HEAD'
      ? { ...incomingBody }
      : undefined;
    if (forwardBody) {
      // sessionKey/baseUrl are proxy control fields and not part of Kingdee API payload.
      delete forwardBody.sessionKey;
      delete forwardBody.baseUrl;
    }

    console.log('閲戣澏浠ｇ悊璇锋眰:', {
      targetUrl,
      method: req.method,
      hasSessionKey: !!sessionKey,
      bodyPreview: JSON.stringify(forwardBody ?? {}).substring(0, 200)
    });

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: forwardBody ? JSON.stringify(forwardBody) : undefined,
    });

    // 閹绘劕褰囬崫宥呯安娑擃厾娈?Cookie
    const setCookieHeaders = getSetCookieArray(response.headers);
    if (setCookieHeaders.length > 0) {
      const cookiePairs = extractCookiePairsFromSetCookie(setCookieHeaders);
      // 娣囨繂鐡?Cookie 閸?session
      if (sessionKey && cookiePairs) {
        kingdeeSessions.set(sessionKey, cookiePairs);
        console.log('娣囨繂鐡?Cookie 閸?session:', sessionKey, cookiePairs.substring(0, 80));
      }
      // 鏉烆剙褰?Set-Cookie header
      res.setHeader('Set-Cookie', setCookieHeaders);
    }

    // 兼容金蝶返回的非 UTF-8 内容，优先按 Content-Type 声明的 charset 解码
    const responseBuffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || '';
    const charsetMatch = /charset\s*=\s*([^;\s]+)/i.exec(contentType);
    const preferredEncoding = charsetMatch?.[1] || 'utf-8';

    let responseText =
      decodeBufferByEncoding(responseBuffer, preferredEncoding)
      || decodeBufferByEncoding(responseBuffer, 'utf-8')
      || decodeBufferByEncoding(responseBuffer, 'gbk')
      || '';

    console.log('闁叉垼婢忛崫宥呯安閸樼喎顫愰崘鍛啇:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      // 某些金蝶实例未声明 charset，会导致 UTF-8 误解码，这里再尝试一次 GBK
      const gbkText = decodeBufferByEncoding(responseBuffer, 'gbk');
      if (gbkText && gbkText !== responseText) {
        try {
          data = JSON.parse(gbkText);
          responseText = gbkText;
        } catch {
          // 保留原错误处理
        }
      }

      if (!data) {
        console.error('JSON 鐟欙絾鐎芥径杈Е閿涘苯鎼锋惔鏂垮敶鐎?', responseText);
        return res.status(response.status).json({
          error: '金蝶服务器返回非 JSON 响应',
          rawResponse: responseText.substring(0, 500),
          status: response.status
        });
      }
    }

    console.log('閲戣澏浠ｇ悊鍝嶅簲:', {
      status: response.status,
      LoginResultType: data?.LoginResultType,
      hasException: !!data?.Exception
    });

    res.status(response.status).json(data);
  } catch (error) {
    console.error('閲戣澏代理请求失败:', error);
    res.status(500).json({ error: '代理请求失败: ' + error.message });
  }
});

// 鑾峰彇鏈満 IP 閸︽澘娼?
import os from 'os';
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// 閸氼垰濮╅張宥呭閸?
ensureDataDir()
  .then(() => {
    const localIP = getLocalIP();
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log(`鏈嶅姟鍣ㄨ繍琛屽湪 http://localhost:${PORT}`);
      console.log(`鐏炩偓閸╃喓缍夌拋鍧楁６ http://${localIP}:${PORT}`);
      console.log(`鏁版嵁瀛樺偍鐩綍: ${DATA_DIR}`);
      console.log('閹嗗厴娴兼ê瀵插鎻掓儙閻㈩煉绱癎zip 閸樺缂夐妴浣告惙鎼存梻绱︾€涙ǜ鈧浇绻涢幒銉︾潨');
      console.log('========================================');
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`闁挎瑨顕? 缁旑垰褰?${PORT} 瀹歌尪顫﹂崡鐘垫暏`);
        console.error(`璇疯繍琛屼互涓嬪懡浠ゆ煡鎵惧苟鍏抽棴鍗犵敤杩涚▼:`);
        console.error(`  netstat -ano | findstr :${PORT}`);
        console.error(`  taskkill /F /PID <杩涚▼ID>`);
      } else {
        console.error('閺堝秴濮熼崳銊ユ儙閸斻劌銇戠拹?', err.message);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('閸掓繂顫愰崠鏍ㄦ殶閹诡喚娲拌ぐ鏇炪亼鐠?', err.message);
    process.exit(1);
  });
// ==================== 娴间椒绗熺痪褑澶勯幋椋庮吀閻?API ====================

// 绠＄悊鍛樻潈闄愰獙璇佷腑闂翠欢
function adminMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
}

// 閼惧嘲褰囬幍鈧張澶庡閹村嘲鍨悰?
app.get('/api/admin/accounts', adminMiddleware, async (req, res) => {
  try {
    const files = await fs.readdir(DATA_DIR);
    const accounts = [];

    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_instances')) {
        const accountPath = path.join(DATA_DIR, file);
        try {
          const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));
          if (data.account) {
            accounts.push({
              id: data.account.id,
              username: data.account.username,
              email: data.account.email || '',
              phone: data.account.phone || '',
              department: data.account.department || '',
              role: data.account.role || 'operator',
              status: data.account.status || 'active',
              createdAt: data.account.createdAt,
              lastLoginAt: data.account.lastLoginAt,
              createdBy: data.account.createdBy,
            });
          }
        } catch {
          // 韫囩晫鏆愮拠璇插絿婢惰精瑙﹂惃鍕瀮娴?
        }
      }
    }

    res.json({ accounts, total: accounts.length });
  } catch (error) {
    console.error('获取账户列表失败:', error);
    res.status(500).json({ error: '获取账户列表失败' });
  }
});

// 鍒涘缓璐︽埛
app.post('/api/admin/accounts', adminMiddleware, async (req, res) => {
  try {
    const { username, password, email, phone, department, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const accountPath = getAccountFilePath(username);

    try {
      await fs.access(accountPath);
      return res.status(409).json({ error: '用户名已存在' });
    } catch {
      // 閺傚洣娆㈡稉宥呯摠閸︻煉绱濋崣顖欎簰閸掓稑缂?
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = {
      id: Date.now().toString(),
      username,
      passwordHash: hashedPassword,
      email: email || '',
      phone: phone || '',
      department: department || '',
      role: role || 'operator',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      createdBy: req.user.username,
    };

    await initAccountData(username);

    const accountData = {
      account,
      tasks: [],
      lastModified: new Date().toISOString(),
    };
    await fs.writeFile(accountPath, JSON.stringify(accountData, null, 2));

    res.json({ success: true, account });
  } catch (error) {
    console.error('创建账户失败:', error);
    res.status(500).json({ error: '创建账户失败' });
  }
});

// 鏇存柊璐︽埛淇℃伅
app.put('/api/admin/accounts/:accountId', adminMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;
    const updates = req.body;

    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_instances')) {
        const accountPath = path.join(DATA_DIR, file);
        const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));
        if (data.account && data.account.id === accountId) {
          data.account = {
            ...data.account,
            ...updates,
            lastModified: new Date().toISOString(),
          };
          await fs.writeFile(accountPath, JSON.stringify(data, null, 2));
          return res.json({ success: true, account: data.account });
        }
      }
    }

    res.status(404).json({ error: '账户不存在' });
  } catch (error) {
    console.error('更新账户失败:', error);
    res.status(500).json({ error: '更新账户失败' });
  }
});

// 閸掔娀娅庣拹锔藉煕閿涘牏顓搁悶鍡楁喅閿?
app.delete('/api/admin/accounts/:accountId', adminMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;

    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_instances')) {
        const accountPath = path.join(DATA_DIR, file);
        const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));
        if (data.account && data.account.id === accountId) {
          await fs.unlink(accountPath);

          const instancesDir = getAccountInstancesDir(data.account.username);
          try {
            await fs.rm(instancesDir, { recursive: true, force: true });
          } catch {
            // 忽略
          }

          return res.json({ success: true, message: '账户已删除' });
        }
      }
    }

    res.status(404).json({ error: '账户不存在' });
  } catch (error) {
    console.error('删除账户失败:', error);
    res.status(500).json({ error: '删除账户失败' });
  }
});

// 重置密码
app.post('/api/admin/accounts/:accountId/reset-password', adminMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: '密码至少 6 个字符' });
    }

    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_instances')) {
        const accountPath = path.join(DATA_DIR, file);
        const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));
        if (data.account && data.account.id === accountId) {
          data.account.passwordHash = await bcrypt.hash(password, 10);
          await fs.writeFile(accountPath, JSON.stringify(data, null, 2));
          return res.json({ success: true, message: '密码已重置' });
        }
      }
    }

    res.status(404).json({ error: '账户不存在' });
  } catch (error) {
    console.error('重置密码失败:', error);
    res.status(500).json({ error: '重置密码失败' });
  }
});

// 锁定/瑙ｉ攣璐︽埛
app.post('/api/admin/accounts/:accountId/toggle-lock', adminMiddleware, async (req, res) => {
  try {
    const { accountId } = req.params;
    const { lock } = req.body;

    const files = await fs.readdir(DATA_DIR);
    for (const file of files) {
      if (file.endsWith('.json') && !file.includes('_instances')) {
        const accountPath = path.join(DATA_DIR, file);
        const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));
        if (data.account && data.account.id === accountId) {
          data.account.status = lock ? 'locked' : 'active';
          await fs.writeFile(accountPath, JSON.stringify(data, null, 2));
          return res.json({ success: true, status: data.account.status });
        }
      }
    }

    res.status(404).json({ error: '账户不存在' });
  } catch (error) {
    console.error('锁定账户失败:', error);
    res.status(500).json({ error: '锁定账户失败' });
  }
});

// 鑾峰彇鎿嶄綔鏃ュ織
app.get('/api/admin/operation-logs', adminMiddleware, async (req, res) => {
  res.json({ logs: [] });
});

// 获取登录历史
app.get('/api/admin/login-history', adminMiddleware, async (req, res) => {
  res.json({ history: [] });
});

// 鑾峰彇褰撳墠璐︽埛淇℃伅
app.get('/api/account/profile', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const accountPath = getAccountFilePath(username);
    const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));

    res.json({
      account: {
        id: data.account.id,
        username: data.account.username,
        email: data.account.email,
        phone: data.account.phone,
        department: data.account.department,
        role: data.account.role,
        createdAt: data.account.createdAt,
        lastLoginAt: data.account.lastLoginAt,
      },
    });
  } catch (error) {
    console.error('获取账户信息失败:', error);
    res.status(500).json({ error: '获取账户信息失败' });
  }
});

// 閺囧瓨鏌婃稉顏冩眽娣団剝浼?
app.put('/api/account/profile', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { email, phone, department } = req.body;
    const accountPath = getAccountFilePath(username);
    const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));

    data.account = {
      ...data.account,
      email: email || data.account.email,
      phone: phone || data.account.phone,
      department: department || data.account.department,
    };

    await fs.writeFile(accountPath, JSON.stringify(data, null, 2));
    res.json({ success: true, account: data.account });
  } catch (error) {
    console.error('更新账户信息失败:', error);
    res.status(500).json({ error: '更新账户信息失败' });
  }
});

// 娣囶喗鏁肩€靛棛鐖?
app.post('/api/account/change-password', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: '新密码至少 6 个字符' });
    }

    const accountPath = getAccountFilePath(username);
    const data = JSON.parse(await fs.readFile(accountPath, 'utf8'));

    const isValid = await bcrypt.compare(currentPassword, data.account.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: '当前密码错误' });
    }

    data.account.passwordHash = await bcrypt.hash(newPassword, 10);
    await fs.writeFile(accountPath, JSON.stringify(data, null, 2));

    res.json({ success: true, message: '密码已修改' });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({ error: '修改密码失败' });
  }
});

// ==================== 鏃ュ織 API ====================

// 保存 WebAPI 鏃ュ織
app.post('/api/logs/webapi', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { instanceId, recordId, feishuData, requestData, responseData, writeBackData, success, errorMessage } = req.body;

    if (!instanceId) {
      return res.status(400).json({ error: '缺少 instanceId' });
    }

    const saved = await saveWebApiLog(username, instanceId, {
      recordId,
      feishuData,
      requestData,
      responseData,
      writeBackData,
      success,
      errorMessage,
    });

    res.json({
      success: true,
      saved,
      message: saved ? '日志已保存' : '日志已存在，跳过保存'
    });
  } catch (error) {
    console.error('保存日志失败:', error);
    res.status(500).json({ error: '保存日志失败: ' + error.message });
  }
});

// 閼惧嘲褰囬幐鍥х暰鐎圭偘绶ラ惃鍕）韫?
app.get('/api/logs/:instanceId', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { instanceId } = req.params;

    const log = await getWebApiLog(username, instanceId);

    if (!log) {
      return res.status(404).json({ error: '日志不存在' });
    }

    res.json({ success: true, log });
  } catch (error) {
    console.error('获取日志失败:', error);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// 閸掔娀娅庨幐鍥х暰鐎圭偘绶ラ惃鍕）韫?
app.delete('/api/logs/:instanceId', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { instanceId } = req.params;

    const deleted = await deleteWebApiLog(username, instanceId);

    if (deleted) {
      res.json({ success: true, message: '日志已删除' });
    } else {
      res.status(404).json({ error: '日志不存在' });
    }
  } catch (error) {
    console.error('删除日志失败:', error);
    res.status(500).json({ error: '删除日志失败' });
  }
});

// ==================== 娴犺濮熼幍褑顢?API ====================

// 保存实例回调函数
async function saveInstanceCallback(instance) {
  const { username } = instance;
  const instancesDir = getAccountInstancesDir(username);

  try {
    await fs.access(instancesDir);
  } catch {
    await fs.mkdir(instancesDir, { recursive: true });
  }

  // 娴ｈ法鏁ょ€圭偘绶?ID 娴ｆ粈璐熼弬鍥︽閸?
  const filename = `${instance.id}.json`;
  const filepath = path.join(instancesDir, filename);

  await fs.writeFile(filepath, JSON.stringify(instance, null, 2));
  console.log(`[鐎圭偘绶ラ弴瀛樻煀] ${instance.id} 閻樿埖鈧?${instance.status}`);
}

// 淇濆瓨鏃ュ織鍥炶皟鍑芥暟
async function saveLogCallback(username, instanceId, logData) {
  await saveWebApiLog(username, instanceId, logData);
}

async function launchTaskExecution(task, username, options = {}) {
  const firstRecordOnly = options.firstRecordOnly === true;

  const instanceId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const instance = {
    id: instanceId,
    taskId: task.id,
    taskName: task.name,
    username,
    status: TaskStatus.IDLE,
    startTime: null,
    endTime: null,
    progress: 0,
    totalCount: 0,
    successCount: 0,
    errorCount: 0,
    isStopping: false,
  };

  await saveInstanceFile(username, instance);

  const executor = new TaskExecutor(
    task,
    instance,
    username,
    (currentInstanceId, logData) => saveLogCallback(username, currentInstanceId, logData),
    saveInstanceCallback,
    { firstRecordOnly }
  );

  addRunningTask(instanceId, executor);

  executor.execute().catch(err => {
    console.error(`任务执行异常: ${err.message}`);
  }).finally(() => {
    removeRunningTask(instanceId);
  });

  return { instanceId };
}

async function findTaskByTriggerToken(triggerToken) {
  const files = await fs.readdir(DATA_DIR);

  for (const file of files) {
    if (!file.endsWith('.json')) {
      continue;
    }

    const username = path.basename(file, '.json');
    const accountFilePath = path.join(DATA_DIR, file);

    try {
      const accountData = JSON.parse(await fs.readFile(accountFilePath, 'utf8'));
      const tasks = Array.isArray(accountData?.tasks) ? accountData.tasks : [];
      const task = tasks.find(item => item?.triggerApi?.token === triggerToken);
      if (task) {
        return { username, task };
      }
    } catch (error) {
      console.warn(`读取触发 token 映射失败: ${accountFilePath}`, error.message);
    }
  }

  return null;
}

// 棰勮绗竴鏉″尮閰嶈褰曞皢鍙戦€佸埌閲戣澏鐨勮姹傛暟鎹紙涓嶅彂閫侊級
const previewRequestHandler = async (req, res) => {
  try {
    const { username } = req.user;
    const { taskId } = req.params;

    const accountData = await readAccountData(username);
    const task = accountData.tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const previewInstance = {
      id: `preview-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      taskId: task.id,
      taskName: task.name,
      username,
      status: TaskStatus.IDLE,
      startTime: null,
      endTime: null,
      progress: 0,
      totalCount: 0,
      successCount: 0,
      errorCount: 0,
      isStopping: false,
      stopRequestedAt: null,
    };

    const executor = new TaskExecutor(
      task,
      previewInstance,
      username,
      null,
      null,
      { firstRecordOnly: true }
    );

    const preview = await executor.previewFirstRecordRequest();

    res.json({
      success: true,
      preview,
      message: '已生成第一条匹配记录的请求数据预览（未发送到金蝶）',
    });
  } catch (error) {
    console.error('预览请求数据失败:', error);
    res.status(500).json({ error: '预览请求数据失败: ' + error.message });
  }
};

// 新旧版本接口兼容：不同前端版本可能调用不同路径
app.post('/api/tasks/:taskId/preview-request', authMiddleware, previewRequestHandler);
app.post('/api/tasks/:taskId/request-preview', authMiddleware, previewRequestHandler);
app.post('/api/tasks/:taskId/preview', authMiddleware, previewRequestHandler);

// 閸氼垰濮╂禒璇插鎵ц
app.post('/api/tasks/:taskId/execute', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { taskId } = req.params;
    const { firstRecordOnly = false } = req.body || {};

    // 获取任务配置
    const accountData = await readAccountData(username);
    const task = accountData.tasks.find(t => t.id === taskId);

    if (!task) {
      return res.status(404).json({ error: '任务不存在' });
    }

    const { instanceId } = await launchTaskExecution(task, username, {
      firstRecordOnly: firstRecordOnly === true,
    });

    res.json({
      success: true,
      instanceId,
      message: firstRecordOnly ? '测试任务已启动（仅执行第一条记录）' : '任务已启动',
    });
  } catch (error) {
    console.error('启动任务失败:', error);
    res.status(500).json({ error: '启动任务失败: ' + error.message });
  }
});

const publicTaskTriggerHandler = async (req, res) => {
  try {
    const triggerToken = String(req.params?.triggerToken || '').trim();
    if (!triggerToken) {
      return res.status(400).json({ error: '缺少触发 token' });
    }

    const matched = await findTaskByTriggerToken(triggerToken);
    if (!matched) {
      return res.status(404).json({ error: '触发 token 无效或任务不存在' });
    }

    const { username, task } = matched;

    if (!task?.triggerApi?.enabled) {
      return res.status(403).json({ error: '该触发 API 已禁用' });
    }

    if (!task.enabled) {
      return res.status(409).json({ error: '任务当前未启用，无法触发执行' });
    }

    const { instanceId } = await launchTaskExecution(task, username, {
      firstRecordOnly: false,
    });

    res.json({
      success: true,
      message: '任务已通过触发 API 启动',
      instanceId,
      taskId: task.id,
      taskName: task.name,
    });
  } catch (error) {
    console.error('触发 API 启动任务失败:', error);
    res.status(500).json({ error: '触发 API 启动任务失败: ' + error.message });
  }
};

app.post('/api/public/task-trigger/:triggerToken', publicTaskTriggerHandler);
app.get('/api/public/task-trigger/:triggerToken', publicTaskTriggerHandler);

// 閸嬫粍顒涙禒璇插鎵ц
app.post('/api/tasks/:instanceId/stop', authMiddleware, async (req, res) => {
  try {
    const { instanceId } = req.params;

    const executor = getRunningTask(instanceId);
    if (!executor) {
      return res.status(404).json({ error: '任务实例不存在或已完成' });
    }

    executor.stop();
    const runtime = typeof executor.getRuntimeStatus === 'function'
      ? executor.getRuntimeStatus()
      : { isRunning: true, isStopping: true, isStopped: false };
    res.json({
      success: true,
      message: '任务已请求安全停止，正在等待当前记录完成',
      status: executor.instance?.status || TaskStatus.PAUSED,
      ...runtime,
    });
  } catch (error) {
    console.error('停止任务失败:', error);
    res.status(500).json({ error: '停止任务失败' });
  }
});

// 閼惧嘲褰囨禒璇插閻樿埖鈧?
app.get('/api/tasks/:instanceId/status', authMiddleware, async (req, res) => {
  try {
    const { username } = req.user;
    const { instanceId } = req.params;

    // 閸忓牊顥呴弻銉︻劀閸︺劏绻嶇悰宀€娈戞禒璇插
    const executor = getRunningTask(instanceId);
    if (executor) {
      const instance = executor.instance;
      const runtime = typeof executor.getRuntimeStatus === 'function'
        ? executor.getRuntimeStatus()
        : { isRunning: true, isStopping: false, isStopped: false };
      return res.json({
        success: true,
        status: instance.status,
        progress: instance.progress,
        totalCount: instance.totalCount,
        successCount: instance.successCount,
        errorCount: instance.errorCount,
        isRunning: runtime.isRunning,
        isStopping: runtime.isStopping,
        isStopped: runtime.isStopped,
        startTime: instance.startTime,
        endTime: instance.endTime,
        stopRequestedAt: instance.stopRequestedAt,
      });
    }

    // 濡偓閺屻儱鍑＄€瑰本鍨氶惃鍕崲閸斺€崇杽娓?
    const instancesDir = getAccountInstancesDir(username);
    try {
      await fs.access(instancesDir);
    } catch {
      return res.status(404).json({ error: '任务实例不存在' });
    }

    const files = await fs.readdir(instancesDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const instance = JSON.parse(await fs.readFile(path.join(instancesDir, file), 'utf8'));
          if (instance.id === instanceId) {
            return res.json({
              success: true,
              status: instance.status,
              progress: instance.progress,
              totalCount: instance.totalCount || 0,
              successCount: instance.successCount || 0,
              errorCount: instance.errorCount || 0,
              isRunning: false,
              isStopping: false,
              isStopped: true,
              startTime: instance.startTime,
              endTime: instance.endTime,
              stopRequestedAt: instance.stopRequestedAt,
            });
          }
        } catch {
          // 忽略
        }
      }
    }

    res.status(404).json({ error: '任务实例不存在' });
  } catch (error) {
    console.error('閼惧嘲褰囨禒璇插閻樿埖鈧礁銇戠拹?', error);
    res.status(500).json({ error: '获取任务状态失败' });
  }
});


