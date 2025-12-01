import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Servir arquivos estáticos da pasta dist/ticket-client/browser
app.use(express.static(path.join(__dirname, 'dist', 'ticket-client', 'browser')));

// Fallback SPA - todas as rotas retornam index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'ticket-client', 'browser', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📦 Servindo arquivos de: ${path.join(__dirname, 'dist', 'ticket-client', 'browser')}\n`);
});
