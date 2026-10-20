const db = require('../db');
const seed = require('../seed');

module.exports = async (req, res) => {
    // Permite CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('[Vercel Seed] Inicializando conexão com o banco de dados...');
        await db.inicializar();
        
        console.log('[Vercel Seed] Executando rotina de povoamento...');
        await seed.executarSeed();

        return res.status(200).json({
            success: true,
            message: '🎉 Banco de dados povoado com sucesso pelo Seed!',
            banco: db.getEngineName(),
            professoresCadastrados: seed.PROFESSORES.length,
            alunosCadastrados: seed.ALUNOS.length,
            materiasPublicadas: seed.CONTEUDOS.length,
            simuladosCriados: seed.SIMULADOS.length,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('[Vercel Seed] Erro ao executar seed:', err);
        return res.status(500).json({
            success: false,
            error: 'Falha ao executar seed no banco: ' + err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
};
