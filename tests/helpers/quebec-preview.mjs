import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import route from '../../api/quebec-register.js';
import { createFakeLedger, ledgerEnvironment } from './quebec-registration-fixture.mjs';

const port = Number(process.argv[2] || 8765);
const ledger = await createFakeLedger();
const handleRegistration = route.createHandler({ env: ledgerEnvironment, fetchImpl: ledger.fetchImpl });
const root = new URL('../../', import.meta.url);
const mediaTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://127.0.0.1');
  if (pathname === '/api/quebec-register') {
    await handleRegistration(req, res);
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  if (!/^\/(?:[a-z0-9_-]+(?:\.html)?|assets\/[a-z0-9_./-]+|output\/pdf\/[a-z0-9_.-]+)?$/i.test(pathname) ||
      pathname.includes('..')) {
    res.writeHead(404).end();
    return;
  }

  let file = pathname === '/' ? 'index.html' : pathname.slice(1);
  if (!extname(file)) file += '.html';
  try {
    const bytes = await readFile(new URL(file, root));
    res.writeHead(200, { 'Content-Type': mediaTypes[extname(file)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {
    res.writeHead(404).end();
  }
}).listen(port, '127.0.0.1', () => {
  console.log('Québec local preview at http://127.0.0.1:' + port + '/quebec-new-year.html');
  console.log('Use synthetic data. The test ledger is in memory.');
});
