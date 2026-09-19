import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

interface ServerLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'system';
  category: 'HTTP' | 'SYSTEM' | 'PROCESS' | 'API';
  method?: string;
  url?: string;
  status?: number;
  durationMs?: number;
  ip?: string;
  message: string;
  details?: any;
}

const MAX_LOGS = 250;
const serverLogs: ServerLog[] = [];

function addServerLog(log: Omit<ServerLog, 'id' | 'timestamp'>) {
  const newLog: ServerLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...log,
  };
  serverLogs.unshift(newLog);
  if (serverLogs.length > MAX_LOGS) {
    serverLogs.pop();
  }
}

// Initial boot log
addServerLog({
  level: 'system',
  category: 'SYSTEM',
  message: `DocMate Server initializing in ${process.env.NODE_ENV || 'development'} mode on Node ${process.version}`,
});

async function startServer() {
  const app = express();
  const PORT = 3000;
  let requestCounter = 0;

  // Middleware for parsing JSON and URL encoded payloads safely
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // Request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    requestCounter++;
    const reqStart = Date.now();
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

    // Intercept response finish to log HTTP execution metrics
    res.on('finish', () => {
      const durationMs = Date.now() - reqStart;
      const status = res.statusCode;
      const isApi = req.url.startsWith('/api');

      // Log all API requests and any error responses
      if (isApi || status >= 400) {
        const level: 'info' | 'warn' | 'error' = 
          status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';

        addServerLog({
          level,
          category: isApi ? 'API' : 'HTTP',
          method: req.method,
          url: req.originalUrl || req.url,
          status,
          durationMs,
          ip: clientIp.split(',')[0].trim(),
          message: `${req.method} ${req.originalUrl || req.url} - ${status} (${durationMs}ms)`,
        });
      }
    });

    next();
  });

  // ==========================================
  // 1. PUBLIC CONFIGURATION & KEYS ENDPOINT
  // ==========================================
  app.get('/api/config/public', (req: Request, res: Response) => {
    res.json({
      googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || '900258025817-911inng0egh6oc7d2ndnvihvu0f4dc25.apps.googleusercontent.com',
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSnPzbQ2iR7iHt',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      appVersion: '2.5.0',
    });
  });

  // ==========================================
  // 2. SYSTEM HEALTH & TELEMETRY ENDPOINT
  // ==========================================
  app.get('/api/health', (req: Request, res: Response) => {
    const memory = process.memoryUsage();
    const uptimeSec = Math.floor(process.uptime());

    res.json({
      status: 'healthy',
      service: 'DocMate Utility Backend',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      uptimeFormatted: `${Math.floor(uptimeSec / 3600)}h ${Math.floor((uptimeSec % 3600) / 60)}m ${uptimeSec % 60}s`,
      totalRequests: requestCounter,
      hasGemini: Boolean(process.env.GEMINI_API_KEY),
      memoryUsage: {
        rssMB: (memory.rss / (1024 * 1024)).toFixed(2),
        heapTotalMB: (memory.heapTotal / (1024 * 1024)).toFixed(2),
        heapUsedMB: (memory.heapUsed / (1024 * 1024)).toFixed(2),
        externalMB: (memory.external / (1024 * 1024)).toFixed(2),
      },
    });
  });

  // ==========================================
  // 3. BACKEND LOGS API
  // ==========================================
  app.get('/api/logs', (req: Request, res: Response) => {
    const { level, limit } = req.query;
    let filteredLogs = [...serverLogs];

    if (level && typeof level === 'string' && level !== 'all') {
      filteredLogs = filteredLogs.filter((l) => l.level === level);
    }

    const logLimit = limit ? Math.min(Number(limit) || 100, MAX_LOGS) : 100;
    res.json({
      total: serverLogs.length,
      count: Math.min(filteredLogs.length, logLimit),
      logs: filteredLogs.slice(0, logLimit),
      systemSummary: {
        uptime: process.uptime(),
        node: process.version,
        memoryMB: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1),
      }
    });
  });

  app.delete('/api/logs', (req: Request, res: Response) => {
    serverLogs.length = 0;
    addServerLog({
      level: 'system',
      category: 'SYSTEM',
      message: 'Backend server logs buffer cleared by administrator.',
    });
    res.json({ success: true, message: 'Server logs cleared successfully.' });
  });

  // ==========================================
  // 4. RAZORPAY PAYMENT / DONATION API
  // ==========================================
  app.post('/api/payment/create-order', async (req: Request, res: Response) => {
    try {
      const { amount = 99, currency = 'INR', supporterName = 'DocMate User', email = '' } = req.body;
      const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TSnPzbQ2iR7iHt';
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'U5SBQq8AOKNrdQsAvkeS69yT';

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      addServerLog({
        level: 'info',
        category: 'API',
        message: `Created Razorpay Payment Intent: ${orderId} for ₹${amount} (${supporterName})`,
      });

      return res.json({
        success: true,
        orderId,
        amount: amount * 100, // in paise
        currency,
        keyId,
        supporterName,
        email,
      });
    } catch (err: any) {
      addServerLog({
        level: 'error',
        category: 'API',
        message: `Payment order creation error: ${err.message}`,
      });
      return res.status(500).json({ error: 'Failed to initialize payment order.' });
    }
  });

  // ==========================================
  // 9. CLIENT LOG RELAY
  // ==========================================
  app.post('/api/client-log', (req: Request, res: Response) => {
    const { level, message, details } = req.body;
    if (message) {
      addServerLog({
        level: level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info',
        category: 'PROCESS',
        message: `[Client] ${message}`,
        details,
      });
    }
    res.json({ received: true });
  });

  // ==========================================
  // 10. FRONTEND VITE & STATIC SERVING
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false,
        host: '0.0.0.0',
        port: 3000
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req: Request, res: Response) => {
        res.status(503).send('Application build in progress. Please refresh momentarily.');
      });
    }
  }

  // Global uncaught error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    addServerLog({
      level: 'error',
      category: 'SYSTEM',
      message: `Uncaught server exception: ${err?.message || 'Unknown error'}`,
      details: err?.stack,
    });
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: err?.message || 'An unexpected error occurred.',
      });
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    addServerLog({
      level: 'system',
      category: 'SYSTEM',
      message: `DocMate Server listening on http://0.0.0.0:${PORT} with full AI Suite and Secure Telemetry`,
    });
    console.log(`DocMate Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Boot Error:', err);
});
