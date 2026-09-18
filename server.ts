import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { getAllQuotes, getMarketStatus, getSingleQuoteHistory } from './src/server/marketService.js';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'Dashboard B3 API' });
  });

  // Market Status endpoint
  app.get('/api/market/status', (req, res) => {
    try {
      const status = getMarketStatus();
      res.json({ success: true, data: status });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error?.message || 'Erro ao obter status do mercado' });
    }
  });

  // All Quotes endpoint
  app.get('/api/quotes', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === 'true';
      const quotesResponse = await getAllQuotes(forceRefresh);
      res.json(quotesResponse);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      res.status(500).json({
        success: false,
        error: 'Não foi possível atualizar as cotações.',
        details: error?.message,
      });
    }
  });

  // Single Quote Historical endpoint
  app.get('/api/quote/:symbol/history', async (req, res) => {
    try {
      const { symbol } = req.params;
      const range = (req.query.range as string) || '1d';
      const history = await getSingleQuoteHistory(symbol, range);
      res.json({ success: true, data: history });
    } catch (error: any) {
      console.error(`Error fetching history for ${req.params.symbol}:`, error);
      res.status(500).json({
        success: false,
        error: error?.message || `Erro ao obter histórico de ${req.params.symbol}`,
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
