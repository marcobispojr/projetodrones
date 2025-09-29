const express = require('express');
const path = require('path');
const fs = require('fs');

// Criar aplicação Express
const app = express();
let PORT = process.env.PORT || 8000;

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API endpoint para verificar status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Sistema de Entrega por Drones está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Função para tentar iniciar servidor em porta disponível
function startServer(port) {
    const server = app.listen(port, () => {
        console.log('========================================================');
        console.log('   SISTEMA DE ENTREGA POR DRONES - DTI DIGITAL');
        console.log('========================================================');
        console.log(`✅ Servidor rodando em: http://localhost:${port}`);
        console.log('');
        console.log('📋 Instruções:');
        console.log('   - Abra o navegador em http://localhost:' + port);
        console.log('   - Configure os drones e adicione pedidos');
        console.log('   - Clique em "Iniciar" para começar a simulação');
        console.log('');
        console.log('Para parar o servidor: Ctrl + C');
        console.log('========================================================');
        
        // Abrir automaticamente no navegador (opcional)
        const platform = process.platform;
        const url = `http://localhost:${port}`;
        
        if (platform === 'win32') {
            require('child_process').exec(`start ${url}`);
        } else if (platform === 'darwin') {
            require('child_process').exec(`open ${url}`);
        } else if (platform === 'linux') {
            require('child_process').exec(`xdg-open ${url}`);
        }
    });

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`❌ Porta ${port} já está em uso.`);
            console.log(`⏳ Tentando porta ${port + 1}...`);
            startServer(port + 1);
        } else {
            console.error('❌ Erro ao iniciar servidor:', err);
            process.exit(1);
        }
    });

    return server;
}

// Iniciar servidor
const server = startServer(PORT);

// Tratamento de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo deu errado!');
});

// Tratamento para encerramento gracioso
process.on('SIGINT', () => {
    console.log('\n⏹️  Encerrando servidor...');
    process.exit(0);
});
