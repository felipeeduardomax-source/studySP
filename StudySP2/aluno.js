// ==========================================
// AUTENTICAÇÃO E INICIALIZAÇÃO
// ==========================================
const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

if (!usuarioLogado) {
    window.location.href = 'login.html';
} else {
    // 1. Libera os botões de criação se for Professor
    if (usuarioLogado.perfil === 'Professor') {
        const btnConteudo = document.getElementById('btnAbrirModalConteudo');
        const btnSimulado = document.getElementById('btnAbrirModalSimulado');
        if(btnConteudo) { btnConteudo.style.display = 'inline-flex'; }
        if(btnSimulado) { btnSimulado.style.display = 'inline-flex'; }
    }

    // 2. Coloca o nome e email na tela (Isso que estava faltando!)
    if(document.getElementById('userNameDisplay')) {
        document.getElementById('userNameDisplay').textContent = usuarioLogado.nome;
    }
    if(document.getElementById('userEmailDisplay')) {
        document.getElementById('userEmailDisplay').textContent = usuarioLogado.email;
    }
    if(document.getElementById('sidebarUserName')) {
        document.getElementById('sidebarUserName').textContent = usuarioLogado.nome || 'Aluno';
    }
    if(document.getElementById('sidebarUserRole')) {
        document.getElementById('sidebarUserRole').textContent = (usuarioLogado.perfil === 'Professor') ? 'Professor' : 'Estudante';
    }

    // Aplica a foto de perfil imediatamente na inicialização (sem atraso no celular ou computador)
    aplicarFotoPerfilNaInterface(usuarioLogado.foto);
    
    // 3. Garante que as variáveis existem para não dar erro
    if (!usuarioLogado.pontos) usuarioLogado.pontos = 0;
    if (!usuarioLogado.sequencia) usuarioLogado.sequencia = 0;
    if (!usuarioLogado.tempoEstudadoSegundos) usuarioLogado.tempoEstudadoSegundos = 0;
    if (!usuarioLogado.multiplicador) usuarioLogado.multiplicador = 1.0;
    if (!usuarioLogado.totalQuestoes) usuarioLogado.totalQuestoes = 0;
    if (!usuarioLogado.totalAcertos) usuarioLogado.totalAcertos = 0;
    
    // Variáveis do TCC e Conquistas
    if (!usuarioLogado.mensagensTCC) usuarioLogado.mensagensTCC = 0;
    if (!usuarioLogado.mensagensTCCHoje) usuarioLogado.mensagensTCCHoje = 0;
    if (!usuarioLogado.ultimaDataChat) usuarioLogado.ultimaDataChat = new Date().toLocaleDateString();
    if (!usuarioLogado.conquistas) usuarioLogado.conquistas = [];
    if (!usuarioLogado.onboardingTCC) usuarioLogado.onboardingTCC = 0;
    
    // Reseta limite diário do chat
    if (usuarioLogado.ultimaDataChat !== new Date().toLocaleDateString()) {
        usuarioLogado.ultimaDataChat = new Date().toLocaleDateString();
        usuarioLogado.mensagensTCCHoje = 0;
        atualizarBanco(usuarioLogado);
    }

    // --- LÓGICA DE OFENSIVA (STREAK) DIÁRIA ---
    const hoje = new Date().toLocaleDateString();
    
    if (!usuarioLogado.ultimaDataAcesso) {
        usuarioLogado.sequencia = 1;
        usuarioLogado.ultimaDataAcesso = hoje;
        atualizarBanco(usuarioLogado);
    } else if (usuarioLogado.ultimaDataAcesso !== hoje) {
        let partesUltimo = usuarioLogado.ultimaDataAcesso.split('/');
        let partesHoje = hoje.split('/');
        
        let dataUltimo = new Date(`${partesUltimo[2]}-${partesUltimo[1]}-${partesUltimo[0]}`);
        let dataHoje = new Date(`${partesHoje[2]}-${partesHoje[1]}-${partesHoje[0]}`);
        let diferencaDias = Math.floor((dataHoje - dataUltimo) / (1000 * 60 * 60 * 24));

        if (diferencaDias === 1) {
            usuarioLogado.sequencia++;
        } else if (diferencaDias > 1) {
            usuarioLogado.sequencia = 1;
        }
        
        usuarioLogado.ultimaDataAcesso = hoje;
        atualizarBanco(usuarioLogado);
    }
    // ------------------------------------------
    
    // 4. Atualiza os textos de pontos na tela (com 1 casa decimal sem arredondamento desnecessário)
    if(document.getElementById('pontosDisplay')) {
        document.getElementById('pontosDisplay').textContent = `${Number(usuarioLogado.pontos || 0).toFixed(1)} pts`;
    }
    if(document.getElementById('userStreak')) {
        document.getElementById('userStreak').textContent = `${usuarioLogado.sequencia} Dias de Ofensiva`;
    }
    if(document.getElementById('sequenciaStats')) {
        document.getElementById('sequenciaStats').innerHTML = `🔥 Sequência: <strong>${usuarioLogado.sequencia} Dias</strong>`;
    }
    if(document.getElementById('acertosStats')) {
        document.getElementById('acertosStats').innerHTML = `✅ Acertos: <strong>${usuarioLogado.totalAcertos || 0}</strong>`;
    }
    if(document.getElementById('errosStats')) {
        let erros = (usuarioLogado.totalQuestoes || 0) - (usuarioLogado.totalAcertos || 0);
        document.getElementById('errosStats').innerHTML = `❌ Erros: <strong>${erros}</strong>`;
    }
}

// ==========================================
// NOTIFICAÇÕES PASSAGEIRAS NO CANTO (TOAST)
// ==========================================
function mostrarToastCanto(titulo, mensagem, tipo = 'warning', duracaoMs = 4500) {
    const container = document.getElementById('toast-canto-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-card toast-${tipo}`;

    let icone = '⏱️';
    let rotulo = 'AVISO DE TEMPO';
    if (tipo === 'info') {
        icone = '🎯';
        rotulo = 'SIMULADO';
    } else if (tipo === 'success') {
        icone = '✅';
        rotulo = 'SUCESSO';
    }

    toast.innerHTML = `
        <div class="toast-card-glow"></div>
        <div class="toast-card-icon">${icone}</div>
        <div class="toast-card-content">
            <div class="toast-card-header">
                <span class="toast-card-badge">${rotulo}</span>
                <button type="button" class="toast-card-close" aria-label="Fechar">&times;</button>
            </div>
            <h4 class="toast-card-title">${titulo}</h4>
            <p class="toast-card-text">${mensagem}</p>
        </div>
        <div class="toast-card-progress">
            <div class="toast-card-progress-bar" style="animation-duration: ${duracaoMs}ms;"></div>
        </div>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add('toast-visible');
    });

    const fechar = () => {
        toast.classList.remove('toast-visible');
        toast.classList.add('toast-leaving');
        setTimeout(() => {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 380);
    };

    const btnClose = toast.querySelector('.toast-card-close');
    if (btnClose) {
        btnClose.onclick = (e) => {
            e.stopPropagation();
            fechar();
        };
    }

    let timer = setTimeout(fechar, duracaoMs);

    toast.addEventListener('mouseenter', () => {
        clearTimeout(timer);
        const progressBar = toast.querySelector('.toast-card-progress-bar');
        if (progressBar) progressBar.style.animationPlayState = 'paused';
    });
    toast.addEventListener('mouseleave', () => {
        const progressBar = toast.querySelector('.toast-card-progress-bar');
        if (progressBar) progressBar.style.animationPlayState = 'running';
        timer = setTimeout(fechar, 2000);
    });
}

// ==========================================
// DESEMPENHO DINÂMICO (INSTRUMENTO DE PONTEIRO / GAUGE)
// ==========================================
function atualizarDesempenho() {
    let porcentagem = 0;
    if (usuarioLogado && usuarioLogado.totalQuestoes > 0) {
        porcentagem = Math.round((usuarioLogado.totalAcertos / usuarioLogado.totalQuestoes) * 100);
    }
    porcentagem = Math.max(0, Math.min(100, porcentagem));

    // Atualiza texto digital do progresso
    const progressText = document.querySelector('.progress-value');
    if (progressText) {
        progressText.textContent = `${porcentagem}%`;
    }

    // Calcula a rotação angular do ponteiro (-90deg para 0% até +90deg para 100%)
    const angulo = -90 + (porcentagem * 1.8);
    const needle = document.getElementById('gaugeNeedle');
    const needleBody = document.getElementById('needleBody');
    const statusBadge = document.getElementById('gaugeStatus');

    if (needle) {
        needle.style.transform = `translateX(-50%) rotate(${angulo}deg)`;
    }

    // Critérios de classificação:
    let statusClass = 'status-ruim';
    let statusTexto = 'Ruim';
    let needleColor = 'linear-gradient(to top, #1e293b 0%, #dc2626 100%)';

    if (porcentagem <= 40) {
        statusClass = 'status-ruim';
        statusTexto = 'Ruim';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #dc2626 100%)';
    } else if (porcentagem <= 70) {
        statusClass = 'status-medio';
        statusTexto = 'Médio';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #f59e0b 100%)';
    } else {
        statusClass = 'status-bom';
        statusTexto = 'Bom';
        needleColor = 'linear-gradient(to top, #1e293b 0%, #10b981 100%)';
    }

    if (statusBadge) {
        statusBadge.className = `gauge-status-badge ${statusClass}`;
        statusBadge.textContent = statusTexto;
    }

    if (needleBody) {
        needleBody.style.background = needleColor;
    }

    // Compatibilidade com elemento legado
    const circularProgress = document.querySelector('.circular-progress');
    if (circularProgress) {
        let graus = (porcentagem / 100) * 360;
        circularProgress.style.background = `conic-gradient(var(--primary-color) ${graus}deg, var(--border-color) 0deg)`;
    }
}

// ==========================================
// NAVEGAÇÃO E TEMA
// ==========================================
function toggleMenuConfig() { 
    abrirModalMeuPerfil();
}

function abrirModalMeuPerfil() {
    const modal = document.getElementById('modal-meu-perfil');
    if (!modal) return;

    if (document.getElementById('meuPerfilNomeModal')) {
        document.getElementById('meuPerfilNomeModal').textContent = usuarioLogado.nome || 'Aluno';
    }
    if (document.getElementById('meuPerfilRoleModal')) {
        document.getElementById('meuPerfilRoleModal').textContent = (usuarioLogado.perfil === 'Professor') ? 'Professor' : 'Estudante Ativo';
    }
    if (document.getElementById('userEmailDisplay')) {
        document.getElementById('userEmailDisplay').textContent = usuarioLogado.email || 'aluno@escola.sp.gov.br';
    }
    const avatarEl = document.getElementById('meuPerfilAvatarModal');
    if (avatarEl) {
        if (usuarioLogado.foto) {
            avatarEl.style.backgroundImage = `url(${usuarioLogado.foto})`;
            avatarEl.style.backgroundSize = 'cover';
            avatarEl.style.backgroundPosition = 'center';
            avatarEl.textContent = '';
        } else {
            avatarEl.style.backgroundImage = 'none';
            avatarEl.textContent = '👤';
        }
    }

    carregarDadosPerfil();

    if (document.getElementById('acertosStats')) {
        document.getElementById('acertosStats').textContent = usuarioLogado.totalAcertos || 0;
    }
    if (document.getElementById('errosStats')) {
        let erros = (usuarioLogado.totalQuestoes || 0) - (usuarioLogado.totalAcertos || 0);
        document.getElementById('errosStats').textContent = erros >= 0 ? erros : 0;
    }
    if (document.getElementById('sequenciaStats')) {
        document.getElementById('sequenciaStats').innerHTML = `🔥 Sequência: <strong>${usuarioLogado.sequencia || 0} Dias</strong>`;
    }
    let minutosEstudados = (usuarioLogado.tempoEstudadoSegundos || 0) / 60;
    let h = Math.floor(minutosEstudados / 60);
    let m = Math.floor(minutosEstudados % 60);
    if (document.getElementById('horasEstudadasStats')) {
        document.getElementById('horasEstudadasStats').innerHTML = `⏱ Horas: <strong>${h}h ${m}m</strong>`;
    }

    modal.classList.remove('hidden');
    const conquistasDrop = document.getElementById('conquistasDropdown');
    if (conquistasDrop) conquistasDrop.classList.add('hidden');
}

function fecharModalMeuPerfil() {
    const modal = document.getElementById('modal-meu-perfil');
    if (modal) modal.classList.add('hidden');
}

function toggleConquistas() { 
    const cDrop = document.getElementById('conquistasDropdown');
    if (cDrop) cDrop.classList.toggle('hidden'); 
    fecharModalMeuPerfil(); 
    renderizarConquistas(); 
}
function aplicarTema(tema) {
    const isLight = (tema === 'light');
    if (isLight) {
        document.body.classList.remove('dark-theme');
        document.documentElement.classList.remove('dark-theme');
    } else {
        document.body.classList.add('dark-theme');
        document.documentElement.classList.add('dark-theme');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-theme');
    const novoTema = isDark ? 'light' : 'dark';
    localStorage.setItem('tema', novoTema);
    aplicarTema(novoTema);
}

// Inicializa o tema na inicialização
(function() {
    const temaSalvo = localStorage.getItem('tema');
    aplicarTema(temaSalvo === 'light' ? 'light' : 'dark');
})();

// Se for professor, renomeia o item "Estudar" para "Publicar" na barra lateral
if (usuarioLogado && usuarioLogado.perfil === 'Professor') {
    const menuEstudar = document.getElementById('menu-estudar');
    if (menuEstudar) {
        menuEstudar.innerHTML = '<span class="nav-icon">📤</span><span class="nav-label">Publicar</span>';
        menuEstudar.setAttribute('data-tooltip', 'Publicar');
    }
}

// ==========================================
// CONTROLE DA SIDEBAR RETRÁTIL (DESKTOP E MOBILE)
// ==========================================
function toggleSidebar(forcar) {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
        if (typeof forcar === 'boolean') {
            document.body.classList.toggle('sidebar-mobile-open', forcar);
        } else {
            document.body.classList.toggle('sidebar-mobile-open');
        }
    } else {
        const isCollapsed = typeof forcar === 'boolean' 
            ? !forcar 
            : !document.body.classList.contains('sidebar-collapsed');
        
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        try {
            localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
        } catch(e) {}
    }
}
window.toggleSidebar = toggleSidebar;

// Atalho de teclado rápido: Ctrl + B para recolher/expandir o menu
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'b' || e.key === 'B')) {
        const tag = (e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '');
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;
        e.preventDefault();
        toggleSidebar();
    }
});

document.querySelectorAll('.sidebar nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        document.querySelectorAll('.sidebar nav a').forEach(l => l.classList.remove('active'));
        this.classList.add('active'); 

        // Se estiver em dispositivo móvel, fecha automaticamente o drawer lateral ao selecionar
        if (window.innerWidth <= 768) {
            document.body.classList.remove('sidebar-mobile-open');
        }

        document.getElementById('secao-inicio').classList.add('hidden');
        document.getElementById('secao-estudar').classList.add('hidden');
        document.getElementById('secao-pomodoro').classList.add('hidden');
        document.getElementById('secao-simulados').classList.add('hidden');
        document.getElementById('secao-tcc').classList.add('hidden'); 
        
        document.getElementById('btnChatIA').style.display = 'none';
        document.getElementById('chatIAModal').classList.add('hidden');

        if (this.id === 'menu-inicio') {
            const secaoInicio = document.getElementById('secao-inicio');
            secaoInicio.classList.remove('hidden');
            secaoInicio.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (this.id === 'menu-estudar') {
            document.getElementById('secao-estudar').classList.remove('hidden');
            const tituloSecao = document.getElementById('titulo-secao-estudar');
            const subtituloSecao = document.getElementById('subtitulo-secao-estudar');
            if (usuarioLogado && usuarioLogado.perfil === 'Professor') {
                if(tituloSecao) tituloSecao.innerHTML = '📤 Publicar Conteúdo';
                if(subtituloSecao) subtituloSecao.textContent = 'Publique aulas, vídeos e materiais organizados por disciplina para os alunos';
            } else {
                if(tituloSecao) tituloSecao.innerHTML = '📚 Material de Estudos';
                if(subtituloSecao) subtituloSecao.textContent = 'Acesse as aulas e conteúdos organizados por disciplina';
            }
            document.getElementById('btnChatIA').style.display = 'block';
            carregarMateria('Português'); 
        } else if (this.id === 'menu-pomodoro') {
            document.getElementById('secao-pomodoro').classList.remove('hidden');
            atualizarVisorPomodoro();
        } else if (this.id === 'menu-simulados') {
            document.getElementById('secao-simulados').classList.remove('hidden');
            cancelarSimulado();
        } else if (this.id === 'menu-tcc') {
            document.getElementById('secao-tcc').classList.remove('hidden');
            iniciarChatTCC();
        }
    });
});
if(document.getElementById('btnChatIA')) document.getElementById('btnChatIA').style.display = 'none';

// ==========================================
// PERFIL E GRAVAÇÃO DE DADOS
// ==========================================
function atualizarBanco(usuarioAtualizado) {
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtualizado));
    let usuariosBD = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let index = usuariosBD.findIndex(u => u.rm === usuarioAtualizado.rm);
    if(index !== -1) {
        usuariosBD[index] = usuarioAtualizado;
    } else {
        usuariosBD.push(usuarioAtualizado);
    }
    localStorage.setItem('bd_usuarios', JSON.stringify(usuariosBD));

    // Sincroniza com a API do Servidor (persistência global entre navegadores)
    if (window.API && typeof window.API.atualizarUsuario === 'function') {
        window.API.atualizarUsuario(usuarioAtualizado).catch(err => {
            console.warn('[StudySP] Falha ao sincronizar dados com o servidor:', err);
        });
    }
}

function salvarPerfil() {
    if (document.getElementById('perfilEndereco')) usuarioLogado.endereco = document.getElementById('perfilEndereco').value;
    if (document.getElementById('perfilCidade')) usuarioLogado.cidade = document.getElementById('perfilCidade').value;
    if (document.getElementById('perfilTelefone')) usuarioLogado.telefone = document.getElementById('perfilTelefone').value;
    if (document.getElementById('perfilIdade')) usuarioLogado.idade = document.getElementById('perfilIdade').value;
    if (document.getElementById('perfilBio')) usuarioLogado.bio = document.getElementById('perfilBio').value;
    atualizarBanco(usuarioLogado);
    mostrarToastCanto('Perfil Atualizado', 'Suas informações foram salvas com sucesso!', 'success');
    fecharModalMeuPerfil();
}

// ==========================================
// GERENCIAMENTO DA FOTO DE PERFIL E COMPRESSÃO
// ==========================================
function aplicarFotoPerfilNaInterface(fotoUrl) {
    const display = document.getElementById('userAvatarDisplay');
    if (display) {
        if (fotoUrl) {
            display.style.backgroundImage = `url(${fotoUrl})`;
            display.style.backgroundSize = 'cover';
            display.style.backgroundPosition = 'center';
            display.style.color = 'transparent';
            display.innerText = '';
        } else {
            display.style.backgroundImage = 'none';
            display.style.color = '#ffffff';
            display.innerText = '👤';
        }
    }

    const sidebarAvatar = document.getElementById('sidebarAvatar');
    if (sidebarAvatar) {
        if (fotoUrl) {
            sidebarAvatar.style.backgroundImage = `url(${fotoUrl})`;
            sidebarAvatar.style.backgroundSize = 'cover';
            sidebarAvatar.style.backgroundPosition = 'center';
            sidebarAvatar.style.color = 'transparent';
            sidebarAvatar.innerText = '';
        } else {
            sidebarAvatar.style.backgroundImage = 'none';
            sidebarAvatar.style.color = '#ffffff';
            sidebarAvatar.innerText = '👤';
        }
    }

    const modalAvatar = document.getElementById('meuPerfilAvatarModal');
    if (modalAvatar) {
        if (fotoUrl) {
            modalAvatar.style.backgroundImage = `url(${fotoUrl})`;
            modalAvatar.style.backgroundSize = 'cover';
            modalAvatar.style.backgroundPosition = 'center';
            modalAvatar.style.color = 'transparent';
            modalAvatar.innerText = '';
        } else {
            modalAvatar.style.backgroundImage = 'none';
            modalAvatar.style.color = '#ffffff';
            modalAvatar.innerText = '👤';
        }
    }
}

// Compressão inteligente de imagens via Canvas no cliente (evita estouro de cota do LocalStorage no celular)
function comprimirImagemBase64(file, maxDim = 800, qualidade = 0.85) {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        if (!file.type || !file.type.startsWith('image/')) {
            const r = new FileReader();
            r.onload = e => resolve(e.target.result);
            r.onerror = reject;
            r.readAsDataURL(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
            const img = new Image();
            img.onload = function() {
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                resolve(canvas.toDataURL(mime, qualidade));
            };
            img.onerror = () => resolve(evt.target.result);
            img.src = evt.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function carregarDadosPerfil() {
    if (!usuarioLogado) return;
    const endEl = document.getElementById('perfilEndereco');
    if (endEl && usuarioLogado.endereco) endEl.value = usuarioLogado.endereco;
    const cidEl = document.getElementById('perfilCidade');
    if (cidEl && usuarioLogado.cidade) cidEl.value = usuarioLogado.cidade;
    const telEl = document.getElementById('perfilTelefone');
    if (telEl && usuarioLogado.telefone) telEl.value = usuarioLogado.telefone;
    const idEl = document.getElementById('perfilIdade');
    if (idEl && usuarioLogado.idade) idEl.value = usuarioLogado.idade;
    const bioEl = document.getElementById('perfilBio');
    if (bioEl && usuarioLogado.bio) bioEl.value = usuarioLogado.bio;

    aplicarFotoPerfilNaInterface(usuarioLogado.foto);
}

const inputFotoEl = document.getElementById('inputFoto');
if (inputFotoEl) {
    inputFotoEl.addEventListener('change', async function(e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        try {
            mostrarToastCanto('Processando Imagem', 'Otimizando sua foto de perfil...', 'info', 2000);
            // Comprime a foto para no máximo 320px (perfeita para avatar e ultraleve, ~35KB)
            const base64Otimizada = await comprimirImagemBase64(file, 320, 0.85);
            usuarioLogado.foto = base64Otimizada;
            atualizarBanco(usuarioLogado);
            aplicarFotoPerfilNaInterface(usuarioLogado.foto);

            // Se for Professor, atualiza a foto em todas as matérias que ele já publicou
            if (usuarioLogado.perfil === 'Professor') {
                const conteudos = obterConteudosLocais();
                let mudou = false;
                conteudos.forEach(item => {
                    const pertenceAoProf = (item.profRM && String(item.profRM) === String(usuarioLogado.rm)) || 
                                          (item.profNome && item.profNome.trim().toLowerCase() === usuarioLogado.nome.trim().toLowerCase());
                    if (pertenceAoProf) {
                        item.profFoto = usuarioLogado.foto;
                        item.profRM = usuarioLogado.rm;
                        mudou = true;
                        persistirConteudoServidor(item);
                    }
                });
                if (mudou) {
                    salvarConteudosLocais(conteudos);
                    const btnAtivo = document.querySelector('.materia-btn.active');
                    if (btnAtivo) {
                        carregarMateria(btnAtivo.innerText.trim());
                    }
                }
            }

            carregarRank(); 
            mostrarToastCanto('Foto Atualizada', 'Sua foto de perfil foi atualizada com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao atualizar foto de perfil:', err);
            mostrarToastCanto('Erro', 'Não foi possível carregar a imagem selecionada.', 'error');
        }
    });
}

function sairDaConta() { localStorage.removeItem('usuarioLogado'); window.location.href = 'login.html'; }


// RANK REAL DOS ALUNOS E PÓDIO
// ==========================================
function renderizarRankComAlunos(alunos) {
    let userRankIndex = alunos.findIndex(u => u.rm === usuarioLogado.rm);
    let rankPos = userRankIndex !== -1 ? userRankIndex + 1 : '-';
    if(document.getElementById('rankPositionDisplay')) {
        document.getElementById('rankPositionDisplay').textContent = `Você está no Top ${rankPos}`;
    }
    
    // 1. RENDERIZAR O PÓDIO (TOP 3 NA TELA INÍCIO)
    const podioContainer = document.getElementById('podio-container');
    if (podioContainer) {
        let top3 = alunos.slice(0, 3);
        let htmlPodio = '';
        
        const posicoes = [
            { rank: 2, aluno: top3[1], class: 'podio-prata', height: '200px' },
            { rank: 1, aluno: top3[0], class: 'podio-ouro', height: '245px' },
            { rank: 3, aluno: top3[2], class: 'podio-bronze', height: '175px' }
        ];
        
        posicoes.forEach(pos => {
            if (pos.aluno) {
                let avatarStyle = pos.aluno.foto ? `background-image: url(${pos.aluno.foto}); color: transparent; background-size: cover; background-position: center;` : ``;
                
                htmlPodio += `
                    <div class="degrau-podio ${pos.class}" style="height: ${pos.height};">
                        <div class="podio-avatar" style="${avatarStyle}">👤</div>
                        <div class="podio-posicao">${pos.rank}º</div>
                        <div class="podio-nome">${pos.aluno.nome.split(' ')[0]}</div>
                        <div class="podio-pontos">${Number(pos.aluno.pontos || 0).toFixed(1)} pts</div>
                        <button class="btn-ver-perfil" onclick="mostrarPerfilRank('${pos.aluno.rm}')">Ver Perfil</button>
                    </div>
                `;
            } else {
                htmlPodio += `
                    <div class="degrau-podio ${pos.class}" style="height: ${pos.height}; opacity: 0.3;">
                        <div class="podio-posicao">${pos.rank}º</div>
                        <div class="podio-nome">Vazio</div>
                    </div>
                `;
            }
        });
        podioContainer.innerHTML = htmlPodio;
    }

    // 2. RENDERIZAR A LISTA LATERAL COMPLETA
    const rankList = document.getElementById('rankList');
    if (rankList) {
        rankList.innerHTML = ''; 
        let htmlRank = '';
        alunos.forEach((aluno, index) => {
            let isVoce = aluno.rm === usuarioLogado.rm ? " (Você)" : "";
            let bgStyle = isVoce ? 'background-color: rgba(0, 123, 255, 0.1); border-radius: 5px;' : '';
            let avatarStyle = aluno.foto ? `background-image: url(${aluno.foto}); color: transparent; background-size: cover; background-position: center;` : ``;
            let pontosFormatados = Number(aluno.pontos || 0).toFixed(1);
            htmlRank += `
                <div class="rank-item" style="${bgStyle}">
                    <span class="posicao">#${index + 1}</span>
                    <div class="avatar-circle" style="width:30px; height:30px; font-size:14px; ${avatarStyle}">👤</div>
                    <div class="rank-info">
                        <span class="rank-nome">${aluno.nome}${isVoce}</span>
                        <span class="rank-stats">🔥 ${aluno.sequencia} Dias | ⭐ ${pontosFormatados} pts</span>
                    </div>
                    <button onclick="mostrarPerfilRank('${aluno.rm}')" style="background:none; border:none; color:var(--primary-color); cursor:pointer; font-weight:bold;">Ver</button>
                </div>
            `;
        });
        rankList.innerHTML = htmlRank;
    }
}

async function carregarRank() {
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let alunos = usuarios.filter(user => user.perfil === 'Aluno');
    
    alunos.forEach(aluno => {
        if (!aluno.pontos) aluno.pontos = 0;
        if (!aluno.sequencia) aluno.sequencia = 0;
    });
    
    alunos.sort((a, b) => b.pontos - a.pontos);
    renderizarRankComAlunos(alunos);

    // Busca ranking sincronizado da nuvem para ver alunos de todos os navegadores
    try {
        if (window.API && typeof window.API.buscarUsuarios === 'function') {
            const usuariosRemotos = await window.API.buscarUsuarios();
            if (Array.isArray(usuariosRemotos) && usuariosRemotos.length > 0) {
                localStorage.setItem('bd_usuarios', JSON.stringify(usuariosRemotos));
                let alunosRemotos = usuariosRemotos.filter(user => user.perfil === 'Aluno');
                alunosRemotos.forEach(aluno => {
                    if (!aluno.pontos) aluno.pontos = 0;
                    if (!aluno.sequencia) aluno.sequencia = 0;
                });
                alunosRemotos.sort((a, b) => b.pontos - a.pontos);
                renderizarRankComAlunos(alunosRemotos);
            }
        }
    } catch (err) {
        console.warn('[StudySP] Erro ao sincronizar ranking com servidor:', err);
    }
}

// ----------------------------------------------------
// NOVO MODAL DE PERFIL (SUBSTITUI O ALERT)
// ----------------------------------------------------
async function mostrarPerfilRank(rmDestino) {
    let usuarios = JSON.parse(localStorage.getItem('bd_usuarios')) || [];
    let alunoAlvo = usuarios.find(u => u.rm === rmDestino);
    
    if (!alunoAlvo && window.API && typeof window.API.buscarUsuario === 'function') {
        try {
            alunoAlvo = await window.API.buscarUsuario(rmDestino);
        } catch(e) {}
    }
    
    if(alunoAlvo) {
        // Preenche os dados HTML do modal
        document.getElementById('modal-perfil-nome').textContent = alunoAlvo.nome;
        document.getElementById('modal-perfil-role').textContent = alunoAlvo.perfil || 'Aluno';
        document.getElementById('modal-perfil-cidade').textContent = alunoAlvo.cidade || 'Não informada';
        if (document.getElementById('modal-perfil-idade')) {
            document.getElementById('modal-perfil-idade').textContent = alunoAlvo.idade ? `${alunoAlvo.idade} anos` : 'Não informada';
        }
        document.getElementById('modal-perfil-pontos').textContent = Number(alunoAlvo.pontos || 0).toFixed(1) + ' pts';
        document.getElementById('modal-perfil-ofensiva').textContent = (alunoAlvo.sequencia || 0) + ' Dias';
        
        const acertos = alunoAlvo.totalAcertos || 0;
        const totalQ = alunoAlvo.totalQuestoes || 0;
        const erros = Math.max(0, totalQ - acertos);
        if (document.getElementById('modal-perfil-acertos')) {
            document.getElementById('modal-perfil-acertos').textContent = acertos;
        }
        if (document.getElementById('modal-perfil-erros')) {
            document.getElementById('modal-perfil-erros').textContent = erros;
        }

        document.getElementById('modal-perfil-bio').textContent = `"${alunoAlvo.bio || 'Este utilizador ainda não escreveu uma biografia.'}"`;
        
        // Lógica para mostrar a foto ou o emoji padrão
        const avatarEl = document.getElementById('modal-perfil-avatar');
        if (alunoAlvo.foto) {
            avatarEl.style.backgroundImage = `url(${alunoAlvo.foto})`;
            avatarEl.textContent = ''; // Tira o emoji se tiver foto
        } else {
            avatarEl.style.backgroundImage = 'none';
            avatarEl.textContent = '👤';
        }

        // Exibe o modal na tela
        document.getElementById('modal-perfil').classList.remove('hidden');
    }
}

// Função para fechar o Modal
function fecharModalPerfil() {
    document.getElementById('modal-perfil').classList.add('hidden');
}

// Permite fechar o modal clicando fora dele (no fundo escuro)
document.addEventListener('click', function(e) {
    const modalOverlay = document.getElementById('modal-perfil');
    // Verifica se o clique foi exatamente no fundo escuro e não dentro da caixa
    if (e.target === modalOverlay) {
        fecharModalPerfil();
    }
});

// Lógica de ajuda e contador do Rank
document.getElementById('btnRankHelp')?.addEventListener('click', () => {
    document.getElementById('modal-rank-help').classList.remove('hidden');
});
function fecharModalRankHelp() {
    document.getElementById('modal-rank-help').classList.add('hidden');
}

function updateRankCountdown() {
    const countdownEl = document.getElementById('rankCountdown');
    if (!countdownEl) return;
    
    const now = new Date();
    // Próximo dia 1
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const diff = nextMonth - now;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);
    
    countdownEl.textContent = `Reset em: ${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(updateRankCountdown, 1000);
updateRankCountdown();

// ==========================================
// ESTUDAR (CONTEÚDO) - ATUALIZADO PARA LER O BANCO DO PROFESSOR
// ==========================================
const LISTA_MATERIAS = ['Português', 'Inglês', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Filosofia', 'Sociologia', 'Redação'];

function ehProfessor() {
    return !!(usuarioLogado && usuarioLogado.perfil === 'Professor');
}

function extrairYoutubeId(urlOuId) {
    if (!urlOuId) return null;
    const str = String(urlOuId).trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
        return str;
    }
    const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = str.match(regExp);
    return (match && match[1]) ? match[1] : str;
}

function escapeHtml(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function obterConteudosLocais() {
    return JSON.parse(localStorage.getItem('bd_conteudos')) || [];
}

function salvarConteudosLocais(lista) {
    localStorage.setItem('bd_conteudos', JSON.stringify(lista));
}

function ordemConteudo(item) {
    if (item && item.ordem != null && item.ordem !== '') return Number(item.ordem);
    return Number(item && item.id) || 0;
}

function ordenarConteudos(lista) {
    return [...lista].sort((a, b) => ordemConteudo(b) - ordemConteudo(a));
}

function persistirConteudoServidor(conteudo) {
    if (window.API && typeof window.API.salvarConteudo === 'function') {
        window.API.salvarConteudo(conteudo).catch(err => {
            console.warn('[StudySP] Falha ao enviar aula para o servidor:', err);
        });
    }
}

function renderizarConteudosNaTela(filtrados, materiaNome) {
    const container = document.getElementById('conteudo-materia');
    if (!container) return;

    const lista = ordenarConteudos(filtrados);

    if (lista.length === 0) {
        container.innerHTML = `
            <div class="tema-card">
                <h3 style="color:var(--primary-color);">${escapeHtml(materiaNome)}</h3>
                <p style="margin-top:10px; color:var(--text-muted); line-height: 1.6;">Nenhum conteúdo publicado pelo professor para esta matéria ainda.</p>
            </div>
        `;
        return;
    }

    const professor = ehProfessor();

    container.innerHTML = lista.map((item, index) => {
        const idSeguro = escapeHtml(item.id);
        
        // Determina a foto mais recente do professor que publicou
        let profFoto = item.profFoto;
        if (usuarioLogado && ((item.profRM && String(item.profRM) === String(usuarioLogado.rm)) || (item.profNome && usuarioLogado.nome && item.profNome.trim().toLowerCase() === usuarioLogado.nome.trim().toLowerCase()))) {
            profFoto = usuarioLogado.foto || profFoto;
        } else {
            const todosUsuarios = JSON.parse(localStorage.getItem('bd_usuarios') || '[]');
            const profEncontrado = todosUsuarios.find(u => (item.profRM && String(u.rm) === String(item.profRM)) || (item.profNome && u.nome && item.profNome.trim().toLowerCase() === u.nome.trim().toLowerCase()));
            if (profEncontrado && profEncontrado.foto) {
                profFoto = profEncontrado.foto;
            }
        }
        let avatarStyle = profFoto ? `background-image: url(${profFoto}); background-size: cover; background-position: center; color: transparent;` : '';
        const horario = item.editado
            ? `✏️ Editado em ${item.dataHora || 'agora'}`
            : (item.dataHora || 'Recentemente');

        let acoesHtml = '';
        if (professor) {
            const opcoesMover = LISTA_MATERIAS
                .filter(m => m.toLowerCase() !== String(item.materia || '').toLowerCase())
                .map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
                .join('');
            acoesHtml = `
                <div class="acoes-publicacao">
                    <button type="button" class="btn-acao-pub" title="Mover para cima" ${index === 0 ? 'disabled' : ''} onclick="moverConteudo('${idSeguro}', -1)">↑</button>
                    <button type="button" class="btn-acao-pub" title="Mover para baixo" ${index === lista.length - 1 ? 'disabled' : ''} onclick="moverConteudo('${idSeguro}', 1)">↓</button>
                    <select class="select-mover-materia" title="Mover para outra matéria" onchange="pedirMoverMateria('${idSeguro}', this.value)">
                        <option value="" selected>Mover para...</option>
                        ${opcoesMover}
                    </select>
                    <button type="button" class="btn-acao-pub" onclick="iniciarEdicaoConteudo('${idSeguro}')">✏️ Editar</button>
                    <button type="button" class="btn-acao-pub btn-apagar" onclick="pedirApagarConteudo('${idSeguro}')">🗑️ Apagar</button>
                </div>
            `;
        }

        let htmlCard = `<div class="tema-card" style="margin-bottom: 25px;">
            <div class="tema-card-header">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar-circle" style="width: 32px; height: 32px; font-size: 14px; ${avatarStyle}">👤</div>
                    <div style="display: flex; flex-direction: column;">
                        <span style="font-size: 13px; font-weight: bold; color: var(--text-main);">${escapeHtml(item.profNome || 'Professor')}</span>
                        <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(horario)}</span>
                    </div>
                </div>
                ${acoesHtml}
            </div>
            <h3 style="color:var(--primary-color); font-size: 20px;">${escapeHtml(item.titulo)}</h3>
            <p style="margin: 15px 0; line-height: 1.6; white-space: pre-wrap; font-size: 15px;">${escapeHtml(item.texto)}</p>
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px;">
        `;

        // Links (suporta múltiplos links ou link único legado)
        const listaLinks = (item.links && Array.isArray(item.links)) ? item.links : (item.link ? [item.link] : []);
        listaLinks.forEach((lnk, i) => {
            const url = typeof lnk === 'object' ? lnk.url : lnk;
            const rotulo = (typeof lnk === 'object' && lnk.texto) ? lnk.texto : (listaLinks.length > 1 ? `🔗 Acessar Link #${i + 1}` : '🔗 Acessar Link Externo');
            if (url && String(url).trim()) {
                htmlCard += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="padding: 8px 15px; background: rgba(0, 123, 255, 0.1); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">${escapeHtml(rotulo)}</a>`;
            }
        });

        // Arquivos anexos (suporta múltiplos arquivos ou arquivo único legado)
        const listaArquivos = (item.arquivos && Array.isArray(item.arquivos)) ? item.arquivos : (item.arquivo ? [{ arquivo: item.arquivo, nomeArquivo: item.nomeArquivo }] : []);
        listaArquivos.forEach((arq, i) => {
            if (arq && arq.arquivo) {
                const nomeArq = arq.nomeArquivo || `arquivo_${i + 1}`;
                const ehImagem = arq.arquivo.startsWith('data:image/') || String(nomeArq).match(/\.(png|jpe?g|webp|gif)$/i);
                const icone = ehImagem ? '🖼️' : (String(nomeArq).endsWith('.pdf') ? '📄' : '📎');
                htmlCard += `<a href="${arq.arquivo}" download="${escapeHtml(nomeArq)}" style="padding: 8px 15px; background: rgba(76, 175, 80, 0.12); border: 1px solid #4CAF50; color: #4CAF50; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 13px; display: inline-flex; align-items: center; gap: 6px;">${icone} Baixar ${escapeHtml(nomeArq)}</a>`;
            }
        });
        
        htmlCard += `</div>`; 

        // Vídeos do YouTube (suporta múltiplos vídeos ou vídeo único legado)
        const listaVideos = (item.videos && Array.isArray(item.videos)) ? item.videos : (item.video ? [item.video] : []);
        const videosValidos = listaVideos.map(v => extrairYoutubeId(v)).filter(Boolean);
        
        if (videosValidos.length > 0) {
            const isSingle = videosValidos.length === 1;
            htmlCard += `<div class="grid-videos-conteudo ${isSingle ? 'single-video' : ''}">`;
            videosValidos.forEach((vId, vIdx) => {
                const badgeLabel = videosValidos.length > 1 ? `<span class="video-badge-num">Vídeo ${vIdx + 1} de ${videosValidos.length}</span>` : '';
                htmlCard += `
                    <div class="video-wrapper-conteudo">
                        ${badgeLabel}
                        <iframe src="https://www.youtube.com/embed/${escapeHtml(vId)}" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
                    </div>
                `;
            });
            htmlCard += `</div>`;
        }

        htmlCard += `</div>`; 
        return htmlCard;
    }).join(''); 
}

async function carregarMateria(materiaNome) {
    // 1. Atualiza os botões visuais da matéria selecionada
    document.querySelectorAll('.materia-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText === materiaNome) btn.classList.add('active');
    });
    const selectMateria = document.getElementById('profMateria');
    if (selectMateria && !document.getElementById('profEditandoId')?.value) {
        selectMateria.value = materiaNome;
    }

    // 2. Puxa os conteúdos salvos no cache local para exibição instantânea
    let conteudos = JSON.parse(localStorage.getItem('bd_conteudos')) || [];
    let filtrados = conteudos.filter(c => c.materia && c.materia.toLowerCase() === materiaNome.toLowerCase());
    renderizarConteudosNaTela(filtrados, materiaNome);

    // 3. Sincroniza em segundo plano com o banco de dados do servidor
    try {
        if (window.API && typeof window.API.buscarConteudos === 'function') {
            const conteudosServidor = await window.API.buscarConteudos();
            if (Array.isArray(conteudosServidor) && conteudosServidor.length > 0) {
                localStorage.setItem('bd_conteudos', JSON.stringify(conteudosServidor));
                let filtradosServidor = conteudosServidor.filter(c => c.materia && c.materia.toLowerCase() === materiaNome.toLowerCase());
                renderizarConteudosNaTela(filtradosServidor, materiaNome);
            }
        }
    } catch (err) {
        console.warn('[StudySP] Falha ao atualizar conteúdos da matéria do servidor:', err);
    }
}

function toggleChatIA() { document.getElementById('chatIAModal').classList.toggle('hidden'); }

// --- REDIMENSIONAMENTO DO CHAT DA IA DE ESTUDOS ---
function toggleExpandirChatIA() {
    const modal = document.getElementById('chatIAModal');
    const btn = document.getElementById('btnExpandirChatIA');
    if (!modal) return;
    const expandido = modal.classList.toggle('chat-ia-expanded');
    if (btn) {
        btn.textContent = expandido ? '🗗' : '⛶';
        btn.title = expandido ? 'Restaurar tamanho normal' : 'Aumentar / Expandir janela';
    }
    const messagesContainer = document.getElementById('chatMessagesIA');
    if (messagesContainer) {
        setTimeout(() => { messagesContainer.scrollTop = messagesContainer.scrollHeight; }, 120);
    }
}
window.toggleExpandirChatIA = toggleExpandirChatIA;

// --- REDIMENSIONAMENTO DO CHAT DA IA DE ESTUDOS (DESKTOP E DISPOSITIVOS MÓVEIS) ---
(function initChatIaResize() {
    function setupResize() {
        const handle = document.getElementById('chatIaResizeHandle');
        const dragBar = document.getElementById('chatMobileDragBar');
        const modal = document.getElementById('chatIAModal');
        if (!modal) return;

        let isResizing = false;
        let startX = 0;
        let startY = 0;
        let startW = 0;
        let startH = 0;

        function startDrag(clientX, clientY, e) {
            isResizing = true;
            startX = clientX;
            startY = clientY;
            startW = modal.offsetWidth;
            startH = modal.offsetHeight;
            modal.classList.add('chat-ia-resizing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'nwse-resize';
            if (e && e.cancelable && e.type !== 'touchstart') e.preventDefault();
        }

        function onMove(clientX, clientY) {
            if (!isResizing) return;
            const deltaX = startX - clientX;
            const deltaY = startY - clientY;

            const isMobile = window.innerWidth <= 768;
            const newH = Math.max(280, Math.min(window.innerHeight * 0.92, startH + deltaY));

            if (isMobile) {
                modal.style.height = `${newH}px`;
            } else {
                const newW = Math.max(300, Math.min(850, startW + deltaX));
                modal.style.width = `${newW}px`;
                modal.style.height = `${newH}px`;
            }
        }

        function endDrag() {
            if (isResizing) {
                isResizing = false;
                modal.classList.remove('chat-ia-resizing');
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        }

        // Eventos no mouse (Desktop)
        if (handle) {
            handle.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e));
            handle.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    startDrag(e.touches[0].clientX, e.touches[0].clientY, e);
                }
            }, { passive: true });
        }

        // Barra de arraste no celular (Mobile)
        if (dragBar) {
            dragBar.addEventListener('touchstart', (e) => {
                if (e.touches.length === 1) {
                    startDrag(e.touches[0].clientX, e.touches[0].clientY, e);
                }
            }, { passive: true });
            dragBar.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY, e));
        }

        window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
        window.addEventListener('touchmove', (e) => {
            if (isResizing && e.touches.length === 1) {
                onMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
        window.addEventListener('touchcancel', endDrag);
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', setupResize);
    } else {
        setupResize();
    }
})();

// ==========================================
// POMODORO E MULTIPLICADOR
// ==========================================
let pomodoroTimer = null;
let tempoRestante = 0;
let tempoTotalSessao = 0;
let modoEstudo = true; 
let rodando = false;

let eyeOpen = true;
function toggleMiniTimerEye() {
    eyeOpen = !eyeOpen;
    document.getElementById('btnToggleTimerEye').textContent = eyeOpen ? '👁️' : '🙈';
    atualizarVisorPomodoro();
}

function fecharMiniTimer() {
    const miniW = document.getElementById('miniTimerWidget');
    if (miniW) {
        miniW.classList.add('hidden');
        miniW.style.display = 'none';
    }
}

function reexibirMiniTimer() {
    const miniW = document.getElementById('miniTimerWidget');
    if (miniW) {
        miniW.classList.remove('hidden');
        miniW.style.display = 'flex';
        atualizarVisorPomodoro();
        mostrarToastCanto("Mini Cronômetro", "Mini Cronômetro reexibido no canto da tela!", "info", 2500);
    }
}

function atualizarVisorPomodoro() {
    let minutos = Math.floor(tempoRestante / 60);
    let segundos = tempoRestante % 60;
    let tempoStr = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    
    if(document.getElementById('timerDisplay')){
        document.getElementById('timerDisplay').textContent = tempoStr;
    }
    if(document.getElementById('miniTimerTime')){
        document.getElementById('miniTimerTime').textContent = eyeOpen ? tempoStr : '***';
    }
    
    if (tempoTotalSessao > 0 && document.getElementById('clockHand')) {
        let graus = (1 - (tempoRestante / tempoTotalSessao)) * 360;
        document.getElementById('clockHand').style.transform = `rotate(${graus}deg)`;
    }
}
function calcularMultiplicador() {
    let minutosEstudados = (usuarioLogado.tempoEstudadoSegundos || 0) / 60;
    let novoMultiplicador = 1.0;
    
    // O multiplicador extra só fica ativo quando o cronômetro Pomodoro está de fato RODANDO e em modo ESTUDO!
    if (typeof rodando !== 'undefined' && rodando && typeof modoEstudo !== 'undefined' && modoEstudo) {
        novoMultiplicador = 1.2;
        if (minutosEstudados >= 120) novoMultiplicador = 1.5;
        else if (minutosEstudados >= 60) novoMultiplicador = 1.4;
        else if (minutosEstudados >= 30) novoMultiplicador = 1.3;
    } else {
        novoMultiplicador = 1.0;
    }

    usuarioLogado.multiplicador = novoMultiplicador;
    atualizarBanco(usuarioLogado);
    
    if (document.getElementById('multiplicadorDisplay')) {
        document.getElementById('multiplicadorDisplay').textContent = `${novoMultiplicador.toFixed(1)}x`;
    }
    if (document.getElementById('res-multiplicador')) {
        document.getElementById('res-multiplicador').textContent = `(x${novoMultiplicador.toFixed(1)})`;
    }
    let h = Math.floor(minutosEstudados / 60);
    let m = Math.floor(minutosEstudados % 60);
    if (document.getElementById('totalEstudadoDisplay')) {
        document.getElementById('totalEstudadoDisplay').textContent = `${h}h ${m}m`;
    }
}

function iniciarPomodoro() {
    if (rodando) return;
    
    usuarioLogado.pomodoroIniciado = true;
    
    if (tempoRestante === 0) {
        let inputId = modoEstudo ? 'tempoEstudo' : 'tempoDescanso';
        tempoTotalSessao = parseInt(document.getElementById(inputId).value) * 60;
        tempoRestante = tempoTotalSessao;
    }
    document.getElementById('estadoPomodoro').textContent = modoEstudo ? "A estudar..." : "Em descanso...";
    document.getElementById('estadoPomodoro').style.color = modoEstudo ? "var(--primary-color)" : "#4CAF50";
    
    let miniW = document.getElementById('miniTimerWidget');
    if(miniW) { 
        miniW.classList.remove('hidden'); 
        miniW.style.display = 'flex'; 
    }
    
    rodando = true;
    calcularMultiplicador();
    if (typeof verificarConquistas === 'function') verificarConquistas();

    pomodoroTimer = setInterval(() => {
        if (tempoRestante > 0) {
            tempoRestante--;
            if (modoEstudo) {
                usuarioLogado.tempoEstudadoSegundos = (usuarioLogado.tempoEstudadoSegundos || 0) + 1;
                if (usuarioLogado.tempoEstudadoSegundos % 60 === 0) {
                    calcularMultiplicador();
                    if (typeof verificarConquistas === 'function') verificarConquistas();
                }
            }
            atualizarVisorPomodoro();
        } else {
            clearInterval(pomodoroTimer);
            rodando = false;
            modoEstudo = !modoEstudo; 
            tempoRestante = 0;
            calcularMultiplicador();
            // Abre a janela flutuante no lugar do alert do navegador!
            mostrarModalPomodoroTransicao(modoEstudo ? 'estudo' : 'descanso');
        }
    }, 1000);
}

function pausarPomodoro() { 
    clearInterval(pomodoroTimer); 
    rodando = false; 
    document.getElementById('estadoPomodoro').textContent = "Em pausa"; 
    calcularMultiplicador();
}

function resetarPomodoro() {
    clearInterval(pomodoroTimer); 
    rodando = false; 
    modoEstudo = true;
    tempoRestante = parseInt(document.getElementById('tempoEstudo').value) * 60;
    tempoTotalSessao = tempoRestante; 
    atualizarVisorPomodoro();
    document.getElementById('estadoPomodoro').textContent = "Aguardando";
    if(document.getElementById('clockHand')) document.getElementById('clockHand').style.transform = `rotate(0deg)`;
    calcularMultiplicador();
}

// JANELA FLUTUANTE DE TRANSIÇÃO DO POMODORO (DESCANSO E ESTUDO)
function mostrarModalPomodoroTransicao(tipo) {
    const modal = document.getElementById('modal-pomodoro-transicao');
    if (!modal) return;
    
    const icone = document.getElementById('transicaoIconCircle');
    const titulo = document.getElementById('transicaoTitulo');
    const subtitulo = document.getElementById('transicaoSubtitulo');
    const badge = document.getElementById('transicaoBadge');
    const btn = document.getElementById('btnContinuarTransicao');
    
    const mult = (usuarioLogado.multiplicador || 1.2).toFixed(1);
    
    if (tipo === 'descanso') {
        if (icone) icone.textContent = '☕';
        if (titulo) titulo.textContent = 'Hora do Descanso!';
        if (subtitulo) subtitulo.textContent = 'Parabéns pelo ciclo de foco concluído! Descanse os olhos, beba água e relaxe por alguns minutos.';
        if (badge) badge.innerHTML = `<span>☕ Multiplicador em descanso: <strong>1.0x</strong> (retornará para 1.2x no foco!)</span>`;
        if (btn) btn.textContent = 'Aproveitar Descanso ☕';
    } else {
        if (icone) icone.textContent = '🎯';
        if (titulo) titulo.textContent = 'Hora de Voltar ao Foco!';
        if (subtitulo) subtitulo.textContent = 'O tempo de descanso acabou! Retome os estudos com foco total para o Provão Paulista.';
        if (badge) badge.innerHTML = `<span>🚀 Ciclo de Estudo Ativado • Multiplicador <strong>${mult}x</strong> turbinando seu aprendizado</span>`;
        if (btn) btn.textContent = 'Continuar Estudando 📚';
    }
    
    modal.classList.remove('hidden');
    tocarSinalPomodoro(tipo);
}

function fecharModalPomodoroTransicao() {
    const modal = document.getElementById('modal-pomodoro-transicao');
    if (modal) modal.classList.add('hidden');
    iniciarPomodoro();
}

// JANELA FLUTUANTE DE AJUDA / SOBRE O MÉTODO POMODORO
function abrirModalPomodoroInfo() {
    const modal = document.getElementById('modal-pomodoro-info');
    if (modal) modal.classList.remove('hidden');
}

function fecharModalPomodoroInfo() {
    const modal = document.getElementById('modal-pomodoro-info');
    if (modal) modal.classList.add('hidden');
}

// SINAL SONORO SUAVE SINTETIZADO (WEB AUDIO API)
function tocarSinalPomodoro(tipo) {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        const freq = (tipo === 'descanso') ? 587.33 : 880;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (e) {}
}

// TORNAR MINI TIMER ARRASTÁVEL PELA TELA
function tornarMiniTimerArrastavel() {
    const mini = document.getElementById('miniTimerWidget');
    if (!mini) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;

    // Restaura posição salva se o usuário já moveu antes
    try {
        const salvo = JSON.parse(localStorage.getItem('miniTimerPos'));
        if (salvo && typeof salvo.left === 'number' && typeof salvo.top === 'number') {
            const maxL = window.innerWidth - (mini.offsetWidth || 180) - 10;
            const maxT = window.innerHeight - (mini.offsetHeight || 80) - 10;
            mini.style.left = `${Math.max(10, Math.min(salvo.left, maxL))}px`;
            mini.style.top = `${Math.max(10, Math.min(salvo.top, maxT))}px`;
            mini.style.right = 'auto';
            mini.style.bottom = 'auto';
        }
    } catch (e) {}

    const onStart = (e) => {
        if (e.target.closest('button')) return; // Permite clicar nos botões normalmente
        
        isDragging = true;
        mini.classList.add('dragging');
        
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
        
        const rect = mini.getBoundingClientRect();
        initialX = rect.left;
        initialY = rect.top;
        
        mini.style.right = 'auto';
        mini.style.bottom = 'auto';
        mini.style.left = `${initialX}px`;
        mini.style.top = `${initialY}px`;
        
        if (e.cancelable) e.preventDefault();
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const clientX = e.type.startsWith('touch') ? e.touches[0].clientX : e.clientX;
        const clientY = e.type.startsWith('touch') ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - startX;
        const dy = clientY - startY;
        
        let newX = initialX + dx;
        let newY = initialY + dy;
        
        const maxLeft = window.innerWidth - (mini.offsetWidth || 180) - 10;
        const maxTop = window.innerHeight - (mini.offsetHeight || 80) - 10;
        
        newX = Math.max(10, Math.min(newX, maxLeft));
        newY = Math.max(10, Math.min(newY, maxTop));
        
        mini.style.left = `${newX}px`;
        mini.style.top = `${newY}px`;
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        mini.classList.remove('dragging');
        try {
            const rect = mini.getBoundingClientRect();
            localStorage.setItem('miniTimerPos', JSON.stringify({ left: rect.left, top: rect.top }));
        } catch (e) {}
    };

    mini.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);

    mini.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
}

// ==========================================
// BANCO DE QUESTÕES PROVÃO PAULISTA (ORGANIZADO POR EDIÇÃO)
// ==========================================
let questoesProfessor = JSON.parse(localStorage.getItem('bd_simulados')) || [];

// // BANCO OFICIAL — Questões contextualizadas no modelo VUNESP / Provão Paulista (SEDUC-SP)
const bancoQuestoes = {
    '1º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia o trecho de 'Os Lusíadas' (Canto IV): 'Ó glória de mandar, ó vã cobiça / Desta vaidade a quem chamamos Fama! / Ó fraudulento gosto, que se atiça / C'uma aura popular, que honra se chama!'. A fala do 'Velho do Restelo' no momento da partida das naus portuguesas expressa:",
            opcoes: [
                "A glorificação incondicional da expansão marítima e a busca por riquezas nas Índias.",
                "A crítica severa à ambição desmedida da nobreza e aos custos humanos e sociais das navegações.",
                "O entusiasmo do povo humilde com a promessa de glória e terras no além-mar.",
                "A celebração religiosa da catequese sobre os povos do continente africano."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Classicismo e Epopeia Camoniana"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma aula prática de química sobre segurança laboratorial, um professor explica que o ácido sulfúrico (H₂SO₄) é um ácido diprótico forte muito utilizado na indústria de fertilizantes. Ao reagir completamente com hidróxido de sódio (NaOH), a equação química balanceada que representa essa neutralização é:",
            opcoes: [
                "H₂SO₄ + NaOH → NaSO₄ + H₂O",
                "H₂SO₄ + 2 NaOH → Na₂SO₄ + 2 H₂O",
                "2 H₂SO₄ + NaOH → Na₂SO₄ + H₂O",
                "H₂SO₄ + NaOH → Na₂SO₄ + H₂"
            ],
            correta: 1,
            tema: "Química: Funções Inorgânicas e Reações de Neutralização"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um veículo de transporte escolar trafega em uma avenida retilínea de São Paulo a 72 km/h (20 m/s). Ao avistar a faixa de pedestres, o motorista aciona os freios, imprimindo uma desaceleração constante de magnitude 4 m/s². A distância percorrida pelo veículo até parar completamente é de:",
            opcoes: [
                "25 metros",
                "50 metros",
                "80 metros",
                "100 metros"
            ],
            correta: 1,
            tema: "Física: Movimento Retilíneo Uniformemente Variado (Equação de Torricelli)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um agricultor paulista deseja cercar um canteiro retangular de hortaliças com 120 metros de tela. Sabendo que o comprimento do canteiro é o triplo da sua largura, a área total cultivada desse canteiro retangular corresponde a:",
            opcoes: [
                "450 m²",
                "675 m²",
                "900 m²",
                "1.350 m²"
            ],
            correta: 1,
            tema: "Matemática: Equações de 1º Grau e Geometria Plana"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Durante uma expedição pela Serra do Mar, estudantes observaram que as briófitas (musgos) crescem apenas em locais úmidos e sombreados, apresentando pequeno porte (poucos centímetros). Essa limitação de tamanho e dependência da água decorre diretamente:",
            opcoes: [
                "Da ausência de clorofila e incapacidade de realizar fotossíntese completa.",
                "Da ausência de vasos condutores de seiva (xilema e floema) e fecundação dependente de água.",
                "Da produção exclusiva de sementes desprovidas de frutos protetores.",
                "Da presença de raízes pivotantes profundas que retêm pouca umidade superficial."
            ],
            correta: 1,
            tema: "Biologia: Reino Plantae / Briófitas e Evolução Vegetal"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) 'A introdução das máquinas a vapor e dos teares mecânicos na Inglaterra da segunda metade do século XVIII transformou radicalmente a organização do trabalho humano.' Entre as consequências sociais imediatas da 1ª Revolução Industrial, destaca-se:",
            opcoes: [
                "A valorização salarial do artesão tradicional e redução das jornadas fabris.",
                "A separação definitiva entre o trabalhador e os meios de produção, com longas jornadas e urbanização acelerada.",
                "A universalização dos direitos trabalhistas e a erradicação do trabalho infantil.",
                "A descentralização das cidades fabris e o fortalecimento da produção agrícola de subsistência."
            ],
            correta: 1,
            tema: "História: 1ª Revolução Industrial e Transformações Sociais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O relevo do estado de São Paulo é caracterizado pelo Planalto Atlântico, pela Depressão Periférica e pelo Planalto Ocidental Paulista. A Depressão Periférica Paulista se destaca economicamente e geograficamente por:",
            opcoes: [
                "Apresentar as maiores altitudes do estado, abrigando formações de campos de altitude.",
                "Situar-se entre o Planalto Atlântico e as Cuestas Basálticas, com relevo suave propício à cana-de-açúcar e ferrovias.",
                "Ser formada exclusivamente por planícies litorâneas sujeitas a transgressões marinhas periódicas.",
                "Constituir uma zona desértica com solos rasos e ausência de bacias hidrográficas expressivas."
            ],
            correta: 1,
            tema: "Geografia: Geomorfologia e Ocupação do Espaço Paulista"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na Grécia Antiga, o filósofo Sócrates utilizava um método de diálogo composto por duas etapas: a ironia e a maiêutica. O objetivo central da maiêutica socrática era:",
            opcoes: [
                "Transmitir verdades absolutas prontas elaboradas pelos governantes atenienses.",
                "Ajudar o interlocutor a 'dar à luz' às suas próprias ideias e ao autoconhecimento racional.",
                "Vencer debates políticos na ágora por meio do uso da retórica sofística e falácias.",
                "Provar que os sentidos humanos são infalíveis na apreensão da realidade exterior."
            ],
            correta: 1,
            tema: "Filosofia: O Método Socrático e a Busca pela Verdade"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the short message: 'Climate change is no longer a future threat; it is an urgent crisis reshaping ecosystems across the globe.' The modal sentence 'Governments must implement strict carbon regulations' expresses an idea of:",
            opcoes: [
                "Possibility or doubt about what could occur.",
                "Obligation and strong necessity in taking action.",
                "Permission granted by environmental agencies.",
                "Ability developed through past technological innovation."
            ],
            correta: 1,
            tema: "Língua Inglesa: Modal Verbs (Must / Obligation) e Leitura Temática"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Émile Durkheim postulava que os 'fatos sociais' possuem três características essenciais que condicionam o comportamento dos indivíduos. São elas:",
            opcoes: [
                "Subjetividade, flexibilidade e transitoriedade.",
                "Exterioridade, coercitividade e generalidade.",
                "Racionalidade econômica, voluntariedade e individualidade.",
                "Biológica, hereditariedade e determinismo geográfico."
            ],
            correta: 1,
            tema: "Sociologia: Teoria Funcionalista e Fato Social em Durkheim"
        }
    ],
    '1º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia a estrofe de Gregório de Matos (Barroco Baiano): 'Nasce o Sol, e não dura mais que um dia, / Depois da Luz se segue a noite escura, / Em tristes sombras morre a formosura, / Em contínuas tristezas a alegria.'. A temática central e a figura de linguagem predominante nos versos são, respectivamente:",
            opcoes: [
                "A celebração da eternidade das paixões humanas e a metáfora.",
                "A efemeridade do tempo e da vida (carpe diem / transitoriedade) e a antítese.",
                "A exaltação patriótica da natureza brasileira e o hipérbato.",
                "A sátira aos governantes de Salvador e o eufemismo."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Barroco Brasileiro / Gregório de Matos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em um laboratório de análises, um técnico investiga a densidade de amostras metálicas puras. Uma barra de alumínio de massa 135 g ocupa um volume de 50 cm³. Sabendo que a densidade é a razão entre massa e volume, a densidade dessa barra em g/cm³ e em kg/m³ é, respectivamente:",
            opcoes: [
                "2,7 g/cm³ e 2.700 kg/m³",
                "0,37 g/cm³ e 370 kg/m³",
                "2,7 g/cm³ e 270 kg/m³",
                "6,75 g/cm³ e 6.750 kg/m³"
            ],
            correta: 0,
            tema: "Química / Física: Propriedades Gerais da Matéria e Conversão de Unidades"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Segundo a 1ª Lei de Newton (Princípio da Inércia), um corpo em repouso tende a permanecer em repouso e um corpo em movimento retilíneo uniforme tende a permanecer nesse estado a menos que:",
            opcoes: [
                "A gravidade atue perpendicularmente ao vetor de velocidade.",
                "Uma força resultante não nula atue sobre ele, alterando seu estado mecânico.",
                "Ele perca calor para o meio ambiente circundante.",
                "Sua velocidade atinja o limiar da velocidade da luz no vácuo."
            ],
            correta: 1,
            tema: "Física: Mecânica Clássica e Leis de Newton"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Os números de casos atendidos em uma unidade de saúde paulista seguiram uma Progressão Aritmética (PA) ao longo de cinco dias: 12, 19, 26, 33, 40. A soma total de atendimentos realizados nessa unidade durante esses cinco dias foi de:",
            opcoes: [
                "115 atendimentos",
                "130 atendimentos",
                "145 atendimentos",
                "160 atendimentos"
            ],
            correta: 1,
            tema: "Matemática: Progressão Aritmética (Soma dos Termos de uma PA)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em ervilhas-de-cheiro (Pisum sativum), o alelo para sementes amarelas (V) é dominante sobre o alelo para sementes verdes (v). Do cruzamento entre duas plantas heterozigotas (Vv × Vv), a proporção fenotípica esperada na descendência é de:",
            opcoes: [
                "100% de plantas com sementes amarelas.",
                "75% sementes amarelas e 25% sementes verdes (proporção 3:1).",
                "50% sementes amarelas e 50% sementes verdes (proporção 1:1).",
                "25% sementes amarelas e 75% sementes verdes."
            ],
            correta: 1,
            tema: "Biologia: 1ª Lei de Mendel e Probabilidade Genética"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) 'O Tratado de Tordesilhas, assinado em 1494 entre Portugal e Espanha, dividiu o mundo ultramarino a partir de um meridiano a 370 léguas a oeste de Cabo Verde.' No contexto da colonização do Brasil, as capitanias hereditárias implementadas pela Coroa portuguesa em 1534 objetivavam:",
            opcoes: [
                "Permitir a posse da terra aos povos originários tupi-guarani sob supervisão régia.",
                "Povoar e defender a costa brasileira contra invasões estrangeiras transferindo os custos à iniciativa privada.",
                "Estabelecer de imediato a mineração de ouro e pedras preciosas no interior da colônia.",
                "Declarar a emancipação política das províncias ultramarinas perante a Coroa britânica."
            ],
            correta: 1,
            tema: "História: Brasil Colônia / Capitanias Hereditárias e Economia Açucareira"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) As estações do ano ocorrem em ritmos opostos nos hemisférios Norte e Sul. A causa científica fundamental dessa alternância climática ao longo do ano é:",
            opcoes: [
                "A variação na distância entre a Terra e o Sol ao longo da órbita elíptica (afélio e periélio).",
                "A inclinação do eixo de rotação da Terra (aproximadamente 23,5°) combinada com o movimento de translação.",
                "A rotação diária da Terra associada às variações dos ventos alísios tropicais.",
                "A atração gravitacional combinada da Lua e dos planetas vizinhos sobre a atmosfera."
            ],
            correta: 1,
            tema: "Geografia: Movimentos da Terra e Climatologia Geral"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo iluminista Jean-Jacques Rousseau, em sua obra 'Do Contrato Social' (1762), argumenta que o fundamento da autoridade política legítima reside na:",
            opcoes: [
                "Tradição monárquica do direito divino dos reis.",
                "Vontade geral do povo soberano, mediante um pacto social que garanta a liberdade civil.",
                "Submissão incondicional do cidadão ao poder absolutista do soberano Leviatã.",
                "Propriedade privada irrestrita regulada exclusivamente pelo livre mercado."
            ],
            correta: 1,
            tema: "Filosofia: Filosofia Política Moderna / Contratualismo de Rousseau"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) In scientific texts, the passive voice is frequently used to emphasize the process rather than the agent. Identify the sentence written in the correct Passive Voice form:",
            opcoes: [
                "The researchers collected fifty water samples yesterday.",
                "Fifty water samples were collected by the researchers yesterday.",
                "Fifty water samples have collect by the researchers yesterday.",
                "The researchers was collected fifty water samples yesterday."
            ],
            correta: 1,
            tema: "Língua Inglesa: Voz Passiva (Passive Voice) em Textos Científicos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na análise sociológica de Max Weber, o conceito de 'ação social' distingue-se de um mero comportamento reflexo porque a ação social é:",
            opcoes: [
                "Praticada unicamente por indivíduos isolados em ambiente doméstico.",
                "Dotada de sentido subjetivo orientado pela conduta e pelas expectativas de outros indivíduos.",
                "Imposta compulsoriamente pelas instituições jurídicas do Estado Moderno.",
                "Determinada de modo automático pelas condições materiais de produção da infraestrutura."
            ],
            correta: 1,
            tema: "Sociologia: Ação Social e Tipos Puros em Max Weber"
        }
    ],
    '2º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Em 'O Cortiço' (1890), Aluísio Azevedo constrói uma narrativa naturalista onde o comportamento das personagens é determinado pelo meio, pela raça e pelo momento histórico (determinismo taineano). A transformação do português Jerônimo, que abandona seus antigos hábitos e família para viver com a mulata Rita Baiana, ilustra:",
            opcoes: [
                "O triunfo da moral burguesa sobre os instintos primários dos habitantes do cortiço.",
                "A influência irresistível do meio tropical e da sensualidade sobre a conduta moral do indivíduo.",
                "A exaltação do romantismo idealizado onde o amor supera todas as barreiras sociais.",
                "A denúncia do trabalho assalariado como única causa da decadência psicológica do proletariado."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Naturalismo Brasileiro / Determinismo"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Os hidrocarbonetos constituem a principal matéria-prima fóssil para combustíveis e plásticos. O composto orgânico de fórmula estrutural CH₃–CH₂–CH=CH₂ pertence à função hidrocarboneto e possui a seguinte nomenclatura oficial (IUPAC):",
            opcoes: [
                "Butano",
                "But-1-eno",
                "But-2-ino",
                "Ciclobutano"
            ],
            correta: 1,
            tema: "Química Orgânica: Hidrocarbonetos Alcenos e Nomenclatura IUPAC"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma residência no interior de SP, um chuveiro elétrico de potência 5.500 W (5,5 kW) é utilizado diariamente durante 30 minutos (0,5 h). Ao final de um mês de 30 dias, a energia elétrica consumida exclusivamente por esse chuveiro, em quilowatts-hora (kWh), é de:",
            opcoes: [
                "27,5 kWh",
                "82,5 kWh",
                "165,0 kWh",
                "275,0 kWh"
            ],
            correta: 1,
            tema: "Física: Eletrodinâmica / Potência e Consumo de Energia Elétrica"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A escala Richter quantifica a magnitude sísmica por meio de uma função logarítmica da forma M = ⅔ · log₁₀(E / E₀). Se uma medição resulta no cálculo de log₁₀(x) = 3, o valor real da variável x corresponde a:",
            opcoes: [
                "30",
                "100",
                "1.000",
                "10.000"
            ],
            correta: 2,
            tema: "Matemática: Propriedades dos Logaritmos e Funções Exponenciais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de magnificação trófica (bioacumulação) ocorre ao longo das cadeias alimentares quando poluentes não biodegradáveis (como pesticidas organoclorados ou mercúrio) são ingeridos. Os organismos mais prejudicados e que concentram a maior taxa tóxica no topo da cadeia são os:",
            opcoes: [
                "Produtores primários (fitoplâncton e algas)",
                "Consumidores primários (herbívoros)",
                "Consumidores quaternários ou predadores de topo",
                "Decompositores bacterianos exclusivamente"
            ],
            correta: 2,
            tema: "Biologia: Ecologia / Cadeias Alimentares e Bioacumulação"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Proclamação da República no Brasil, ocorrida em 15 de novembro de 1889, resultou da convergência de interesses entre diferentes setores descontentes com o Império. Dentre esses setores, destacaram-se:",
            opcoes: [
                "A Igreja Católica ultramontana e os escravizados recém-libertos pela Lei Áurea.",
                "A cafeicultura paulista (oeste paulista) defensora do federalismo e o Exército positivista.",
                "A aristocracia açucareira nordestina e a Coroa britânica interessada no monopólio têxtil.",
                "Os sindicatos operários anarquistas e os imigrantes italianos fabris."
            ],
            correta: 1,
            tema: "História: Crise do Império e Proclamação da República"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O fenômeno oceânico-atmosférico denominado 'El Niño' caracteriza-se pelo aquecimento anômalo das águas superficiais do Oceano Pacífico Equatorial. No Brasil, os efeitos climáticos típicos desse fenômeno incluem:",
            opcoes: [
                "Secas históricas na Região Sul e chuvas torrenciais generalizadas no semiárido nordestino.",
                "Aumento expressivo das chuvas e inundações na Região Sul e estiagem severa no semiárido setentrional e leste da Amazônia.",
                "Queda abrupta de temperatura com nevascas no Sudeste e umidade extrema no Centro-Oeste.",
                "Estabilização térmica total em todas as regiões brasileiras sem desvios de pluviosidade."
            ],
            correta: 1,
            tema: "Geografia: Dinâmica Climática Global e Impactos do El Niño no Brasil"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Para Karl Marx, a produção na sociedade capitalista fundamenta-se na extração de 'mais-valia', que pode ser conceituada como:",
            opcoes: [
                "O imposto cobrado pelo Estado burguês para financiar obras públicas de infraestrutura.",
                "A diferença entre o valor total gerado pelo trabalho do operário e o salário pago a ele pela sua força de trabalho.",
                "O lucro obtido exclusivamente através de transações especulativas na bolsa de valores.",
                "A remuneração justa e proporcional ao esforço individual de cada trabalhador na linha de montagem."
            ],
            correta: 1,
            tema: "Sociologia: Teoria Marxista / Mais-Valia e Luta de Classes"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Consider the sentence: 'By the time the rescue team arrived at the isolated village, the floodwaters ___ already damaged dozens of houses.'. The verb form that correctly completes the sentence is:",
            opcoes: [
                "have",
                "had",
                "were",
                "will have"
            ],
            correta: 1,
            tema: "Língua Inglesa: Past Perfect Tense e Relações de Anterioridade Temporal"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em uma função quadrática da forma f(x) = ax² + bx + c com a ≠ 0, a coordenada x do vértice (ponto de máximo ou mínimo da parábola) é calculada por xv = -b / (2a). Para a função f(x) = x² - 6x + 8, o ponto vértice e o valor mínimo são, respectivamente:",
            opcoes: [
                "Vértice em x = 3 com valor mínimo f(3) = -1",
                "Vértice em x = -3 com valor mínimo f(-3) = 35",
                "Vértice em x = 6 com valor mínimo f(6) = 8",
                "Vértice em x = 2 com valor mínimo f(2) = 0"
            ],
            correta: 0,
            tema: "Matemática: Funções Polinomiais do 2º Grau e Vértice da Parábola"
        }
    ],
    '2º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Leia o trecho de 'Os Sertões' (1902), de Euclides da Cunha: 'O sertanejo é, antes de tudo, um forte. Não tem o raquitismo exaustivo dos mestiços neurastênicos do litoral...'. A obra, inserida no Pré-Modernismo brasileiro, caracteriza-se pela:",
            opcoes: [
                "Exaltação ingênua e ufanista da vida na corte do Rio de Janeiro da Belle Époque.",
                "Denúncia do massacre militar em Canudos combinada a uma rigorosa análise científica (geográfica, antropológica e histórica) do sertão nordestino.",
                "Criação de versos parnasianos de métrica perfeita sem qualquer engajamento social.",
                "Ficção romanesca centrada nas lendas do folclore amazônico e heróis mitológicos."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Pré-Modernismo / Euclides da Cunha"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A isomeria espacial óptica manifesta-se em moléculas que possuem pelo menos um carbono assimétrico ou quiral (carbono ligado a quatro grupos ligantes distintos). Qual dos compostos abaixo apresenta isomeria óptica?",
            opcoes: [
                "Etanol (CH₃–CH₂–OH)",
                "Ácido lático / 2-hidroxipropanoico (CH₃–CH(OH)–COOH)",
                "Metano (CH₄)",
                "Propan-2-ol (CH₃–CH(OH)–CH₃)"
            ],
            correta: 1,
            tema: "Química Orgânica: Isomeria Espacial Óptica e Carbono Quiral"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A 2ª Lei da Termodinâmica estabelece limitações fundamentais às transformações de energia. De acordo com essa lei física:",
            opcoes: [
                "É possível construir uma máquina térmica que transforme integralmente calor em trabalho mecânico em um ciclo contínuo.",
                "O calor flui espontaneamente de um corpo frio para um corpo quente sem a realização de trabalho externo.",
                "A entropia total de um sistema termodinamicamente isolado tende sempre a aumentar ou permanecer constante com o tempo.",
                "A energia mecânica total do universo diminui a cada transformação química."
            ],
            correta: 2,
            tema: "Física: Termodinâmica / 2ª Lei e Conceito de Entropia"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma rampa de acessibilidade foi projetada com ângulo de inclinação de 30° em relação ao piso horizontal. Se a rampa atinge uma altura vertical de 1,5 metro no ponto mais alto, o comprimento linear dessa rampa é de (Dado: sen(30°) = 0,5):",
            opcoes: [
                "2,0 metros",
                "3,0 metros",
                "4,5 metros",
                "6,0 metros"
            ],
            correta: 1,
            tema: "Matemática: Trigonometria no Triângulo Retângulo"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O Sistema Nervoso Central humano (SNC) é protegido por ossos e por três membranas conjuntivas conhecidas como meninges (dura-máter, aracnoide e pia-máter). Os órgãos que formam anatomica e funcionalmente o SNC são:",
            opcoes: [
                "Nervos cranianos e gânglios simpáticos",
                "Encéfalo (cérebro, cerebelo e tronco encefálico) e Medula Espinhal",
                "Coração, vasos sanguíneos e pulmões",
                "Rins, ureteres e glândulas suprarrenais"
            ],
            correta: 1,
            tema: "Biologia: Anatomia e Fisiologia do Sistema Nervoso Humano"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A 'Era Vargas' (1930-1945) introduziu profundas transformações na estrutura política e econômica brasileira. Entre as medidas mais marcantes do primeiro governo Getúlio Vargas, destacam-se:",
            opcoes: [
                "A privatização imediata da indústria pesada e o fim do protecionismo cambial.",
                "A consolidação da legislação trabalhista (CLT em 1943) e a industrialização de base (CSN e Vale do Rio Doce).",
                "A adoção do sistema parlamentarista republicano e o fechamento de todas as ferrovias.",
                "A descentralização administrativa total com ampla autonomia armada para os estados da federação."
            ],
            correta: 1,
            tema: "História: Era Vargas / Trabalhismo e Industrialização de Base"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Teoria da Tectônica de Placas explica a ocorrência de sismos, vulcanismos e a formação de cadeias orogenéticas (montanhas). A Cordilheira dos Andes na América do Sul resulta da colisão entre quais placas tectônicas?",
            opcoes: [
                "Placa de Nazca (oceânica) e Placa Sul-Americana (continental), configurando uma zona de subducção e convergência.",
                "Placa Africana e Placa Norte-Americana em limite divergente oceânico.",
                "Placa do Pacífico e Placa Euroasiática em limite transformante lateral.",
                "Placa da Antártida e Placa do Caribe em zona de rifteamento continental."
            ],
            correta: 0,
            tema: "Geografia: Geologia Estrutural e Tectônica de Placas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O sociólogo polonês Zygmunt Bauman formulou a metáfora da 'Modernidade Líquida' para caracterizar a sociedade contemporânea. De acordo com Bauman, as relações humanas na atualidade são marcadas por:",
            opcoes: [
                "Vínculos comunitários indissolúveis, sólidos e permanentes de geração em geração.",
                "Fragilidade, individualismo exacerbado, efemeridade dos laços afetivos e consumo instantâneo.",
                "Retorno aos preceitos religiosos e dogmáticos da Idade Média feudal.",
                "Certezas inabaláveis sobre o futuro e estabilidade profissional vitalícia."
            ],
            correta: 1,
            tema: "Sociologia: Zygmunt Bauman e a Modernidade Líquida"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the sentence: 'If solar panels were cheaper, more families ___ them on their rooftops.'. The correct verb form to complete this Second Conditional structure is:",
            opcoes: [
                "will install",
                "would install",
                "installed",
                "had installed"
            ],
            correta: 1,
            tema: "Língua Inglesa: Second Conditional (Hipóteses no Presente/Futuro)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Um investidor aplicou um capital de R$ 5.000,00 sob regime de juros simples a uma taxa de 2% ao mês durante 6 meses. O valor total dos juros obtidos (J = C · i · t) e o montante final resgatado são:",
            opcoes: [
                "Juros de R$ 600,00 e Montante de R$ 5.600,00",
                "Juros de R$ 300,00 e Montante de R$ 5.300,00",
                "Juros de R$ 1.200,00 e Montante de R$ 6.200,00",
                "Juros de R$ 500,00 e Montante de R$ 5.500,00"
            ],
            correta: 0,
            tema: "Matemática Financeira: Juros Simples e Montante"
        }
    ],
    '3º Ano - 2023': [
        {
            pergunta: "(Provão Paulista / VUNESP) Na década de 1950, o Concretismo (liderado pelos poetas Augusto de Campos, Haroldo de Campos e Décio Pignatari) inaugurou uma vanguarda poética revolucionária no Brasil. A proposta estética do poema concreto caracteriza-se fundamentalmente por:",
            opcoes: [
                "Narrativas épicas em versos decassílabos sobre a colonização do sertão.",
                "Exploração do espaço gráfico visual da página em branco, valorização sonoro-visual e eliminação do verso linear tradicional.",
                "Lirismo intimista e confessional de temática religiosa ultrarromântica.",
                "Preservação rigorosa da sintaxe clássica e de rimas ricas emparelhadas."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Vanguardas Poéticas / Concretismo Brasileiro"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na produção industrial de sabões e sabonetes, óleos ou gorduras vegetais/animais (triglicerídeos) reagem com uma base inorgânica forte (como NaOH) sob aquecimento. Essa reação de hidrólise alcalina de ésteres é denominada:",
            opcoes: [
                "Esterificação de Fischer",
                "Reação de Saponificação",
                "Combustão completa",
                "Craqueamento catalítico"
            ],
            correta: 1,
            tema: "Química Orgânica: Reações de Saponificação e Lipídios"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma partícula com carga elétrica puntiforme q = +3 × 10⁻⁶ C move-se com velocidade v = 2 × 10⁴ m/s perpendicularmente às linhas de indução de um campo magnético uniforme de intensidade B = 0,5 T. A força magnética (Fm = |q| · v · B · sen θ) que atua sobre a partícula é igual a:",
            opcoes: [
                "0,015 N",
                "0,030 N",
                "0,300 N",
                "3,000 N"
            ],
            correta: 1,
            tema: "Física: Eletromagnetismo / Força Magnética de Lorentz sobre Carga Móvel"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) No sistema de juros compostos, o montante M gerado por um capital C aplicado à taxa i por n períodos é dado pela expressão M = C · (1 + i)ⁿ. Se um capital de R$ 10.000,00 for aplicado à taxa de 10% ao ano durante 2 anos, o montante final será de:",
            opcoes: [
                "R$ 11.000,00",
                "R$ 12.000,00",
                "R$ 12.100,00",
                "R$ 13.310,00"
            ],
            correta: 2,
            tema: "Matemática: Matemática Financeira / Juros Compostos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O dogma central da Biologia Molecular descreve o fluxo de informação genética na célula: o DNA é transcrito em RNA mensageiro, que é traduzido em proteínas nos ribossomos. Se uma fita molde de DNA apresenta a sequência de bases 3'-TAC GGC TTA-5', o RNA mensageiro transcrito correspondente terá a sequência:",
            opcoes: [
                "5'-AUG CCG AAU-3'",
                "5'-ATG CCG AAT-3'",
                "5'-UAC GGC UUA-3'",
                "5'-AUC GGC UUA-3'"
            ],
            correta: 0,
            tema: "Biologia: Biologia Molecular / Transcrição Gênica e Código Genético"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Guerra Fria (1947–1991) caracterizou-se pela bipolarização global entre os blocos liderados pelos Estados Unidos (capitalismo) e pela União Soviética (socialismo). Durante esse período, a contenção bélica direta entre as duas superpotências deveu-se principalmente:",
            opcoes: [
                "À intervenção militar pacificadora obrigatória exercida pela Liga das Nações.",
                "À Doutrina da Destruição Mútua Assegurada (MAD) proporcionada pela proliferação de arsenais nucleares.",
                "Ao desarmamento atômico voluntário promovido em conjunto pelos dois países em 1950.",
                "À dependência financeira mútua em um comércio internacional totalmente desregulamentado."
            ],
            correta: 1,
            tema: "História: Guerra Fria / Geopolítica Bipolar e Corrida Armamentista"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A chamada 'República Oligárquica' ou da 'Espada e Café com Leite' (1894–1930) no Brasil foi sustentada pela chamada 'Política dos Governadores', articulada pelo presidente Campos Sales. Esse arranjo político baseava-se em:",
            opcoes: [
                "Eleições com voto secreto, universal e fiscalizadas por tribunais independentes.",
                "Troca mútua de favores entre o governo federal e as oligarquias estaduais dominantes, sustentada pelo coronelismo e voto de cabresto.",
                "Reforma agrária ampla para fortalecer os pequenos colonos imigrantes do interior.",
                "Nacionalização de bancos estrangeiros e concessão de crédito estatal à indústria operária."
            ],
            correta: 1,
            tema: "História: República Velha / Coronelismo e Política dos Governadores"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo alemão Jürgen Habermas propõe em sua teoria social o conceito de 'Agir Comunicativo'. Para Habermas, a emancipação democrática fundamenta-se:",
            opcoes: [
                "Na coerção física e imposição unilateral da lei pela força militar do Estado.",
                "No diálogo racional livre de coações, em que os cidadãos buscam o consenso pelo melhor argumento.",
                "No cálculo utilitarista individual de ganhos e perdas econômicas no mercado financeiro.",
                "Na manipulação da opinião pública pelas grandes corporações de mídia digital."
            ],
            correta: 1,
            tema: "Filosofia: Teoria Crítica / Razão Comunicativa de Habermas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Complete with the correct Third Conditional form: 'If the emergency alarm had sounded in time, the workers ___ the facility without casualties.'.",
            opcoes: [
                "would evacuate",
                "would have evacuated",
                "had evacuated",
                "will have evacuated"
            ],
            correta: 1,
            tema: "Língua Inglesa: Third Conditional (Situações Hipotéticas Irreais no Passado)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Seja o número complexo z = 3 + 4i na sua forma algébrica, onde i é a unidade imaginária (i² = -1). O módulo desse número complexo, dado por |z| = √(a² + b²), é igual a:",
            opcoes: [
                "√7",
                "5",
                "7",
                "25"
            ],
            correta: 1,
            tema: "Matemática: Números Complexos e Plano de Argand-Gauss"
        }
    ],
    '3º Ano - 2024': [
        {
            pergunta: "(Provão Paulista / VUNESP) Em 'Vidas Secas' (1938), Graciliano Ramos constrói a narrativa da família de retirantes sertanejos (Fabiano, Sinhá Vitória, os dois meninos e a cachorra Baleia). O romance modernista da 2ª fase destaca-se estilisticamente pela:",
            opcoes: [
                "Linguagem rebuscada, prolixa e ornamental inspirada no barroco e arcadismo.",
                "Linguagem seca, concisa e despojada de sentimentalismos, espelhando a aridez do sertão e a mudez social das personagens.",
                "Idealização heróica dos retirantes sertanejos como seres imunes à fome e às intempéries climáticas.",
                "Predomínio de versos livres rimados de exaltação ao progresso das cidades litorâneas."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Modernismo Brasileiro (2ª Fase) / Graciliano Ramos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Na estequiometria química, a combustão completa do gás metano ocorre segundo a equação balanceada: CH₄(g) + 2 O₂(g) → CO₂(g) + 2 H₂O(v). Queimando-se completamente 32 g de gás metano (Massa molar do CH₄ = 16 g/mol; CO₂ = 44 g/mol), a massa de dióxido de carbono (CO₂) formada é de:",
            opcoes: [
                "44 g",
                "66 g",
                "88 g",
                "132 g"
            ],
            correta: 2,
            tema: "Química: Cálculos Estequiométricos e Leis Ponderais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Teoria da Relatividade Especial de Albert Einstein (1905) revolucionou os conceitos de espaço e tempo da física clássica. Um de seus postulados fundamentais estabelece que:",
            opcoes: [
                "A velocidade da luz no vácuo é uma constante universal (c ≈ 3 × 10⁸ m/s), independente do movimento da fonte ou do observador.",
                "O tempo transcorre de maneira idêntica e absoluta para todos os referenciais inerciais no universo.",
                "A massa de um corpo diminui e anula-se à medida que sua velocidade se aproxima da velocidade da luz.",
                "A velocidade da luz varia de acordo com a velocidade do observador que se desloca em sua direção."
            ],
            correta: 0,
            tema: "Física: Física Moderna / Postulados da Relatividade Especial de Einstein"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Uma urna contém 5 bolas vermelhas, 3 bolas azuis e 2 bolas amarelas idênticas em tamanho e peso. Retirando-se aleatoriamente uma única bola dessa urna, a probabilidade de que a bola retirada seja azul é de:",
            opcoes: [
                "15%",
                "20%",
                "30%",
                "50%"
            ],
            correta: 2,
            tema: "Matemática: Probabilidade Simples em Espaço Amostral Finito"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A respiração celular aeróbia é o processo pelo qual as células eucariontes extraem energia química da molécula de glicose para produzir ATP. Esse processo bioquímico divide-se em três etapas sucessivas:",
            opcoes: [
                "Fotossíntese, ciclo de Calvin e quimiossíntese.",
                "Glicólise (no citoplasma), Ciclo de Krebs (na matriz mitocondrial) e Cadeia Respiratória / Fosforilação Oxidativa (nas cristas mitocondriais).",
                "Fermentação láctica, fermentação alcoólica e ciclo do nitrogênio.",
                "Fagocitose, pinocitose e transcrição reversa."
            ],
            correta: 1,
            tema: "Biologia: Bioenergética / Respiração Celular Aeróbia e Mitocôndria"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de Redemocratização brasileira, que culminou no término do regime militar (1964–1985), teve como marco de mobilização cívica popular o movimento das 'Diretas Já' (1984). Embora a emenda Dante de Oliveira não tenha atingido os votos necessários para eleições diretas imediatas, o processo resultou em:",
            opcoes: [
                "Permanência indefinida da junta militar no controle do poder executivo até o ano 2000.",
                "Eleição de Tancredo Neves no Colégio Eleitoral em 1985 e promulgação da 'Constituição Cidadã' de 1988.",
                "Dissolução imediata do Congresso Nacional e instauração de nova censura à imprensa.",
                "Proclamação de um regime monárquico parlamentarista por plebiscito popular."
            ],
            correta: 1,
            tema: "História: Fim da Ditadura Militar, Redemocratização e CF de 1988"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O processo de urbanização acelerada vivido pelo Brasil a partir da década de 1950, estimulado pela industrialização concentrada na Região Sudeste, gerou o fenômeno da 'macrometafização' e da periferização urbana. Entre suas consequências socioespaciais diretas, destaca-se:",
            opcoes: [
                "A erradicação dos déficits habitacionais e a distribuição equitativa de saneamento básico em todas as regiões metropolitanas.",
                "A segregação socioespacial com proliferação de favelas, ocupação de áreas de risco e precariedade na mobilidade urbana.",
                "A transferência massiva da população das capitais litorâneas para o interior da floresta amazônica.",
                "O esvaziamento das cidades médias em favor exclusivo das zonas rurais agrícolas."
            ],
            correta: 1,
            tema: "Geografia: Urbanização Brasileira e Segregação Socioespacial"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) O filósofo iluminista Immanuel Kant, ao responder à pergunta 'O que é o Esclarecimento?' (Aufklärung, 1784), defendeu que o esclarecimento consiste na saída do ser humano da sua 'menoridade culpada', sintetizada na célebre máxima latina:",
            opcoes: [
                "'Carpe diem' (Aproveite o dia presente)",
                "'Sapere aude!' (Tenha a coragem de fazer uso do seu próprio entendimento sem tutela de outrem)",
                "'Cogito, ergo sum' (Penso, logo existo)",
                "'Homo homini lupus' (O homem é o lobo do próprio homem)"
            ],
            correta: 1,
            tema: "Filosofia: O Iluminismo Kantiano e a Autonomia da Razão"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Read the excerpt: 'Artificial Intelligence algorithms are increasingly embedded in healthcare, analyzing radiological scans with higher speed than human clinicians. Nonetheless, ethical guidelines must prevent biased outcomes.'. The word 'Nonetheless' conveys an idea of:",
            opcoes: [
                "Conclusion or summary of previous arguments.",
                "Contrast, opposition or concession to the preceding statement.",
                "Addition of similar technical examples.",
                "Cause and consequence between technology and society."
            ],
            correta: 1,
            tema: "Língua Inglesa: Conectivos e Marcadores Discursivos (Contrast / Nonetheless)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em estatística básica, a média aritmética e o desvio padrão são medidas de tendência central e de dispersão, respectivamente. Um aluno obteve notas 6,0; 7,0; 8,0 e 9,0 em quatro avaliações bimestrais. A média aritmética dessas notas é:",
            opcoes: [
                "7,0",
                "7,5",
                "8,0",
                "8,5"
            ],
            correta: 1,
            tema: "Matemática: Estatística Básica / Média Aritmética"
        }
    ],
    'Simulado Geral': [
        {
            pergunta: "(Provão Paulista / VUNESP) No romance machadiano 'Memórias Póstumas de Brás Cubas' (1881), que inaugurou o Realismo no Brasil, o protagonista narra sua trajetória após a morte como um 'defunto autor'. Esse recurso narrativo inovador permitiu a Machado de Assis:",
            opcoes: [
                "Exaltar a nobreza e generosidade desinteressada da elite imperial carioca.",
                "Analisar com ironia implacável a hipocrisia, o parasitismo e as contradições morais da sociedade burguesa de sua época.",
                "Defender fervorosamente os dogmas religiosos do catolicismo tradicional.",
                "Construir um melodrama romântico centrado no sofrimento de amantes proibidos."
            ],
            correta: 1,
            tema: "Língua Portuguesa e Literatura: Realismo Machadiano / Ironia e Crítica Social"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Lei de Hess fundamenta a termoquímica afirmando que a variação de entalpia (ΔH) de uma reação química depende exclusivamente dos estados inicial e final, sendo independente do número de etapas intermediárias. Se uma reação apresenta ΔH < 0, ela é classificada termodinamicamente como:",
            opcoes: [
                "Endotérmica, com absorção líquida de calor do ambiente.",
                "Exotérmica, com liberação líquida de calor para as vizinhanças.",
                "Isotérmica perfeita sem troca energética com o meio.",
                "Adiabática com trabalho nulo."
            ],
            correta: 1,
            tema: "Química: Termoquímica / Lei de Hess e Reações Exotérmicas"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A soma dos ângulos internos de um polígono convexo de n lados é dada pela fórmula S = (n - 2) · 180°. Para um hexágono regular (n = 6), a soma de todos os seus ângulos internos e o valor de cada ângulo interno medem, respectivamente:",
            opcoes: [
                "540° e 90°",
                "720° e 120°",
                "900° e 150°",
                "1080° e 180°"
            ],
            correta: 1,
            tema: "Matemática: Geometria Plana / Polígonos Convexos e Ângulos Internos"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) As ondas eletromagnéticas propagam-se no vácuo com velocidade c ≈ 3 × 10⁸ m/s e classificam-se no espectro conforme suas frequências e comprimentos de onda. A radiação eletromagnética de maior frequência e maior energia por fóton é a:",
            opcoes: [
                "Onda de rádio AM/FM",
                "Luz visível amarela",
                "Radiação infravermelha",
                "Radiação gama (Raios Gama)"
            ],
            correta: 3,
            tema: "Física: Ondulatória e Espectro Eletromagnético"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A intensificação do efeito estufa antropogênico tem elevado a temperatura média dos oceanos e da atmosfera global. Os principais gases de efeito estufa (GEE) emitidos pelas atividades humanas modernas são:",
            opcoes: [
                "Oxigênio molecular (O₂) e nitrogênio gasoso (N₂)",
                "Dióxido de carbono (CO₂) e gás metano (CH₄)",
                "Gás hélio (He) e argônio (Ar)",
                "Monóxido de carbono e ozônio estratosférico puro"
            ],
            correta: 1,
            tema: "Biologia / Geografia: Ecologia e Mudanças Climáticas Globais"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) A Constituição da República Federativa do Brasil de 1988 consagrou em seu Artigo 5º direitos e garantias fundamentais individuais e coletivos. Um princípio basilar nela estabelecido determina que:",
            opcoes: [
                "A tortura e o tratamento desumano são admitidos em casos de grave comoção interna.",
                "Homens e mulheres são iguais em direitos e obrigações nos termos da Constituição, sendo inviolável a liberdade de consciência e de crença.",
                "A censura prévia de espetáculos públicos e periódicos é permitida aos órgãos executivos de segurança.",
                "A pena de morte pode ser aplicada sumariamente a qualquer crime contra o patrimônio privado."
            ],
            correta: 1,
            tema: "História / Sociologia: Cidadania, Direitos Humanos e Constituição de 1988"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) No pensamento sociológico contemporâneo, a 'globalização' manifesta-se pela interconexão econômica, cultural e tecnológica planetária. No entanto, teóricos como Milton Santos apontam que esse processo produz simultaneamente:",
            opcoes: [
                "Igualdade socioeconômica plena entre todas as nações do globo.",
                "Fragmentação territorial, exclusão digital e aprofundamento das assimetrias entre países ricos e periféricos.",
                "Erradicação completa das crises migratórias e das fronteiras nacionais.",
                "Uniformização absoluta dos idiomas e costumes locais sem qualquer resistência identitária."
            ],
            correta: 1,
            tema: "Geografia / Sociologia: Milton Santos e a Globalização Fragmentada"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Complete with the appropriate future expression indicating a planned, decided intention: 'Look at the schedule! The school board ___ announce the new science fair winners tomorrow morning.'.",
            opcoes: [
                "is going to",
                "will to",
                "shall to",
                "goes"
            ],
            correta: 0,
            tema: "Língua Inglesa: Formas de Futuro (Be going to vs. Will)"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) Em termos de extensão territorial contínua, o Brasil possui mais de 8,5 milhões de km², ocupando qual posição entre os maiores países do mundo em área territorial?",
            opcoes: [
                "3º maior país (atrás de Rússia e Canadá)",
                "5º maior país (atrás de Rússia, Canadá, China e EUA)",
                "7º maior país (atrás da Austrália e Índia)",
                "2º maior país do planeta"
            ],
            correta: 1,
            tema: "Geografia: Território Brasileiro, Fronteiras e Posição Global"
        },
        {
            pergunta: "(Provão Paulista / VUNESP) René Descartes, pai do Racionalismo moderno, estabeleceu a dúvida metódica radical como caminho para encontrar uma certeza indubitável. Ao duvidar de tudo, inclusive das ilusões dos sentidos, Descartes formulou o princípio fundamental do conhecimento:",
            opcoes: [
                "'Tabula rasa' (A mente humana é uma folha em branco)",
                "'Cogito, ergo sum' (Penso, logo existo)",
                "'Só sei que nada sei'",
                "'A existência precede a essência'"
            ],
            correta: 1,
            tema: "Filosofia: Racionalismo Cartesiano e Teoria do Conhecimento"
        }
    ]
};

// Questão padrão caso uma edição sem chave específica seja requisitada
const questoesPadrao = [
    {
        pergunta: "(Provão Paulista / VUNESP) Em 'Memórias Póstumas de Brás Cubas' (1881), de Machado de Assis, o recurso narrativo inovador do 'defunto autor' possibilitou:",
        opcoes: [
            "A exaltação patriótica e ufanista dos costumes do Segundo Reinado.",
            "Uma análise mordaz, irônica e descompromissada da hipocrisia e mesquinhez humana.",
            "A defesa da fé religiosa dogmática contra o cientificismo moderno.",
            "Um enredo policial clássico de investigação sobre o culpado de sua morte."
        ],
        correta: 1,
        tema: "Língua Portuguesa e Literatura: Realismo Machadiano"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) A neutralização estequiométrica total de ácido clorídrico (HCl) por hidróxido de cálcio (Ca(OH)₂) produz água e o sal inorgânico denominado:",
        opcoes: [
            "Cloreto de Cálcio (CaCl₂)",
            "Carbonato de Cálcio (CaCO₃)",
            "Sulfato de Cálcio (CaSO₄)",
            "Nitrato de Cálcio (Ca(NO₃)₂)"
        ],
        correta: 0,
        tema: "Química: Funções Inorgânicas e Reações de Neutralização"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) Um objeto de massa 2 kg é solto a partir do repouso de uma altura de 20 metros em relação ao solo. Desprezando a resistência do ar e adotando g = 10 m/s², a sua velocidade imediatamente antes de atingir o solo é de:",
        opcoes: [
            "10 m/s",
            "15 m/s",
            "20 m/s",
            "40 m/s"
        ],
        correta: 2,
        tema: "Física: Mecânica / Conservação da Energia Mecânica e Queda Livre"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) Qual é o valor de x que satisfaz a equação exponencial 2^(x + 3) = 64?",
        opcoes: [
            "1",
            "2",
            "3",
            "6"
        ],
        correta: 2,
        tema: "Matemática: Equações Exponenciais"
    },
    {
        pergunta: "(Provão Paulista / VUNESP) O processo celular mitótico que produz duas células-filhas geneticamente idênticas à célula-mãe tem como função primária nos organismos pluricelulares:",
        opcoes: [
            "A produção exclusiva de gametas haploides para reprodução sexuada.",
            "O crescimento tecidual, regeneração e renovação celular.",
            "A introdução contínua de variabilidade genética por crossing-over.",
            "A redução pela metade do número cromossômico original da espécie."
        ],
        correta: 1,
        tema: "Biologia: Citologia e Divisão Celular (Mitose vs. Meiose)"
    },
    ...questoesProfessor
];

let dadosProvaSimulada = [...questoesPadrao];
let simuladoAtivoObjeto = null; // null para simulados oficiais da plataforma
let indiceQuestaoAtual = 0; let acertosProva = 0; let errosProva = []; let tempoInicioQuestao = 0; let respostasUsuario = [];

function iniciarSimulado(nomeOuId) {
    simuladoAtivoObjeto = null;
    let tituloDisplay = '';

    // Verifica se é um simulado criado por professor
    const simuladosProf = obterSimuladosProfessoresLocais();
    const simuladoProf = simuladosProf.find(s => String(s.id) === String(nomeOuId));

    if (simuladoProf) {
        simuladoAtivoObjeto = simuladoProf;
        dadosProvaSimulada = (simuladoProf.questoes && simuladoProf.questoes.length > 0)
            ? simuladoProf.questoes
            : [simuladoProf]; // compatibilidade com modelo antigo
        tituloDisplay = `${simuladoProf.nome || 'Simulado do Professor'} (${simuladoProf.serie || 'Geral'})`;
    } else {
        // Simulado oficial da plataforma
        const questoesDaProva = bancoQuestoes[nomeOuId];
        if (questoesDaProva) {
            dadosProvaSimulada = [...questoesDaProva];
        } else {
            dadosProvaSimulada = [...questoesPadrao];
        }
        tituloDisplay = `Provão Paulista — ${nomeOuId}`;
    }

    document.getElementById('lista-provas').classList.add('hidden');
    document.getElementById('area-resultados').classList.add('hidden');
    document.getElementById('area-resolucao').classList.remove('hidden');
    document.getElementById('titulo-prova-atual').textContent = tituloDisplay;
    indiceQuestaoAtual = 0; acertosProva = 0; errosProva = []; respostasUsuario = [];
    carregarQuestaoNoEcra();

    // Notificação passageira no canto informando o início
    mostrarToastCanto(
        "Simulado Iniciado",
        `Prova: ${tituloDisplay}. Boa sorte e administre seu tempo com calma!`,
        "info",
        3500
    );
}

function cancelarSimulado() { 
    document.getElementById('area-resolucao').classList.add('hidden'); 
    document.getElementById('area-resultados').classList.add('hidden'); 
    document.getElementById('lista-provas').classList.remove('hidden'); 
}

function voltarParaListaProvas() {
    cancelarSimulado();
}
window.voltarParaListaProvas = voltarParaListaProvas;

// --- MODAL DE ZOOM / AMPLIAÇÃO DE IMAGENS ---
function abrirModalZoomImagem(src, legenda = '') {
    const modal = document.getElementById('modal-zoom-imagem');
    const img = document.getElementById('imgZoomVisualizacao');
    const leg = document.getElementById('legendaZoomImagem');
    if (!modal || !img) return;
    img.src = src;
    if (leg) leg.textContent = legenda;
    modal.classList.remove('hidden');
}
window.abrirModalZoomImagem = abrirModalZoomImagem;

function fecharModalZoomImagem(e) {
    const modal = document.getElementById('modal-zoom-imagem');
    if (!modal) return;
    if (!e || e.target === modal || (e.target && e.target.classList && e.target.classList.contains('modal-close'))) {
        modal.classList.add('hidden');
    }
}
window.fecharModalZoomImagem = fecharModalZoomImagem;

function carregarQuestaoNoEcra() {
    let questao = dadosProvaSimulada[indiceQuestaoAtual];
    let pontosQuestao = (questao.pontos !== undefined && questao.pontos !== null) ? Number(questao.pontos) : 2;
    let badgePontosHtml = `<span style="display: inline-block; margin-left: 10px; background: rgba(255, 193, 7, 0.18); color: #ffb300; font-size: 13px; font-weight: 700; padding: 2px 8px; border-radius: 6px;">⭐ Vale ${pontosQuestao} ${pontosQuestao === 1 ? 'pt' : 'pts'}</span>`;

    let imagemHtml = '';
    if (questao.imagem) {
        imagemHtml = `
            <div class="questao-img-container">
                <img src="${questao.imagem}" alt="Ilustração da Questão" class="questao-img-display" onclick="abrirModalZoomImagem(this.src, 'Ilustração da Questão #${indiceQuestaoAtual + 1}')" title="Clique ou toque para ampliar a imagem">
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 5px;">🔍 Toque ou clique na foto para ampliar</div>
            </div>
        `;
    }

    document.getElementById('texto-questao').innerHTML = `<strong>${indiceQuestaoAtual + 1}.</strong> ${escapeHtml(questao.pergunta)} ${badgePontosHtml}${imagemHtml}`;
    document.getElementById('progresso-simulado').textContent = `Questão ${indiceQuestaoAtual + 1} de ${dadosProvaSimulada.length}`;
    let opcoesContainer = document.getElementById('opcoes-questao');
    opcoesContainer.innerHTML = '';
    questao.opcoes.forEach((opcao, index) => {
        let btn = document.createElement('button');
        btn.className = 'btn-opcao'; btn.textContent = opcao;
        btn.onclick = () => responderQuestao(index);
        opcoesContainer.appendChild(btn);
    });
    tempoInicioQuestao = Date.now();
}

function responderQuestao(indiceSelecionado) {
    if (((Date.now() - tempoInicioQuestao) / 1000) < 60) {
        mostrarToastCanto(
            "Atenção ao Tempo",
            "Você respondeu em menos de 1 minuto! Na prova real, use o tempo para pensar bem.",
            "warning",
            4500
        );
    }
    respostasUsuario.push(indiceSelecionado);
    if (indiceSelecionado === dadosProvaSimulada[indiceQuestaoAtual].correta) acertosProva++;
    else errosProva.push(dadosProvaSimulada[indiceQuestaoAtual].tema || 'Conhecimento Geral');
    indiceQuestaoAtual++;
    if (indiceQuestaoAtual < dadosProvaSimulada.length) carregarQuestaoNoEcra();
    else finalizarSimulado();
}

function finalizarSimulado() {
    document.getElementById('area-resolucao').classList.add('hidden');
    document.getElementById('area-resultados').classList.remove('hidden');
    
    let multiplicadorAtual = usuarioLogado.multiplicador || 1.0;
    
    // Cálculo de pontuação considerando os pontos de cada questão
    let totalPontosPossiveis = 0;
    let pontosGanhosAcertos = 0;
    dadosProvaSimulada.forEach((q, idx) => {
        let val = (q.pontos !== undefined && q.pontos !== null) ? Number(q.pontos) : 2;
        totalPontosPossiveis += val;
        if (respostasUsuario[idx] === q.correta) {
            pontosGanhosAcertos += val;
        }
    });

    let taxaAcerto = dadosProvaSimulada.length > 0 ? (acertosProva / dadosProvaSimulada.length) : 0;
    let porcentagemAcertos = Math.round(taxaAcerto * 100);

    // BÔNUS PARA 70% OU MAIS DE ACERTOS: CHUVA DE CONFETES E BÔNUS DE PONTOS
    let pontosExtras = 0;
    const containerBonus = document.getElementById('bonusSimuladoContainer');
    if (containerBonus) containerBonus.innerHTML = '';

    if (taxaAcerto >= 0.70) {
        pontosExtras = 2;
        if (containerBonus) {
            containerBonus.innerHTML = `
                <div class="bonus-simulado-banner" style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(0, 123, 255, 0.2)); border: 1px solid #4CAF50; border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 14px; margin-bottom: 20px;">
                    <span style="font-size: 32px;">🎉</span>
                    <div>
                        <div style="font-size: 16px; font-weight: 800; color: #4CAF50;">Parabéns! Desempenho Excepcional (${porcentagemAcertos}% de Acertos)!</div>
                        <div style="font-size: 13.5px; color: var(--text-main);">Você acertou 70% ou mais do simulado (${acertosProva}/${dadosProvaSimulada.length}) e conquistou <strong>+2 PONTOS EXTRAS</strong>!</div>
                    </div>
                </div>
            `;
        }
        dispararConfetes();
        mostrarToastCanto('Excelente Desempenho! 🎉', `Você atingiu ${porcentagemAcertos}% de acertos! Chuva de confetes e bônus de pontos concedidos!`, 'success', 5000);
    }

    let pontosBase = pontosGanhosAcertos * multiplicadorAtual;
    let pontosFinais = parseFloat((pontosBase + pontosExtras).toFixed(1));

    usuarioLogado.pontos += pontosFinais;
    usuarioLogado.pontos = parseFloat(usuarioLogado.pontos.toFixed(1)); 
    usuarioLogado.totalAcertos += acertosProva;
    usuarioLogado.totalQuestoes += dadosProvaSimulada.length;
    usuarioLogado.melhorSimuladoAcertos = Math.max(usuarioLogado.melhorSimuladoAcertos || 0, acertosProva);
    
    atualizarBanco(usuarioLogado);
    if (typeof verificarConquistas === 'function') verificarConquistas();
    
    document.getElementById('pontosDisplay').textContent = `${usuarioLogado.pontos} pts`;
    carregarRank(); 
    atualizarDesempenho(); 

    document.getElementById('res-acertos').textContent = `${acertosProva} (${porcentagemAcertos}%)`;
    document.getElementById('res-erros').textContent = dadosProvaSimulada.length - acertosProva;
    document.getElementById('res-pontos').textContent = pontosExtras > 0 ? `+${pontosFinais} (+2 bônus 70%)` : `+${pontosFinais}`;
    document.getElementById('res-multiplicador').textContent = `(x${multiplicadorAtual.toFixed(1)})`;

    let htmlGabarito = '';
    dadosProvaSimulada.forEach((q, i) => {
        let acertou = respostasUsuario[i] === q.correta;
        let ptQ = (q.pontos !== undefined && q.pontos !== null) ? Number(q.pontos) : 2;
        let imgThumb = q.imagem ? `<div style="margin-top: 8px;"><img src="${q.imagem}" alt="Ilustração da questão" style="max-height: 85px; max-width: 150px; border-radius: 6px; border: 1px solid var(--border-color); object-fit: contain; cursor: pointer;" onclick="abrirModalZoomImagem(this.src, 'Questão #${i + 1}')" title="Clique para ampliar"></div>` : '';
        htmlGabarito += `<div class="gabarito-item" style="border-left: 4px solid ${acertou ? '#4CAF50' : '#F44336'}; margin-bottom: 12px; padding: 12px; background: var(--bg-card); border-radius: 8px;"><strong>Questão ${i + 1}</strong> (${ptQ} pts): ${acertou ? '✅ Acertou' : '❌ Errou'} <br><span style="font-size: 14px;">Sua resposta: ${escapeHtml(q.opcoes[respostasUsuario[i]])}</span><br><span style="font-size: 14px; color: var(--primary-color);">Gabarito Oficial: <strong>${escapeHtml(q.opcoes[q.correta])}</strong></span>${imgThumb}</div>`;
    });
    document.getElementById('lista-gabarito').innerHTML = htmlGabarito;
    
    let listaTemas = document.getElementById('lista-temas-sugeridos');
    listaTemas.innerHTML = '';
    if (errosProva.length === 0) {
        listaTemas.innerHTML = '<li>Parabéns! Nenhuma lacuna detectada. Você gabaritou!</li>';
    } else {
        let temasUnicos = [...new Set(errosProva)];
        temasUnicos.forEach(tema => listaTemas.innerHTML += `<li>🔍 <strong>Estudar:</strong> ${tema}</li>`);
    }
}

// MOTOR DE CONFETES EM TELA CHEIA (SEM BIBLIOTECAS EXTERNAS)
function dispararConfetes() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const particles = [];
    const cores = ['#007bff', '#00d2ff', '#ffc107', '#ff5722', '#4CAF50', '#e040fb', '#ffffff', '#ffd700'];
    const totalParticles = 120;
    
    for (let i = 0; i < totalParticles; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.3) - 50,
            r: Math.random() * 6 + 4,
            color: cores[Math.floor(Math.random() * cores.length)],
            tilt: Math.floor(Math.random() * 10) - 10,
            tiltAngleIncremental: (Math.random() * 0.08) + 0.05,
            tiltAngle: 0,
            vy: Math.random() * 3 + 2.5,
            vx: Math.random() * 3 - 1.5
        });
    }
    
    let animationFrame;
    const startTime = Date.now();
    const duration = 4000; // 4 segundos de celebração
    
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const elapsed = Date.now() - startTime;
        const opacity = Math.max(0, 1 - (elapsed / duration));
        
        particles.forEach(p => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.vy;
            p.x += Math.sin(p.tiltAngle) * 2 + p.vx;
            p.tilt = Math.sin(p.tiltAngle) * 14;
            
            ctx.save();
            ctx.globalAlpha = opacity;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.lineWidth = p.r / 2;
            ctx.moveTo(p.x + p.tilt + p.r, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
            ctx.lineTo(p.x + p.r, p.y + p.tilt + p.r);
            ctx.lineTo(p.x + p.r, p.y);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        
        if (elapsed < duration) {
            animationFrame = requestAnimationFrame(draw);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationFrame);
        }
    }
    
    draw();
}

// ==========================================
// IAs SIMULADAS (OFFLINE) - ESTUDOS E TCC
// ==========================================

// --- IA DE ESTUDOS (Provão) ---
// Chave gerenciada de forma segura:
// 1º Tenta chamar o endpoint /api/gemini seguro no backend (Vercel / servidor local com GEMINI_API_KEY no .env)
// 2º Fallback direto via gemini-config.js (caso esteja rodando estático ou offline)
const GEMINI_API_KEY = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.apiKey) || "";
const GEMINI_MODEL = (window.GEMINI_CONFIG && window.GEMINI_CONFIG.model) || "gemini-flash-lite-latest";

// Função auxiliar: espera N milissegundos
function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Monta o histórico das últimas mensagens trocadas no chat para contexto da IA
function montarHistoricoChatIA(chatContainer, idLoading) {
    if (!chatContainer) return '';
    const msgs = chatContainer.querySelectorAll('.msg');
    const historico = [];
    msgs.forEach(msg => {
        if (idLoading && msg.id === idLoading) return;
        const papel = msg.classList.contains('user') ? 'Aluno' : 'Tutor IA';
        const texto = msg.innerText || msg.textContent || '';
        if (texto.trim()) {
            historico.push(`${papel}: ${texto.trim()}`);
        }
    });
    return historico.slice(-8).join('\n');
}

async function chamarGemini(prompt, tentativas = 3) {
    // 1. Tenta via proxy backend (/api/gemini) se API estiver disponível
    if (window.API && typeof window.API.gemini === 'function') {
        try {
            const res = await window.API.gemini(prompt);
            if (res && res.success && res.text) {
                return {
                    response: { ok: true, status: 200 },
                    data: {
                        candidates: [
                            { content: { parts: [{ text: res.text }] } }
                        ]
                    }
                };
            }
            // Se o backend retornou erro específico da chave ou quota
            if (res && res.error && !res.networkError) {
                return {
                    response: { ok: false, status: res.status || 500 },
                    data: { error: { message: res.error } }
                };
            }
        } catch (backendErr) {
            console.warn('[StudySP] Falha ao consultar /api/gemini, tentando fallback direto:', backendErr);
        }
    }

    // 2. Fallback direto caso o backend esteja offline e haja chave no gemini-config.js
    if (!GEMINI_API_KEY) {
        return {
            response: { ok: false, status: 500 },
            data: { error: { message: 'Configuração da IA não encontrada. Defina GEMINI_API_KEY no painel da Vercel (Environment Variables) ou no arquivo gemini-config.js local.' } }
        };
    }

    for (let i = 0; i < tentativas; i++) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await response.json();

        // Erro de sobrecarga (503) → tenta de novo após espera
        if (data.error && data.error.message && data.error.message.includes("high demand")) {
            if (i < tentativas - 1) {
                await esperar(3000 * (i + 1));
                continue;
            }
        }
        return { response, data };
    }
}

async function enviarMensagemIA() {
    const input = document.getElementById('inputChatIA');
    const msgTexto = input.value.trim();
    const chatMessages = document.getElementById('chatMessagesIA');
    
    if (!msgTexto) return;
    chatMessages.innerHTML += `<div class="msg user">${input.value}</div>`;
    input.value = ''; 
    
    const idLoading = "load-" + Date.now();
    chatMessages.innerHTML += `<div id="${idLoading}" class="msg ia"><i>Pensando...</i></div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const historico = montarHistoricoChatIA(chatMessages, idLoading);
        const prompt = `Você é o AGENTE TUTOR PEDAGÓGICO do StudySP (Especialista no Provão Paulista e Ensino Médio/Técnico de SP).
Sua missão: Guiar o estudante para que ele compreenda os conceitos e aprenda com autonomia, clareza e sem sobrecarga cognitiva.

PERFIL E RESTRIÇÕES DO AGENTE:
- Tom de voz: Didático, encorajador, calmo, paciente e direto ao ponto.
- Linguagem: Português claro, correto e acessível. 
- Formatação: NÃO use emojis exagerados, NÃO use caracteres desnecessários. Use listas numeradas ou tópicos curtos quando houver etapas.
- Limite de extensão: Respostas objetivas de no máximo 5 a 8 linhas, exceto quando o aluno pedir explicitamente uma explicação aprofundada.

MODOS DE OPERAÇÃO:

1. MODO CONCEITUAL / EXPLICATIVO (Quando o aluno pede conceitos, fórmulas, resumos, biografias, fatos históricos ou explicações):
- Explique o núcleo do assunto de forma cristalina em 1 parágrafo ou até 4 tópicos essenciais.
- Relacione o conceito com o padrão cobrado nas provas do Provão Paulista / VUNESP.
- Finalize com 1 pergunta reflexiva leve de fixação (ex.: "Quer ver um exemplo prático desse conceito em uma questão?").
- NUNCA despeje textos enciclopédicos longos.

2. MODO SOCRÁTICO (Quando o aluno traz uma questão de prova, exercício ou pede a alternativa correta):
- REGRA DE OURO: NUNCA forneça a resposta final ou a alternativa correta de imediato.
- Passo 1: Isole os dados e o comando principal da questão.
- Passo 2: Faça uma pergunta direcionada para o aluno identificar a fórmula, regra ou conceito que se aplica.
- Passo 3: Se o aluno errar, aponte onde o raciocínio divergiu sem julgamento e sugira um caminho alternativo.
- Passo 4: Se o aluno insistir pela resposta, demonstre a resolução de um exemplo com números ou contexto diferentes, e peça para ele aplicar o mesmo método na questão dele.

HISTÓRICO DA CONVERSA:
${historico || '(início da conversa)'}

MENSAGEM DO ALUNO: ${msgTexto}

Responda agora estritamente como o Agente Tutor Pedagógico:`;

        if(document.getElementById(idLoading)) document.getElementById(idLoading).innerHTML = '<i>Pensando...</i>';
        const resultado = await chamarGemini(prompt);
        const { response, data } = resultado;

        if (!response.ok || data.error) {
            const msgErro = data.error ? data.error.message : `HTTP ${response.status}`;
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatMessages.innerHTML += `<div class="msg ia">❌ Erro da API Gemini: ${msgErro}</div>`;
            console.error('Erro da API:', data);
            return;
        }

        const resposta = data.candidates[0].content.parts[0].text;
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatMessages.innerHTML += `<div class="msg ia">${resposta.replace(/\n/g, "<br>")}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

    } catch (error) {
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatMessages.innerHTML += `<div class="msg ia">❌ Erro de conexão: ${error.message}. Verifique se está rodando em um servidor local (não pelo arquivo direto).</div>`;
        console.error(error);
    }
}

if(document.getElementById('inputChatIA')){
    document.getElementById('inputChatIA').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') enviarMensagemIA();
    });
}

// ==========================================
// SISTEMA DE METAS & CONQUISTAS (MULTIDISCIPLINAR COM PONTOS POR DIFICULDADE)
// ==========================================
const conquistasConfig = [
    {
        id: 'pomodoro_primeiro',
        nome: 'Primeiro Foco',
        desc: 'Complete 25 minutos de estudo concentrado usando o Pomodoro.',
        categoria: 'Pomodoro',
        icone: '🍅',
        dificuldade: 'Fácil',
        pts: 15,
        progresso: (u) => Math.min(Math.floor(((u.tempoEstudadoSegundos || 0) / (25 * 60)) * 100), 100),
        statusTexto: (u) => `${Math.floor((u.tempoEstudadoSegundos || 0) / 60)}/25 min`,
        checar: (u) => (u.tempoEstudadoSegundos || 0) >= 25 * 60
    },
    {
        id: 'simulado_iniciante',
        nome: 'Primeiro Simulado',
        desc: 'Complete sua primeira bateria de simulado do Provão Paulista.',
        categoria: 'Simulados',
        icone: '📝',
        dificuldade: 'Fácil',
        pts: 15,
        progresso: (u) => Math.min(Math.floor(((u.totalQuestoes || 0) / 10) * 100), 100),
        statusTexto: (u) => `${Math.min(u.totalQuestoes || 0, 10)}/10 questões`,
        checar: (u) => (u.totalQuestoes || 0) >= 10
    },
    {
        id: 'tcc_orientacao',
        nome: 'Projeto Definido',
        desc: 'Defina seu curso e tema de TCC e troque pelo menos 5 mensagens com a IA.',
        categoria: 'TCC',
        icone: '💡',
        dificuldade: 'Fácil',
        pts: 15,
        progresso: (u) => {
            let pts = 0;
            if (u.curso) pts += 25;
            if (u.temaTCC) pts += 25;
            pts += Math.min(((u.mensagensTCC || 0) / 5) * 50, 50);
            return Math.floor(pts);
        },
        statusTexto: (u) => `${u.mensagensTCC || 0}/5 msgs`,
        checar: (u) => (u.mensagensTCC || 0) >= 5 && !!u.curso && !!u.temaTCC
    },
    {
        id: 'ofensiva_3dias',
        nome: 'Hábito de Ferro',
        desc: 'Mantenha 3 dias consecutivos de ofensiva de estudos ativa.',
        categoria: 'Constância',
        icone: '🔥',
        dificuldade: 'Médio',
        pts: 30,
        progresso: (u) => Math.min(Math.floor(((u.sequencia || 0) / 3) * 100), 100),
        statusTexto: (u) => `${u.sequencia || 0}/3 dias`,
        checar: (u) => (u.sequencia || 0) >= 3
    },
    {
        id: 'pomodoro_1hora',
        nome: 'Mestre da Disciplina',
        desc: 'Acumule 60 minutos (1 hora) de estudo concentrado no Pomodoro.',
        categoria: 'Pomodoro',
        icone: '⏳',
        dificuldade: 'Médio',
        pts: 30,
        progresso: (u) => Math.min(Math.floor(((u.tempoEstudadoSegundos || 0) / 3600) * 100), 100),
        statusTexto: (u) => `${Math.floor((u.tempoEstudadoSegundos || 0) / 60)}/60 min`,
        checar: (u) => (u.tempoEstudadoSegundos || 0) >= 3600
    },
    {
        id: 'simulado_ouro',
        nome: 'Nota de Ouro',
        desc: 'Acerte mais de 7 questões em um simulado do Provão Paulista.',
        categoria: 'Simulados',
        icone: '🎯',
        dificuldade: 'Difícil',
        pts: 50,
        progresso: (u) => {
            const melhor = u.melhorSimuladoAcertos || 0;
            return Math.min(Math.floor((melhor / 8) * 100), 100);
        },
        statusTexto: (u) => `${u.melhorSimuladoAcertos || 0}/8 acertos`,
        checar: (u) => (u.melhorSimuladoAcertos || 0) >= 8
    },
    {
        id: 'tcc_avancado',
        nome: 'Pesquisador de Ponta',
        desc: 'Troque 25 mensagens aprofundadas com a IA orientadora de TCC.',
        categoria: 'TCC',
        icone: '🎓',
        dificuldade: 'Difícil',
        pts: 50,
        progresso: (u) => Math.min(Math.floor(((u.mensagensTCC || 0) / 25) * 100), 100),
        statusTexto: (u) => `${u.mensagensTCC || 0}/25 msgs`,
        checar: (u) => (u.mensagensTCC || 0) >= 25
    },
    {
        id: 'pomodoro_maratona',
        nome: 'Maratonista dos Estudos',
        desc: 'Alcance 120 minutos (2 horas) de estudo focado com o Pomodoro.',
        categoria: 'Pomodoro',
        icone: '👑',
        dificuldade: 'Lendário',
        pts: 90,
        progresso: (u) => Math.min(Math.floor(((u.tempoEstudadoSegundos || 0) / 7200) * 100), 100),
        statusTexto: (u) => `${Math.floor((u.tempoEstudadoSegundos || 0) / 60)}/120 min`,
        checar: (u) => (u.tempoEstudadoSegundos || 0) >= 7200
    },
    {
        id: 'ofensiva_lenda',
        nome: 'Lenda da Constância',
        desc: 'Mantenha 7 dias consecutivos de ofensiva sem quebrar o ritmo!',
        categoria: 'Constância',
        icone: '⚡',
        dificuldade: 'Lendário',
        pts: 120,
        progresso: (u) => Math.min(Math.floor(((u.sequencia || 0) / 7) * 100), 100),
        statusTexto: (u) => `${u.sequencia || 0}/7 dias`,
        checar: (u) => (u.sequencia || 0) >= 7
    }
];

// --- IA DE TCC (WORKSTATION ELEGANTE) ---
function tccValorInvalido(valor) {
    if (!valor) return true;
    const limpo = String(valor).trim().toLowerCase();
    return (
        limpo === '' ||
        limpo === 'não definido' ||
        limpo === 'nao definido' ||
        limpo === 'não sei' ||
        limpo === 'nao sei' ||
        limpo === 'indefinido' ||
        limpo === 'projeto em definição' ||
        limpo === 'nenhum'
    );
}

function iniciarChatTCC() {
    if (document.getElementById('msgHojeTCC')) {
        document.getElementById('msgHojeTCC').textContent = usuarioLogado.mensagensTCCHoje || 0;
    }
    const badgeCurso = document.getElementById('tccBadgeCurso');
    const badgeTema = document.getElementById('tccBadgeTema');
    
    if (badgeCurso) {
        badgeCurso.textContent = tccValorInvalido(usuarioLogado.curso) ? 'Não definido' : usuarioLogado.curso;
    }
    if (badgeTema) {
        badgeTema.textContent = tccValorInvalido(usuarioLogado.temaTCC) ? 'Não definido' : usuarioLogado.temaTCC;
    }

    const chatBox = document.getElementById('chatBoxTCC');
    if (!chatBox) return;

    if (chatBox.innerHTML.trim() === '') {
        const cursoDefinido = !tccValorInvalido(usuarioLogado.curso);
        const temaDefinido = !tccValorInvalido(usuarioLogado.temaTCC);

        if (cursoDefinido && temaDefinido) {
            chatBox.innerHTML += `<div class="msg ia">Olá! Sou sua IA orientadora de TCC. Estou pronta para auxiliar com metodologia, normas ABNT, objetivos e escrita para seu TCC em <strong>${escapeHtml(usuarioLogado.curso)}</strong> sobre "<em>${escapeHtml(usuarioLogado.temaTCC)}</em>". O que você gostaria de estruturar hoje?</div>`;
        } else {
            chatBox.innerHTML += `<div class="msg ia">Olá! Sou sua orientadora acadêmica de TCC. Envie sua primeira mensagem, dúvida ou ideia para começarmos!</div>`;
        }
    }
}

function trocarAbaTCC(abaId, btn) {
    document.querySelectorAll('.tcc-nav-tab').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const painelChat = document.getElementById('tccPainelChat');
    const painelEtapas = document.getElementById('tccPainelEtapas');
    const painelProjetos = document.getElementById('tccPainelProjetos');

    if (painelChat) painelChat.classList.add('hidden');
    if (painelEtapas) painelEtapas.classList.add('hidden');
    if (painelProjetos) painelProjetos.classList.add('hidden');

    if (abaId === 'chat' && painelChat) {
        painelChat.classList.remove('hidden');
    } else if (abaId === 'etapas' && painelEtapas) {
        painelEtapas.classList.remove('hidden');
    } else if (abaId === 'projetos' && painelProjetos) {
        painelProjetos.classList.remove('hidden');
    }
}

function aplicarPromptRapidoTCC(texto) {
    // Muda para a aba do chat se estiver em etapas ou projetos
    const tabChatBtn = document.querySelector('.tcc-nav-tab');
    if (tabChatBtn && !tabChatBtn.classList.contains('active')) {
        trocarAbaTCC('chat', tabChatBtn);
    }

    const input = document.getElementById('inputChatTCC');
    if (input) {
        input.value = texto;
        input.focus();
    }
}

function abrirModalTccConfig() {
    const modal = document.getElementById('modal-tcc-config');
    if (!modal) return;
    const inputCurso = document.getElementById('inputTccConfigCurso');
    const inputTema = document.getElementById('inputTccConfigTema');
    if (inputCurso) inputCurso.value = tccValorInvalido(usuarioLogado.curso) ? '' : usuarioLogado.curso;
    if (inputTema) inputTema.value = tccValorInvalido(usuarioLogado.temaTCC) ? '' : usuarioLogado.temaTCC;
    modal.classList.remove('hidden');
}

function fecharModalTccConfig() {
    const modal = document.getElementById('modal-tcc-config');
    if (modal) modal.classList.add('hidden');
}

function salvarConfigTcc() {
    const inputCurso = document.getElementById('inputTccConfigCurso');
    const inputTema = document.getElementById('inputTccConfigTema');
    if (!inputCurso || !inputTema) return;

    const curso = inputCurso.value.trim();
    const tema = inputTema.value.trim();

    if (!curso) {
        mostrarToastCanto('Atenção', 'Por favor, informe seu curso para continuar.', 'warning');
        return;
    }

    usuarioLogado.curso = curso;
    usuarioLogado.temaTCC = tema || 'Projeto em definição';
    usuarioLogado.esperandoDefinicaoTCC = false;
    atualizarBanco(usuarioLogado);

    if (document.getElementById('tccBadgeCurso')) document.getElementById('tccBadgeCurso').textContent = usuarioLogado.curso;
    if (document.getElementById('tccBadgeTema')) document.getElementById('tccBadgeTema').textContent = usuarioLogado.temaTCC;

    const chatBox = document.getElementById('chatBoxTCC');
    if (chatBox) {
        chatBox.innerHTML += `<div class="msg ia">✅ Dados atualizados com sucesso! Anotei que seu curso é <strong>${escapeHtml(usuarioLogado.curso)}</strong> e seu tema foco é "<strong>${escapeHtml(usuarioLogado.temaTCC)}</strong>". O que você gostaria de estruturar agora?</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    fecharModalTccConfig();
    mostrarToastCanto('TCC Configurado', 'Curso e tema atualizados com sucesso!', 'success');
    verificarConquistas();
}

function filtrarIdeiasTCC(area, btn) {
    const botoes = document.querySelectorAll('.tcc-filtro-btn');
    botoes.forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    const cards = document.querySelectorAll('.ideia-card-clean, .ideia-card-moderno');
    cards.forEach(card => {
        const cardArea = card.getAttribute('data-area');
        if (area === 'todos' || cardArea === area) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

async function enviarMensagemTCC() {
    const input = document.getElementById('inputChatTCC');
    const msgTexto = input.value.trim();
    const chatBox = document.getElementById('chatBoxTCC');
    
    if (!msgTexto) return;

    if ((usuarioLogado.mensagensTCCHoje || 0) >= 25) {
        mostrarToastCanto("Limite Atingido", "Você atingiu o limite de 25 mensagens de TCC por hoje. Volte amanhã para continuar!", "warning", 4500);
        return;
    }

    chatBox.innerHTML += `<div class="msg user">${escapeHtml(msgTexto)}</div>`;
    input.value = ''; 
    chatBox.scrollTop = chatBox.scrollHeight;

    const precisaDefinir = tccValorInvalido(usuarioLogado.curso) || tccValorInvalido(usuarioLogado.temaTCC);

    // Se estiver aguardando resposta sobre o curso e projeto:
    if (usuarioLogado.esperandoDefinicaoTCC) {
        const partes = msgTexto.split(/ - | e | e o tema: |;|,/i);
        let novoCurso = msgTexto;
        let novoTema = 'Projeto em definição';
        if (partes.length >= 2 && partes[0].trim() && partes[1].trim()) {
            novoCurso = partes[0].trim();
            novoTema = partes.slice(1).join(' - ').trim();
        }
        usuarioLogado.curso = novoCurso;
        usuarioLogado.temaTCC = novoTema;
        usuarioLogado.esperandoDefinicaoTCC = false;
        atualizarBanco(usuarioLogado);

        if (document.getElementById('tccBadgeCurso')) document.getElementById('tccBadgeCurso').textContent = usuarioLogado.curso;
        if (document.getElementById('tccBadgeTema')) document.getElementById('tccBadgeTema').textContent = usuarioLogado.temaTCC;

        chatBox.innerHTML += `<div class="msg ia">Excelente! Atualizei suas informações lá em cima no painel: seu curso é <strong>${escapeHtml(usuarioLogado.curso)}</strong> e seu projeto é "<strong>${escapeHtml(usuarioLogado.temaTCC)}</strong>". A partir de agora nossas orientações serão totalmente personalizadas. Como posso te orientar hoje?</div>`;
        concluirEnvioTCC();
        return;
    }

    // Se o usuário ainda não definiu curso e projeto: espera a 1ª mensagem e pergunta
    if (precisaDefinir) {
        usuarioLogado.esperandoDefinicaoTCC = true;
        atualizarBanco(usuarioLogado);
        chatBox.innerHTML += `<div class="msg ia">Olá! Para que eu possa te fornecer orientações precisas, normas ABNT e metodologias ideais: <strong>qual é o seu curso e qual é a ideia ou tema do seu projeto de TCC?</strong><br><small style="opacity:0.8;">(Você pode responder aqui ou clicar em '✏️ Editar Tema' no painel acima)</small></div>`;
        concluirEnvioTCC();
        return;
    }

    const idLoading = "loadTCC-" + Date.now();
    chatBox.innerHTML += `<div id="${idLoading}" class="msg ia"><i>Pensando...</i></div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const historico = montarHistoricoChatIA(chatBox, idLoading);
        const prompt = `Você é o AGENTE CO-ORIENTADOR METODOLÓGICO DE TCC do StudySP.
Sua missão: Auxiliar o estudante do ensino técnico/médio a desenvolver rigor científico, delimitação temática e raciocínio investigativo próprio no TCC.

DADOS DO ALUNO:
- Curso: ${usuarioLogado.curso || 'Não especificado'}
- Tema/Ideia do TCC: ${usuarioLogado.temaTCC || 'Em definição'}

DIRETRIZES DE ATUAÇÃO E RESTRIÇÕES ESTRITAS:
1. NUNCA REDIJA PELO ALUNO (Anti-Ghostwriting):
   - É terminantemente proibido escrever parágrafos prontos, introduções, justificativas ou capítulos inteiros para o aluno copiar e colar.
   - Em vez disso, forneça "Estruturas-Guia" (esqueletos) com perguntas reflexivas que o aluno deve responder por escrito.
2. DELIMITAÇÃO E FORMULAÇÃO:
   - Se o tema for amplo demais, ajude o aluno a recortar indicando: Problema central, Hipótese, Relevância Social e Metodologia aplicável.
3. REVISÃO CRÍTICA ESTRUTURADA:
   - Se o aluno enviar um parágrafo que ele mesmo escreveu: analise clareza, coesão, tom acadêmico e normas ABNT. Indique 1 sugestão pontual e devolva para ele reescrever o restante.
4. FONTES E PESQUISA:
   - Nunca invente citações fictícias ou dados não checados. Recomende termos de busca para bases acadêmicas confiáveis (como SciELO, Google Acadêmico e Periódicos CAPES).
5. FORMATO DE RESPOSTA:
   - Estrutura limpa em tópicos práticos, sem rodeios e sem excesso de texto. Limite-se a no máximo 10 a 14 linhas por intervenção para não sobrecarregar o aluno.

HISTÓRICO DA CONVERSA:
${historico || '(início da conversa)'}

MENSAGEM DO ALUNO: ${msgTexto}

Responda agora estritamente como o Agente Co-orientador Metodológico:`;

        if(document.getElementById(idLoading)) document.getElementById(idLoading).innerHTML = '<i>Pensando...</i>';
        const resultado = await chamarGemini(prompt);
        const { response, data } = resultado;

        if (!response.ok || data.error) {
            const msgErro = data.error ? data.error.message : `HTTP ${response.status}`;
            if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
            chatBox.innerHTML += `<div class="msg ia">❌ Erro da API Gemini: ${msgErro}</div>`;
            console.error('Erro da API:', data);
            return;
        }

        const resposta = data.candidates[0].content.parts[0].text;
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatBox.innerHTML += `<div class="msg ia">${resposta.replace(/\n/g, "<br>")}</div>`;
        concluirEnvioTCC();
    } catch (error) {
        if(document.getElementById(idLoading)) document.getElementById(idLoading).remove();
        chatBox.innerHTML += `<div class="msg ia">❌ Erro de conexão: ${error.message}.</div>`;
        console.error(error);
    }
}

function concluirEnvioTCC() {
    const chatBox = document.getElementById('chatBoxTCC');
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    
    usuarioLogado.mensagensTCC = (usuarioLogado.mensagensTCC || 0) + 1;
    usuarioLogado.mensagensTCCHoje = (usuarioLogado.mensagensTCCHoje || 0) + 1;
    if(document.getElementById('msgHojeTCC')) {
        document.getElementById('msgHojeTCC').textContent = usuarioLogado.mensagensTCCHoje;
    }
    
    // Bônus constante ao interagir
    usuarioLogado.pontos += 0.5;
    usuarioLogado.pontos = parseFloat(usuarioLogado.pontos.toFixed(1));
    if (document.getElementById('pontosDisplay')) {
        document.getElementById('pontosDisplay').textContent = `${usuarioLogado.pontos} pts`;
    }
    carregarRank();
    
    atualizarBanco(usuarioLogado);
    verificarConquistas();
}

function verificarConquistas() {
    if (!usuarioLogado.conquistas) usuarioLogado.conquistas = [];
    let desbloqueouNova = false;

    conquistasConfig.forEach(conq => {
        if (!usuarioLogado.conquistas.includes(conq.id) && conq.checar(usuarioLogado)) {
            usuarioLogado.conquistas.push(conq.id);
            usuarioLogado.pontos += conq.pts;
            usuarioLogado.pontos = parseFloat(usuarioLogado.pontos.toFixed(1));
            desbloqueouNova = true;
            
            if (document.getElementById('pontosDisplay')) {
                document.getElementById('pontosDisplay').textContent = `${usuarioLogado.pontos} pts`;
            }

            // Pop-up Toast da Conquista
            if (document.getElementById('toast-nome')) {
                document.getElementById('toast-nome').textContent = `${conq.icone} ${conq.nome}`;
                document.getElementById('toast-pontos').textContent = `+${conq.pts} pts (${conq.dificuldade})`;
                
                const toast = document.getElementById('toast-conquista');
                toast.classList.remove('hidden');
                setTimeout(() => { toast.classList.add('show'); }, 100);
                
                setTimeout(() => { 
                    toast.classList.remove('show');
                    setTimeout(() => { toast.classList.add('hidden'); }, 500);
                }, 4500);
            }
            
            mostrarToastCanto('🏆 Conquista Desbloqueada!', `${conq.nome} (+${conq.pts} pts • ${conq.dificuldade})`, 'success', 5000);
        }
    });

    if (desbloqueouNova) {
        atualizarBanco(usuarioLogado);
        carregarRank();
        if (typeof atualizarDesempenho === 'function') atualizarDesempenho();
    }
    
    renderizarConquistas();
}

function renderizarConquistas() {
    const painel = document.getElementById('lista-conquistas-ui');
    if (!painel) return;
    
    let html = '';
    conquistasConfig.forEach(conq => {
        const pct = conq.progresso(usuarioLogado);
        const desbloqueado = usuarioLogado.conquistas && usuarioLogado.conquistas.includes(conq.id);
        const statusTexto = conq.statusTexto(usuarioLogado);
        
        let difClass = 'badge-facil';
        if (conq.dificuldade === 'Médio') difClass = 'badge-medio';
        else if (conq.dificuldade === 'Difícil') difClass = 'badge-dificil';
        else if (conq.dificuldade === 'Lendário') difClass = 'badge-lendario';

        html += `
            <div class="conquista-card ${desbloqueado ? 'desbloqueada' : ''}">
                <div class="conquista-top-row">
                    <div class="conquista-title-group">
                        <span style="font-size: 18px;">${conq.icone}</span>
                        <span class="conquista-nome">${conq.nome}</span>
                    </div>
                    <div class="conquista-badges">
                        <span class="badge-dif ${difClass}">${conq.dificuldade}</span>
                        <span class="badge-pontos">+${conq.pts} pts</span>
                    </div>
                </div>
                <div class="conquista-desc">${conq.desc}</div>
                <div class="conquista-progress-wrap">
                    <div class="conquista-progress-bg">
                        <div class="conquista-progress-fill" style="width: ${pct}%;"></div>
                    </div>
                    <span class="conquista-pct">${desbloqueado ? '✅ 100%' : `${pct}%`}</span>
                </div>
                <div style="font-size: 11px; color: ${desbloqueado ? '#4CAF50' : 'var(--text-muted)'}; margin-top: 4px; display: flex; justify-content: space-between;">
                    <span>${desbloqueado ? '✨ Conquista concluída!' : statusTexto}</span>
                    <span>${conq.categoria}</span>
                </div>
            </div>
        `;
    });
    painel.innerHTML = html;
}

// ==========================================
// FUNÇÕES DE ADMINISTRAÇÃO (PROFESSOR)
// ==========================================
function perguntarConfirmacao(titulo, mensagem, { textoOk = 'Confirmar', perigo = false } = {}) {
    return new Promise(resolve => {
        const modal = document.getElementById('modal-confirmacao');
        const tituloEl = document.getElementById('confirm-titulo');
        const mensagemEl = document.getElementById('confirm-mensagem');
        const btnOk = document.getElementById('confirm-ok');
        const btnCancelar = document.getElementById('confirm-cancelar');
        if (!modal || !btnOk || !btnCancelar) {
            resolve(window.confirm(mensagem));
            return;
        }

        tituloEl.textContent = titulo;
        mensagemEl.textContent = mensagem;
        btnOk.textContent = textoOk;
        btnOk.classList.toggle('btn-confirm-danger', !!perigo);
        modal.classList.remove('hidden');

        const fechar = (valor) => {
            modal.classList.add('hidden');
            btnOk.onclick = null;
            btnCancelar.onclick = null;
            modal.onclick = null;
            resolve(valor);
        };

        btnOk.onclick = () => fechar(true);
        btnCancelar.onclick = () => fechar(false);
        modal.onclick = (ev) => {
            if (ev.target === modal) fechar(false);
        };
    });
}

// ==========================================
// MÚLTIPLOS CONTEÚDOS DE AULA (VÍDEOS, ARQUIVOS, LINKS)
// ==========================================
let profArquivosLista = []; // [{ nomeArquivo, arquivo, tamanho }]

function adicionarLinhaVideo(valor = '') {
    const container = document.getElementById('containerProfVideos');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'item-dinamico-linha';
    div.innerHTML = `
        <span style="font-size: 14px;">🎬</span>
        <input type="text" class="prof-campo-video" placeholder="Link do YouTube ou ID (ex: https://youtu.be/...)" value="${escapeHtml(valor)}">
        <button type="button" class="btn-del-linha-item" onclick="removerLinhaVideo(this)" title="Remover este vídeo">✕</button>
    `;
    container.appendChild(div);
}
window.adicionarLinhaVideo = adicionarLinhaVideo;

function removerLinhaVideo(btn) {
    const container = document.getElementById('containerProfVideos');
    const linha = btn.closest('.item-dinamico-linha');
    if (linha) linha.remove();
    if (container && container.children.length === 0) {
        adicionarLinhaVideo();
    }
}
window.removerLinhaVideo = removerLinhaVideo;

function adicionarLinhaLink(url = '', texto = '') {
    const container = document.getElementById('containerProfLinks');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'item-dinamico-linha';
    div.innerHTML = `
        <span style="font-size: 14px;">🔗</span>
        <input type="url" class="prof-campo-link-url" placeholder="https://..." value="${escapeHtml(url)}" style="flex: 2;">
        <input type="text" class="prof-campo-link-texto" placeholder="Título opcional (ex: Artigo de Apoio)" value="${escapeHtml(texto)}" style="flex: 1.5; font-size: 12px; border-left: 1px solid var(--border-color); padding-left: 8px;">
        <button type="button" class="btn-del-linha-item" onclick="removerLinhaLink(this)" title="Remover este link">✕</button>
    `;
    container.appendChild(div);
}
window.adicionarLinhaLink = adicionarLinhaLink;

function removerLinhaLink(btn) {
    const container = document.getElementById('containerProfLinks');
    const linha = btn.closest('.item-dinamico-linha');
    if (linha) linha.remove();
    if (container && container.children.length === 0) {
        adicionarLinhaLink();
    }
}
window.removerLinhaLink = removerLinhaLink;

async function lidarSelecaoMultiplosArquivos(event) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    mostrarToastCanto('Anexando arquivos...', `Processando ${files.length} arquivo(s)...`, 'info', 2000);

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
            let base64 = '';
            if (file.type && file.type.startsWith('image/')) {
                base64 = await comprimirImagemBase64(file, 1200, 0.85);
            } else {
                base64 = await new Promise((resolve, reject) => {
                    const r = new FileReader();
                    r.onload = e => resolve(e.target.result);
                    r.onerror = reject;
                    r.readAsDataURL(file);
                });
            }
            
            profArquivosLista.push({
                nomeArquivo: file.name,
                arquivo: base64,
                tamanho: (file.size / 1024).toFixed(1) + ' KB'
            });
        } catch (err) {
            console.error('Erro ao ler arquivo:', err);
        }
    }

    renderizarListaArquivosProf();
    event.target.value = '';
}
window.lidarSelecaoMultiplosArquivos = lidarSelecaoMultiplosArquivos;

function removerArquivoAnexo(idx) {
    profArquivosLista.splice(idx, 1);
    renderizarListaArquivosProf();
}
window.removerArquivoAnexo = removerArquivoAnexo;

function renderizarListaArquivosProf() {
    const container = document.getElementById('listaProfArquivos');
    if (!container) return;
    if (profArquivosLista.length === 0) {
        container.innerHTML = '<span style="font-size: 12px; color: var(--text-muted); font-style: italic;">Nenhum arquivo anexado no momento.</span>';
        return;
    }

    container.innerHTML = profArquivosLista.map((arq, idx) => {
        const ehImg = arq.arquivo.startsWith('data:image/') || String(arq.nomeArquivo).match(/\.(png|jpe?g|webp|gif)$/i);
        const icon = ehImg ? '🖼️' : (String(arq.nomeArquivo).endsWith('.pdf') ? '📄' : '📎');
        return `
            <div class="badge-arquivo-anexo">
                <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    <span>${icon}</span>
                    <strong style="font-size: 12px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(arq.nomeArquivo)}</strong>
                    ${arq.tamanho ? `<span style="font-size: 11px; color: var(--text-muted); opacity: 0.8;">(${arq.tamanho})</span>` : ''}
                </div>
                <button type="button" class="btn-del-linha-item" onclick="removerArquivoAnexo(${idx})" title="Remover anexo">✕</button>
            </div>
        `;
    }).join('');
}

function abrirModalPublicarConteudo() {
    const modal = document.getElementById('modal-publicar-conteudo');
    if (modal) {
        modal.classList.remove('hidden');
        if (!document.getElementById('profEditandoId')?.value) {
            const materiaBtn = document.querySelector('.materia-btn.active');
            const selectMateria = document.getElementById('profMateria');
            if (selectMateria && materiaBtn) selectMateria.value = materiaBtn.innerText;
            
            // Inicializa listas vazias se for novo cadastro
            const containerVids = document.getElementById('containerProfVideos');
            if (containerVids && containerVids.children.length === 0) {
                adicionarLinhaVideo();
            }
            const containerLnks = document.getElementById('containerProfLinks');
            if (containerLnks && containerLnks.children.length === 0) {
                adicionarLinhaLink();
            }
            renderizarListaArquivosProf();
        }
    }
}

function fecharModalPublicarConteudo() {
    const modal = document.getElementById('modal-publicar-conteudo');
    if (modal) modal.classList.add('hidden');
    cancelarEdicaoConteudo();
}

function atualizarTituloPainelProfessor(editando) {
    const titulo = document.getElementById('tituloModalPublicarConteudo') || document.getElementById('tituloPainelProfessor');
    const btnSalvar = document.getElementById('btnSalvarConteudo');
    if (titulo) titulo.textContent = editando ? '✏️ Editar Publicação' : '👨‍🏫 Publicar Nova Aula';
    if (btnSalvar) btnSalvar.textContent = editando ? 'Salvar Alterações' : 'Salvar Conteúdo';
}

function cancelarEdicaoConteudo() {
    const form = document.getElementById('formPublicarConteudo');
    const idCampo = document.getElementById('profEditandoId');
    if (form) form.reset();
    if (idCampo) idCampo.value = '';
    
    profArquivosLista = [];
    const containerVids = document.getElementById('containerProfVideos');
    if (containerVids) {
        containerVids.innerHTML = '';
        adicionarLinhaVideo();
    }
    const containerLnks = document.getElementById('containerProfLinks');
    if (containerLnks) {
        containerLnks.innerHTML = '';
        adicionarLinhaLink();
    }
    renderizarListaArquivosProf();

    atualizarTituloPainelProfessor(false);
    const materiaBtn = document.querySelector('.materia-btn.active');
    const selectMateria = document.getElementById('profMateria');
    if (selectMateria && materiaBtn) selectMateria.value = materiaBtn.innerText;
}

function iniciarEdicaoConteudo(id) {
    const item = obterConteudosLocais().find(c => String(c.id) === String(id));
    if (!item) return;

    document.getElementById('profEditandoId').value = item.id;
    document.getElementById('profMateria').value = item.materia || 'Geral';
    document.getElementById('profTitulo').value = item.titulo || '';
    document.getElementById('profTexto').value = item.texto || '';

    // Carrega vídeos
    const containerVids = document.getElementById('containerProfVideos');
    if (containerVids) {
        containerVids.innerHTML = '';
        const vids = (item.videos && Array.isArray(item.videos)) ? item.videos : (item.video ? [item.video] : []);
        if (vids.length > 0) {
            vids.forEach(v => adicionarLinhaVideo(v));
        } else {
            adicionarLinhaVideo();
        }
    }

    // Carrega links
    const containerLnks = document.getElementById('containerProfLinks');
    if (containerLnks) {
        containerLnks.innerHTML = '';
        const lnks = (item.links && Array.isArray(item.links)) ? item.links : (item.link ? [item.link] : []);
        if (lnks.length > 0) {
            lnks.forEach(l => {
                if (typeof l === 'object') adicionarLinhaLink(l.url || '', l.texto || '');
                else adicionarLinhaLink(l);
            });
        } else {
            adicionarLinhaLink();
        }
    }

    // Carrega arquivos
    profArquivosLista = [];
    if (item.arquivos && Array.isArray(item.arquivos)) {
        profArquivosLista = [...item.arquivos];
    } else if (item.arquivo) {
        profArquivosLista = [{
            nomeArquivo: item.nomeArquivo || 'Arquivo Anexo',
            arquivo: item.arquivo,
            tamanho: ''
        }];
    }
    renderizarListaArquivosProf();

    atualizarTituloPainelProfessor(true);
    abrirModalPublicarConteudo();
}

async function pedirApagarConteudo(id) {
    const confirmado = await perguntarConfirmacao(
        'Apagar publicação?',
        'Tem certeza de que deseja apagar esta matéria? Essa ação não poderá ser desfeita.',
        { textoOk: 'Apagar', perigo: true }
    );
    if (!confirmado) return;

    const restantes = obterConteudosLocais().filter(c => String(c.id) !== String(id));
    salvarConteudosLocais(restantes);

    if (window.API && typeof window.API.excluirConteudo === 'function') {
        window.API.excluirConteudo(id).catch(err => {
            console.warn('[StudySP] Falha ao apagar aula no servidor:', err);
        });
    }

    const materiaBtn = document.querySelector('.materia-btn.active');
    carregarMateria(materiaBtn ? materiaBtn.innerText : 'Português');
    mostrarToastCanto('Publicação apagada', 'O conteúdo foi removido com sucesso.', 'success');
}

async function pedirMoverMateria(id, novaMateria) {
    if (!novaMateria) return;
    const confirmado = await perguntarConfirmacao(
        'Mover publicação?',
        `Tem certeza de que deseja mover esta matéria para ${novaMateria}?`,
        { textoOk: 'Mover' }
    );
    if (!confirmado) {
        const materiaBtn = document.querySelector('.materia-btn.active');
        carregarMateria(materiaBtn ? materiaBtn.innerText : 'Português');
        return;
    }

    const conteudos = obterConteudosLocais();
    const idx = conteudos.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return;

    conteudos[idx].materia = novaMateria;
    conteudos[idx].editado = true;
    conteudos[idx].dataHora = new Date().toLocaleString();
    salvarConteudosLocais(conteudos);
    persistirConteudoServidor(conteudos[idx]);

    const materiaBtn = document.querySelector('.materia-btn.active');
    carregarMateria(materiaBtn ? materiaBtn.innerText : 'Português');
    mostrarToastCanto('Matéria movida', `Publicação movida para ${novaMateria}.`, 'success');
}

function moverConteudo(id, direcao) {
    const materiaBtn = document.querySelector('.materia-btn.active');
    const materiaNome = materiaBtn ? materiaBtn.innerText : 'Português';
    const todos = obterConteudosLocais();
    const daMateria = ordenarConteudos(todos.filter(c => c.materia && c.materia.toLowerCase() === materiaNome.toLowerCase()));
    const pos = daMateria.findIndex(c => String(c.id) === String(id));
    const destino = pos + direcao;
    if (pos === -1 || destino < 0 || destino >= daMateria.length) return;

    const atual = daMateria[pos];
    const vizinho = daMateria[destino];
    const ordemAtual = ordemConteudo(atual);
    atual.ordem = ordemConteudo(vizinho);
    vizinho.ordem = ordemAtual;

    const idxAtual = todos.findIndex(c => String(c.id) === String(atual.id));
    const idxVizinho = todos.findIndex(c => String(c.id) === String(vizinho.id));
    if (idxAtual !== -1) todos[idxAtual] = atual;
    if (idxVizinho !== -1) todos[idxVizinho] = vizinho;

    salvarConteudosLocais(todos);
    persistirConteudoServidor(atual);
    persistirConteudoServidor(vizinho);
    carregarMateria(materiaNome);
}

async function salvarConteudo(e) {
    e.preventDefault();
    const idEditando = document.getElementById('profEditandoId').value;
    const materiaAtiva = document.getElementById('profMateria').value
        || (document.querySelector('.materia-btn.active') ? document.querySelector('.materia-btn.active').innerText : 'Geral');

    if (idEditando) {
        const confirmado = await perguntarConfirmacao(
            'Salvar alterações?',
            'Tem certeza de que deseja salvar as alterações desta publicação?',
            { textoOk: 'Salvar' }
        );
        if (!confirmado) return;
    }

    // Coleta todos os vídeos adicionados
    const videos = [];
    document.querySelectorAll('#containerProfVideos .prof-campo-video').forEach(input => {
        const val = input.value.trim();
        if (val) videos.push(val);
    });

    // Coleta todos os links adicionados
    const links = [];
    document.querySelectorAll('#containerProfLinks .item-dinamico-linha').forEach(row => {
        const urlInput = row.querySelector('.prof-campo-link-url');
        const txtInput = row.querySelector('.prof-campo-link-texto');
        const url = urlInput ? urlInput.value.trim() : '';
        const texto = txtInput ? txtInput.value.trim() : '';
        if (url) {
            links.push(texto ? { url, texto } : url);
        }
    });

    // Lista de arquivos anexados (múltiplos)
    const arquivos = [...profArquivosLista];

    const conteudos = obterConteudosLocais();
    const agora = new Date().toLocaleString();

    if (idEditando) {
        const idx = conteudos.findIndex(c => String(c.id) === String(idEditando));
        if (idx === -1) return;
        const atual = conteudos[idx];
        atual.materia = materiaAtiva;
        atual.titulo = document.getElementById('profTitulo').value.trim();
        atual.texto = document.getElementById('profTexto').value.trim();
        
        // Múltiplos conteúdos
        atual.videos = videos;
        atual.arquivos = arquivos;
        atual.links = links;

        // Retrocompatibilidade com campos legados
        atual.video = videos[0] || '';
        atual.link = links[0] ? (typeof links[0] === 'object' ? links[0].url : links[0]) : '';
        if (arquivos.length > 0) {
            atual.arquivo = arquivos[0].arquivo;
            atual.nomeArquivo = arquivos[0].nomeArquivo;
        }

        atual.dataHora = agora;
        atual.editado = true;
        conteudos[idx] = atual;
        salvarConteudosLocais(conteudos);
        persistirConteudoServidor(atual);
        mostrarToastCanto('Conteúdo atualizado', `Alterações salvas em ${materiaAtiva}.`, 'success');
    } else {
        const novoConteudo = {
            id: Date.now(),
            ordem: Date.now(),
            materia: materiaAtiva,
            titulo: document.getElementById('profTitulo').value.trim(),
            texto: document.getElementById('profTexto').value.trim(),
            
            // Múltiplos conteúdos
            videos: videos,
            arquivos: arquivos,
            links: links,

            // Retrocompatibilidade
            video: videos[0] || '',
            link: links[0] ? (typeof links[0] === 'object' ? links[0].url : links[0]) : '',
            arquivo: arquivos[0] ? arquivos[0].arquivo : null,
            nomeArquivo: arquivos[0] ? arquivos[0].nomeArquivo : null,

            dataHora: agora,
            editado: false,
            profNome: usuarioLogado.nome,
            profFoto: usuarioLogado.foto || null,
            profRM: usuarioLogado.rm || null
        };
        conteudos.push(novoConteudo);
        salvarConteudosLocais(conteudos);
        persistirConteudoServidor(novoConteudo);
        mostrarToastCanto('Conteúdo Publicado', `Conteúdo publicado com sucesso em ${materiaAtiva}!`, 'success');
    }

    cancelarEdicaoConteudo();
    const modal = document.getElementById('modal-publicar-conteudo');
    if (modal) modal.classList.add('hidden');
    carregarMateria(materiaAtiva);
}

// ==========================================
// SIMULADOS CRIADOS PELO PROFESSOR (SIMULADOS COMPLETOS)
// ==========================================
function obterSimuladosProfessoresLocais() {
    try {
        const raw = localStorage.getItem('bd_simulados_professores') || localStorage.getItem('bd_simulados');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            // Normaliza caso haja questões legadas salvas diretamente
            return parsed.map(item => {
                if (item.questoes && Array.isArray(item.questoes)) return item;
                // Converte questão única legada em formato de simulado
                return {
                    id: item.id || Date.now(),
                    nome: item.tema ? `Simulado: ${item.tema}` : 'Simulado Especial',
                    autor: item.autor || 'Professor(a)',
                    serie: item.serie || 'Todas as Séries',
                    dataHora: item.dataHora || 'Recentemente',
                    questoes: [{
                        pergunta: item.pergunta,
                        tema: item.tema || 'Geral',
                        pontos: 2,
                        opcoes: item.opcoes || [],
                        correta: item.correta !== undefined ? item.correta : 0
                    }]
                };
            });
        }
    } catch (e) {
        console.warn('Erro ao ler bd_simulados_professores:', e);
    }
    return [];
}

function salvarSimuladosProfessoresLocais(lista) {
    localStorage.setItem('bd_simulados_professores', JSON.stringify(lista));
    localStorage.setItem('bd_simulados', JSON.stringify(lista));
}

function adicionarBlocoQuestao(dados = null) {
    const container = document.getElementById('containerQuestoesDinamicas');
    if (!container) return;

    const num = container.children.length + 1;
    const bloco = document.createElement('div');
    bloco.className = 'bloco-questao-editor';
    bloco.dataset.index = num;

    const pergunta = dados ? escapeHtml(dados.pergunta || '') : '';
    const tema = dados ? escapeHtml(dados.tema || '') : '';
    const pontos = dados && dados.pontos !== undefined ? dados.pontos : 2;
    const opcoes = (dados && Array.isArray(dados.opcoes)) ? dados.opcoes : ['', '', '', ''];
    const correta = dados && dados.correta !== undefined ? dados.correta : 0;
    const imagem = (dados && dados.imagem) ? dados.imagem : '';

    bloco.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 6px;">
            <span style="font-weight: 700; color: var(--primary-color); font-size: 13.5px;">Questão #${num}</span>
            <div style="display: flex; align-items: center; gap: 10px;">
                <label style="font-size: 12px; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 4px;">
                    ⭐ Pontos:
                    <input type="number" class="prof-q-pontos prof-field" value="${pontos}" min="1" max="10" step="0.5" style="width: 58px; padding: 4px 6px; font-size: 12px; text-align: center;" required>
                </label>
                <button type="button" onclick="removerBlocoQuestao(this)" style="background: rgba(244, 67, 54, 0.12); border: 1px solid #f44336; color: #f44336; border-radius: 6px; padding: 3px 8px; font-size: 11px; cursor: pointer;">✕ Remover</button>
            </div>
        </div>
        <textarea class="prof-field prof-q-pergunta" rows="2" placeholder="Enunciado da questão..." required style="width:100%; font-size: 13px;">${pergunta}</textarea>
        
        <!-- Seção de Foto/Ilustração da Questão -->
        <div class="questao-imagem-section">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                <label style="font-size: 12px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 6px; margin: 0;">
                    🖼️ Foto / Ilustração da Questão (Opcional)
                </label>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <label class="btn" style="padding: 4px 10px; font-size: 11.5px; background: rgba(0, 123, 255, 0.15); border: 1px solid var(--primary-color); color: var(--primary-color); border-radius: 6px; cursor: pointer; font-weight: 600; margin: 0; display: inline-flex; align-items: center; gap: 4px;">
                        📷 Inserir Foto
                        <input type="file" class="prof-q-img-file" accept="image/*" onchange="lidarUploadImagemQuestao(event, this)" style="display: none;">
                    </label>
                    <button type="button" class="btn-del-q-img" onclick="removerImagemQuestao(this)" style="display: ${imagem ? 'inline-flex' : 'none'}; background: rgba(244, 67, 54, 0.12); border: 1px solid #f44336; color: #f44336; border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer;">✕ Remover Foto</button>
                </div>
            </div>
            <input type="hidden" class="prof-q-img-data" value="${imagem}">
            <div class="prof-q-img-preview-container" style="display: ${imagem ? 'flex' : 'none'};">
                <img src="${imagem}" class="prof-q-img-preview" alt="Prévia da imagem da questão" onclick="abrirModalZoomImagem(this.src, 'Prévia da Ilustração da Questão')" title="Toque para ampliar">
                <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">
                    <span style="color: #4CAF50; font-weight: 700;">✓ Foto vinculada à questão</span><br>
                    Esta ilustração aparecerá na resolução e no gabarito do simulado.
                </div>
            </div>
        </div>

        <input type="text" class="prof-field prof-q-tema" placeholder="Tema Específico (ex: Matemática: Geometria Espacial)" value="${tema}" required style="width:100%; font-size: 12.5px;">
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" class="prof-field prof-q-alt0" placeholder="Alternativa A" value="${escapeHtml(opcoes[0] || '')}" required style="font-size: 12.5px;">
            <input type="text" class="prof-field prof-q-alt1" placeholder="Alternativa B" value="${escapeHtml(opcoes[1] || '')}" required style="font-size: 12.5px;">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <input type="text" class="prof-field prof-q-alt2" placeholder="Alternativa C" value="${escapeHtml(opcoes[2] || '')}" required style="font-size: 12.5px;">
            <input type="text" class="prof-field prof-q-alt3" placeholder="Alternativa D" value="${escapeHtml(opcoes[3] || '')}" required style="font-size: 12.5px;">
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
            <label style="font-size: 12px; font-weight: 700; color: var(--text-main);">Gabarito Correto:</label>
            <select class="prof-field prof-q-correta" style="padding: 4px 10px; font-size: 12px;" required>
                <option value="0" ${correta === 0 ? 'selected' : ''}>Alternativa A</option>
                <option value="1" ${correta === 1 ? 'selected' : ''}>Alternativa B</option>
                <option value="2" ${correta === 2 ? 'selected' : ''}>Alternativa C</option>
                <option value="3" ${correta === 3 ? 'selected' : ''}>Alternativa D</option>
            </select>
        </div>
    `;

    container.appendChild(bloco);
    atualizarContadorQuestoes();
}

async function lidarUploadImagemQuestao(event, inputEl) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const bloco = inputEl.closest('.bloco-questao-editor');
    if (!bloco) return;

    try {
        mostrarToastCanto('Processando Imagem', 'Comprimindo e otimizando imagem da questão...', 'info', 2000);
        // Otimiza para no máximo 1000px mantendo excelente qualidade visual e baixo uso de memória
        const base64Otimizada = await comprimirImagemBase64(file, 1000, 0.82);
        
        const inputData = bloco.querySelector('.prof-q-img-data');
        const previewContainer = bloco.querySelector('.prof-q-img-preview-container');
        const previewImg = bloco.querySelector('.prof-q-img-preview');
        const btnDel = bloco.querySelector('.btn-del-q-img');

        if (inputData) inputData.value = base64Otimizada;
        if (previewImg) previewImg.src = base64Otimizada;
        if (previewContainer) previewContainer.style.display = 'flex';
        if (btnDel) btnDel.style.display = 'inline-flex';

        mostrarToastCanto('Imagem Carregada', 'A ilustração foi vinculada a esta questão com sucesso!', 'success');
    } catch (err) {
        console.error('[StudySP] Erro ao carregar foto da questão:', err);
        mostrarToastCanto('Erro na Imagem', 'Não foi possível carregar a imagem selecionada: ' + err.message, 'error');
    }
}

function removerImagemQuestao(btn) {
    const bloco = btn.closest('.bloco-questao-editor');
    if (!bloco) return;

    const inputData = bloco.querySelector('.prof-q-img-data');
    const previewContainer = bloco.querySelector('.prof-q-img-preview-container');
    const previewImg = bloco.querySelector('.prof-q-img-preview');
    const inputFile = bloco.querySelector('.prof-q-img-file');

    if (inputData) inputData.value = '';
    if (previewImg) previewImg.src = '';
    if (previewContainer) previewContainer.style.display = 'none';
    if (inputFile) inputFile.value = '';
    btn.style.display = 'none';
    mostrarToastCanto('Foto Removida', 'A ilustração da questão foi removida.', 'info');
}

function removerBlocoQuestao(btn) {
    const bloco = btn.closest('.bloco-questao-editor');
    if (bloco) {
        bloco.remove();
        atualizarContadorQuestoes();
    }
}

function atualizarContadorQuestoes() {
    const container = document.getElementById('containerQuestoesDinamicas');
    const badge = document.getElementById('badgeContadorQuestoes');
    if (container && badge) {
        const qtd = container.children.length;
        badge.textContent = `${qtd} ${qtd === 1 ? 'questão' : 'questões'}`;
        // Re-numera os blocos visuais
        Array.from(container.children).forEach((b, idx) => {
            const span = b.querySelector('span');
            if (span) span.textContent = `Questão #${idx + 1}`;
        });
    }
}

async function gerarQuestoesPorQuantidade() {
    const resp = await promptPersonalizado("Quantas questões deseja que este simulado tenha?", "Ex: 5", "5");
    if (!resp) return;
    const qtd = parseInt(resp);
    if (isNaN(qtd) || qtd < 1 || qtd > 50) {
        mostrarToastCanto('Atenção', 'Por favor, informe um número de questões entre 1 e 50.', 'warning');
        return;
    }
    const container = document.getElementById('containerQuestoesDinamicas');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < qtd; i++) {
        adicionarBlocoQuestao();
    }
}

function abrirModalCriarSimulado() {
    const modal = document.getElementById('modal-criar-simulado');
    if (modal) {
        modal.classList.remove('hidden');
        if (!document.getElementById('profSimuladoEditandoId')?.value) {
            cancelarEdicaoSimulado();
        }
    }
}

function fecharModalCriarSimulado() {
    const modal = document.getElementById('modal-criar-simulado');
    if (modal) modal.classList.add('hidden');
    cancelarEdicaoSimulado();
}

function cancelarEdicaoSimulado() {
    const idEl = document.getElementById('profSimuladoEditandoId');
    if (idEl) idEl.value = '';
    const nomeEl = document.getElementById('profSimuladoNome');
    if (nomeEl) nomeEl.value = '';
    const serieEl = document.getElementById('profSimuladoSerie');
    if (serieEl) serieEl.value = '1º Ano';
    const autorEl = document.getElementById('profSimuladoAutor');
    if (autorEl && usuarioLogado) autorEl.value = usuarioLogado.nome || '';
    const container = document.getElementById('containerQuestoesDinamicas');
    if (container) {
        container.innerHTML = '';
        adicionarBlocoQuestao();
    }
    const titulo = document.getElementById('tituloModalSimulado') || document.getElementById('tituloPainelSimulado');
    if (titulo) titulo.textContent = '📝 Criar Novo Simulado Completo';
    const btnSalvar = document.getElementById('btnSalvarSimuladoCompleto');
    if (btnSalvar) btnSalvar.textContent = '💾 Publicar Simulado Completo';
}

function iniciarEdicaoSimulado(id) {
    const simulados = obterSimuladosProfessoresLocais();
    const sim = simulados.find(s => String(s.id) === String(id));
    if (!sim) return;

    document.getElementById('profSimuladoEditandoId').value = sim.id;
    document.getElementById('profSimuladoNome').value = sim.nome || '';
    document.getElementById('profSimuladoSerie').value = sim.serie || '1º Ano';
    document.getElementById('profSimuladoAutor').value = sim.autor || (usuarioLogado ? usuarioLogado.nome : '');
    
    const titulo = document.getElementById('tituloModalSimulado') || document.getElementById('tituloPainelSimulado');
    if (titulo) titulo.textContent = '✏️ Editar Simulado';
    const btnSalvar = document.getElementById('btnSalvarSimuladoCompleto');
    if (btnSalvar) btnSalvar.textContent = '💾 Salvar Alterações no Simulado';

    const container = document.getElementById('containerQuestoesDinamicas');
    container.innerHTML = '';
    if (Array.isArray(sim.questoes) && sim.questoes.length > 0) {
        sim.questoes.forEach(q => adicionarBlocoQuestao(q));
    } else {
        adicionarBlocoQuestao();
    }

    abrirModalCriarSimulado();
}

async function pedirExcluirSimulado(id) {
    const confirmado = await perguntarConfirmacao(
        'Excluir Simulado?',
        'Tem certeza de que deseja excluir este simulado? Os alunos não poderão mais realizá-lo.',
        { textoOk: 'Excluir', perigo: true }
    );
    if (!confirmado) return;

    const restantes = obterSimuladosProfessoresLocais().filter(s => String(s.id) !== String(id));
    salvarSimuladosProfessoresLocais(restantes);

    if (window.API && typeof window.API.excluirSimulado === 'function') {
        window.API.excluirSimulado(id).catch(err => {
            console.warn('[StudySP] Falha ao excluir simulado no servidor:', err);
        });
    }

    renderizarSimuladosProfessoresNaTela();
    mostrarToastCanto('Simulado Excluído', 'O simulado foi removido com sucesso.', 'info');
}

function salvarSimuladoCompleto(e) {
    e.preventDefault();

    const idEditando = document.getElementById('profSimuladoEditandoId').value;
    const nome = document.getElementById('profSimuladoNome').value.trim();
    const serie = document.getElementById('profSimuladoSerie').value;
    const autor = document.getElementById('profSimuladoAutor').value.trim();

    const container = document.getElementById('containerQuestoesDinamicas');
    const blocos = container.querySelectorAll('.bloco-questao-editor');

    if (blocos.length === 0) {
        mostrarToastCanto('Atenção', 'Adicione pelo menos 1 questão ao simulado.', 'warning');
        return;
    }

    const questoes = [];
    let pontuacaoTotal = 0;

    for (let i = 0; i < blocos.length; i++) {
        const b = blocos[i];
        const pergunta = b.querySelector('.prof-q-pergunta').value.trim();
        const tema = b.querySelector('.prof-q-tema').value.trim();
        const pontos = parseFloat(b.querySelector('.prof-q-pontos').value) || 2;
        const alt0 = b.querySelector('.prof-q-alt0').value.trim();
        const alt1 = b.querySelector('.prof-q-alt1').value.trim();
        const alt2 = b.querySelector('.prof-q-alt2').value.trim();
        const alt3 = b.querySelector('.prof-q-alt3').value.trim();
        const correta = parseInt(b.querySelector('.prof-q-correta').value);
        const imagem = b.querySelector('.prof-q-img-data')?.value || null;

        if (!pergunta || !tema || !alt0 || !alt1 || !alt2 || !alt3) {
            mostrarToastCanto('Campos Incompletos', `Preencha todas as alternativas da Questão #${i + 1}.`, 'warning');
            return;
        }

        pontuacaoTotal += pontos;
        questoes.push({
            id: Date.now() + i,
            pergunta,
            tema,
            pontos,
            opcoes: [alt0, alt1, alt2, alt3],
            correta,
            imagem
        });
    }

    const agora = new Date().toLocaleString();
    const simulados = obterSimuladosProfessoresLocais();

    if (idEditando) {
        const idx = simulados.findIndex(s => String(s.id) === String(idEditando));
        if (idx !== -1) {
            simulados[idx].nome = nome;
            simulados[idx].serie = serie;
            simulados[idx].autor = autor;
            simulados[idx].questoes = questoes;
            simulados[idx].pontuacaoTotal = pontuacaoTotal;
            simulados[idx].dataHora = `Editado em ${agora}`;
            simulados[idx].editado = true;
            salvarSimuladosProfessoresLocais(simulados);

            if (window.API && typeof window.API.salvarSimulado === 'function') {
                window.API.salvarSimulado(simulados[idx]).catch(err => {
                    console.warn('[StudySP] Erro ao sincronizar simulado:', err);
                });
            }
            mostrarToastCanto('Simulado Atualizado', 'As alterações foram salvas com sucesso!', 'success');
        }
    } else {
        const novoSimulado = {
            id: Date.now(),
            nome,
            serie,
            autor,
            questoes,
            pontuacaoTotal,
            dataHora: agora,
            editado: false,
            profRM: (usuarioLogado && usuarioLogado.rm) ? usuarioLogado.rm : null
        };
        simulados.push(novoSimulado);
        salvarSimuladosProfessoresLocais(simulados);

        if (window.API && typeof window.API.salvarSimulado === 'function') {
            window.API.salvarSimulado(novoSimulado).catch(err => {
                console.warn('[StudySP] Erro ao salvar simulado no servidor:', err);
            });
        }
        mostrarToastCanto('Simulado Criado!', `Simulado com ${questoes.length} questões publicado com sucesso!`, 'success');
    }

    cancelarEdicaoSimulado();
    renderizarSimuladosProfessoresNaTela();
}

function renderizarSimuladosProfessoresNaTela() {
    const grid = document.getElementById('gridSimuladosProfessores');
    if (!grid) return;

    const simulados = obterSimuladosProfessoresLocais();
    const isProfessor = usuarioLogado && usuarioLogado.perfil === 'Professor';

    if (simulados.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 25px; text-align: center; background: var(--bg-card); border-radius: 12px; border: 1px dashed var(--border-color); color: var(--text-muted);">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">👨‍🏫</span>
                <strong style="color: var(--text-main); font-size: 15px;">Nenhum simulado de professor cadastrado no momento.</strong>
                <p style="font-size: 13px; margin-top: 4px;">${isProfessor ? 'Utilize o painel acima para criar e publicar novos simulados com questões personalizadas!' : 'Assim que os professores publicarem novos simulados, eles aparecerão aqui para você treinar.'}</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = simulados.map(sim => {
        const qtdQuestoes = (sim.questoes && Array.isArray(sim.questoes)) ? sim.questoes.length : 1;
        const totalPontos = (sim.questoes && Array.isArray(sim.questoes))
            ? sim.questoes.reduce((acc, q) => acc + (q.pontos !== undefined ? Number(q.pontos) : 2), 0)
            : (sim.pontuacaoTotal || (qtdQuestoes * 2));
        const serieTexto = sim.serie ? sim.serie.toUpperCase() : 'GERAL';
        const dataPublicacao = sim.dataHora || 'Recentemente';
        const idSeguro = String(sim.id);
        const temImagens = (sim.questoes && Array.isArray(sim.questoes)) ? sim.questoes.some(q => !!q.imagem) : false;
        const badgeImg = temImagens ? `<span class="badge-contem-imagem" title="Este simulado contém questões com fotos e ilustrações">📷 Ilustrado</span>` : '';

        let acoesProf = '';
        if (isProfessor) {
            acoesProf = `
                <div class="prova-prof-acoes" onclick="event.stopPropagation()">
                    <button type="button" class="btn-prof-simulado-acao" onclick="iniciarEdicaoSimulado('${idSeguro}')">✏️ Editar</button>
                    <button type="button" class="btn-prof-simulado-acao btn-del" onclick="pedirExcluirSimulado('${idSeguro}')">🗑️ Excluir</button>
                </div>
            `;
        }

        return `
            <div class="prova-card prova-card-prof" onclick="iniciarSimulado('${idSeguro}')">
                <div class="prova-card-badge" style="background: rgba(255, 152, 0, 0.15); color: #ff9800; border-color: rgba(255, 152, 0, 0.3);">
                    👨‍🏫 ${escapeHtml(sim.autor || 'Professor')}
                </div>
                <div class="prova-card-ano">${escapeHtml(serieTexto)}</div>
                <h3>${escapeHtml(sim.nome || 'Simulado Especial')}</h3>
                
                <div class="prova-prof-meta">
                    <span class="prova-prof-badge-pontos">⭐ ${totalPontos} Pontos Totais</span>
                    <span>📝 ${qtdQuestoes} ${qtdQuestoes === 1 ? 'questão' : 'questões'}</span>
                    ${badgeImg}
                </div>

                <p class="prova-card-desc" style="font-size: 11.5px; color: var(--text-muted); margin-top: 4px;">
                    🕒 Publicado em: <strong>${escapeHtml(dataPublicacao)}</strong>
                </p>

                <span class="btn-iniciar-prova">Iniciar Simulado do Professor →</span>
                ${acoesProf}
            </div>
        `;
    }).join('');
}

// ==========================================
// BANCO DETALHADO DE ESTRUTURA DOS TCCS (18 PROJETOS)
// ==========================================
const tccIdeiasDetalhes = {
    'ds_1': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'João Silva',
        titulo: 'App de Mobilidade Escolar Compartilhada',
        tema: 'Roteirização Inteligente e Carona Solidária para Comunidades Escolares',
        problema: 'Falta de integração e segurança no deslocamento de estudantes de bairros afastados até a escola técnica, resultando em altos índices de atrasos matutinos e evasão escolar no primeiro módulo.',
        objetivo: 'Desenvolver um aplicativo mobile seguro que conecta responsáveis e estudantes de trajetos comuns, possibilitando grupos de caminhada monitorada e caronas solidárias verificadas pela secretaria escolar.',
        metodologia: 'Levantamento de requisitos com 120 pais e alunos, prototipagem navegável no Figma, backend desenvolvido em Node.js com banco PostgreSQL e mapas integrados via Leaflet/OpenStreetMap com criptografia ponta a ponta.',
        resultados: 'Projeto-piloto com 85 famílias ativas no município, reduzindo atrasos em 38% e aumentando a sensação de segurança comunitária para mais de 90% dos usuários cadastrados.'
    },
    'ds_2': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'Maria Fernanda',
        titulo: 'IA para Triagem e Orientação de Currículos de Jovens Aprendizes',
        tema: 'Inteligência Artificial e Processamento de Linguagem Natural na Inclusão Produtiva',
        problema: 'Estudantes do Ensino Médio enfrentam extrema dificuldade para estruturar seus primeiros currículos com palavras-chave e competências adequadas aos sistemas automatizados (ATS) dos processos seletivos.',
        objetivo: 'Construir uma ferramenta web inteligente que avalia currículos enviados em PDF, destaca lacunas formativas e sugere cursos gratuitos alinhados à BNCC e ao perfil das vagas ofertadas no CIEE.',
        metodologia: 'Processamento de texto em Python (spaCy e NLTK), integração com API LLM para feedback personalizado, interface web responsiva em HTML5/CSS3/Vanilla JS e hospedagem em nuvem.',
        resultados: 'Validação com 160 jovens do ensino técnico, alcançando taxa de aprovação para entrevistas 42% superior ao grupo de controle que utilizou modelos de currículo tradicionais.'
    },
    'ds_3': {
        curso: 'Desenvolvimento de Sistemas',
        autor: 'Pedro Santos',
        titulo: 'Sistema Integrado de Gestão de Laboratórios e Equipamentos Escolares',
        tema: 'Sistemas Web para Otimização de Infraestrutura e Recursos Pedagógicos',
        problema: 'Desorganização e frequentes conflitos no agendamento de laboratórios de informática, kits de robótica e projetores, decorrentes de controles feitos em cadernos físicos de papel.',
        objetivo: 'Implementar um sistema web dinâmico de reserva de ambientes com controle de permissões por perfil (gestor, docente e monitor), acompanhamento de manutenções e inventário patrimonial por QR Code.',
        metodologia: 'Arquitetura MVC com PHP 8 e MySQL, autenticação JWT, geração automatizada de etiquetas QR Code para equipamentos e módulo de relatórios de uso em PDF.',
        resultados: 'Implantação na unidade escolar, zerando duplicidades de reserva e reduzindo em 65% o tempo ocioso dos laboratórios de informática.'
    },
    'jur_1': {
        curso: 'Serviços Jurídicos',
        autor: 'Ana Luísa',
        titulo: 'Cartilha Interativa dos Direitos do Consumidor Jovem no E-Commerce',
        tema: 'Educação Jurídica e Proteção do Consumidor nas Compras Digitais',
        problema: 'Aumento expressivo de compras por impulso em redes sociais (TikTok e Instagram) por menores de idade, gerando endividamento precoce e vulnerabilidade a golpes sem compreensão do Código de Defesa do Consumidor.',
        objetivo: 'Produzir uma cartilha jurídica interativa e linguagem acessível detalhando direitos de arrependimento (art. 49 do CDC), prazos para troca de produtos com defeito e identificação de publicidade enganosa.',
        metodologia: 'Pesquisa legislativa no CDC e jurisprudências recentes do TJ-SP sobre golpes via PIX, aplicação de questionário diagnóstico com 200 jovens e desenvolvimento de infográficos visuais.',
        resultados: 'Distribuição digital do guia para mais de 1.400 estudantes, elevando a taxa de acerto em testes sobre direitos básicos do consumidor de 31% para 89%.'
    },
    'jur_2': {
        curso: 'Serviços Jurídicos',
        autor: 'Carlos Almeida',
        titulo: 'Impactos e Conformidade da LGPD no Tratamento de Dados de Menores nas Escolas',
        tema: 'Lei Geral de Proteção de Dados (Lei nº 13.709/2018) na Gestão Escolar',
        problema: 'Escolas armazenam e compartilham rotineiramente fotos de eventos, notas e laudos psicológicos de crianças e adolescentes sem formulários adequados de consentimento específico dos responsáveis legais.',
        objetivo: 'Elaborar um modelo prático de Governança de Privacidade em conformidade com o Artigo 14 da LGPD, fornecendo minutas de termos de consentimento e plano de resposta a incidentes para escolas públicas.',
        metodologia: 'Estudo de caso exploratório em duas unidades de ensino, análise dogmática da lei e consultas a pareceres da Autoridade Nacional de Proteção de Dados (ANPD).',
        resultados: 'Adoção da minuta contratual e da cartilha de boas práticas pela equipe gestora da escola, estabelecendo protocolo seguro de veiculação de imagens pedagógicas.'
    },
    'jur_3': {
        curso: 'Serviços Jurídicos',
        autor: 'Beatriz Costa',
        titulo: 'Guia de Mediação Comunitária e Justiça Restaurativa no Ambiente Escolar',
        tema: 'Meios Adequados de Solução de Conflitos e Prevenção à Violência Escolar',
        problema: 'A aplicação exclusiva de medidas punitivas tradicionais (suspensão e advertência) não tem sido eficaz para resolver desavenças interpessoais e casos de cyberbullying entre estudantes.',
        objetivo: 'Estruturar um roteiro metodológico para implantação de Círculos Restaurativos e formação de comissões de alunos mediadores, respaldado na Lei de Mediação (Lei nº 13.140/2015).',
        metodologia: 'Revisão bibliográfica sobre Justiça Restaurativa, realização de oficinas práticas com dinâmicas de Comunicação Não-Violenta (CNV) e acompanhamento simulado de conflitos típicos da rotina escolar.',
        resultados: 'Redução de 55% nos encaminhamentos de ocorrências disciplinares graves à direção e capacitação de 18 estudantes como mediadores voluntários.'
    },
    'log_1': {
        curso: 'Logística',
        autor: 'Lucas Oliveira',
        titulo: 'Otimização de Rotas no Transporte Escolar Municipal',
        tema: 'Pesquisa Operacional, Roteirização de Frotas e Sustentabilidade',
        problema: 'Rotas desorganizadas de vans e micro-ônibus escolares causavam atrasos sistemáticos na chegada às aulas, aumento abusivo do consumo de diesel e emissão excessiva de poluentes.',
        objetivo: 'Mapear todos os pontos de embarque e aplicar técnicas de roteirização baseadas no Problema do Caixeiro Viajante (TSP) para desenhar itinerários mais curtos e eficientes.',
        metodologia: 'Coleta de dados georreferenciados de 210 estudantes via GPS, modelagem computacional no software QGIS e análise comparativa de quilometragem e consumo médio de combustível.',
        resultados: 'Diminuição de 19% nos custos operacionais de combustível e ganho de 22 minutos diários no tempo médio de permanência dos alunos dentro do veículo.'
    },
    'log_2': {
        curso: 'Logística',
        autor: 'Rafael Souza',
        titulo: 'Gestão Sustentável e Controle PEPS/FIFO no Estoque da Merenda Escolar',
        tema: 'Gestão de Suprimentos Perecíveis e Combate ao Desperdício de Alimentos',
        problema: 'Perdas frequentes de hortifrutigranjeiros e laticínios da alimentação escolar em decorrência de estocagem incorreta e falta de método padronizado de rotação de estoque.',
        objetivo: 'Implantar o método PEPS (Primeiro que Entra, Primeiro que Sai) integrado a uma matriz de curva ABC para priorizar itens de alta sensibilidade e curto prazo de validade.',
        metodologia: 'Diagnóstico in loco nos depósitos de 4 escolas, redesenho do layout das despensas, elaboração de fichas técnicas de controle diário e capacitação prática dos colaboradores.',
        resultados: 'Eliminação de 88% do descarte de alimentos por vencimento e aproveitamento integral das compras provenientes da agricultura familiar sustentável.'
    },
    'log_3': {
        curso: 'Logística',
        autor: 'Juliana Mendes',
        titulo: 'Logística Reversa para Descarte Adequado de E-Waste na Comunidade Escolar',
        tema: 'Logística Reversa, Economia Circular e Destinação de Resíduos Sólidos',
        problema: 'Inexistência de pontos de coleta acessíveis para baterias, celulares antigos e cabos quebrados, levando ao descarte no lixo comum e contaminação do solo por metais pesados.',
        objetivo: 'Desenvolver a modelagem completa de uma cadeia reversa para resíduos eletrônicos, integrando postos de coleta voluntária na escola a cooperativas recicladoras certificadas.',
        metodologia: 'Mapeamento de stakeholders, dimensionamento da capacidade de estocagem temporária, análise de custo-benefício de frete compartilhado e palestras de conscientização ecológica.',
        resultados: 'Coleta de mais de 1.100 kg de componentes eletrônicos em três meses de campanha, com certificação oficial de destinação e reciclagem sustentável.'
    },
    'agro_1': {
        curso: 'Agropecuária',
        autor: 'Marcos Vinícius',
        titulo: 'Horta Hidropônica Automatizada de Baixo Custo para Alimentação Escolar',
        tema: 'Agricultura 4.0, Hidroponia NFT e Eficiência no Uso da Água',
        problema: 'Dificuldade de manter hortaliças frescas durante todo o ano letivo devido a períodos severos de estiagem, solo arenoso e falta de mão de obra para manutenção diária.',
        objetivo: 'Construir um protótipo de cultivo hidropônico NFT (Nutrient Film Technique) com automação simples via microcontrolador para controle de bombeamento e oxigenação da solução nutritiva.',
        metodologia: 'Montagem estrutural em perfis de PVC reaproveitados, calibração de sensores de pH e condutividade elétrica, e monitoramento semanal do desenvolvimento de mudas de alface e rúcula.',
        resultados: 'Produção 30% mais rápida comparada ao canteiro de terra tradicional, com economia hídrica superior a 85% e fornecimento semanal de verduras frescas para o refeitório.'
    },
    'agro_2': {
        curso: 'Agropecuária',
        autor: 'Fernanda Lima',
        titulo: 'Bioinseticidas Caseiros à Base de Nim e Calda Bordalesa em Hortas Urbanas',
        tema: 'Controle Biológico e Manejo Agroecológico de Pragas e Doenças',
        problema: 'Contaminação de alimentos e risco de intoxicação por produtores familiares ao utilizarem agrotóxicos sintéticos de alta toxicidade em hortas periurbanas.',
        objetivo: 'Avaliar a eficiência agronômica do extrato aquoso de folhas de Nim (Azadirachta indica) e da calda bordalesa no combate a pulgões e fungos foliares.',
        metodologia: 'Delineamento em blocos casualizados com 4 tratamentos e 5 repetições em canteiros de couve manteiga e tomateiro, com contagem seriada de insetos antes e após pulverizações.',
        resultados: 'Eficácia de combate a pragas de 84% sem qualquer resíduo tóxico na hortaliça colhida, gerando economia de 70% nos custos de insumos agrícolas.'
    },
    'agro_3': {
        curso: 'Agropecuária',
        autor: 'Thiago Ribeiro',
        titulo: 'Sistema Integrado de Captação Pluvial e Irrigação Localizada por Gravidade',
        tema: 'Manejo e Conservação de Recursos Hídricos na Produção Agropecuária',
        problema: 'Gastos elevados na conta de água e perda de plantios durante períodos de estiagem prolongada nas escolas agrícolas do interior do estado.',
        objetivo: 'Projetar e instalar um sistema de captação de água das calhas de galpões agrícolas com filtragem mecânica em camadas e irrigação por gotejamento acionada pela gravidade.',
        metodologia: 'Cálculo do índice pluviométrico regional, dimensionamento de cisterna de alvenaria impermeabilizada e testes de vazão e uniformidade de gotejadores autocompensantes.',
        resultados: 'Armazenamento de 15.000 litros de água pluvial durante o período chuvoso, mantendo a área experimental 100% autossuficiente em irrigação durante o inverno.'
    },
    'vet_1': {
        curso: 'Veterinária',
        autor: 'Mariana Castro',
        titulo: 'Plataforma Digital de Adoção Responsável com Matchmaking Comportamental',
        tema: 'Bem-Estar Animal, Guarda Responsável e Controle Populacional de Zoonoses',
        problema: 'Altas taxas de abandono e devolução de cães resgatados decorrentes de expectativas irreais dos tutores em relação ao porte, nível de energia e necessidades do animal.',
        objetivo: 'Criar uma aplicação web de triagem e adoção que utiliza questionário comportamental para conectar o perfil do adotante ao cão ou gato mais compatível do canil municipal.',
        metodologia: 'Avaliação etológica dos animais abrigados em parceria com médicos veterinários, desenvolvimento do formulário de triagem e teste piloto com duas ONGs de proteção.',
        resultados: '72 adoções intermediadas em 4 meses, com registro de zero devoluções após 90 dias de acompanhamento pós-adoção.'
    },
    'vet_2': {
        curso: 'Veterinária',
        autor: 'Diego Rocha',
        titulo: 'Manual de Primeiros Socorros para Animais de Estimação: Condutas Pré-Clínicas',
        tema: 'Medicina Veterinária Intensiva e Capacitação Comunitária em Emergências Pets',
        problema: 'Muitos animais vêm a óbito antes do atendimento médico veterinário por ações errôneas dos tutores diante de quadros de engasgo, envenenamento ou atropelamento.',
        objetivo: 'Elaborar um guia técnico e ilustrado com condutas emergenciais baseadas em evidências científicas para estabilização segura de cães e gatos em situações críticas.',
        metodologia: 'Revisão bibliográfica com foco no protocolo RECOVER de ressuscitação cardiorrespiratória, produção de infográficos anatômicos e validação do conteúdo com médicos veterinários intensivistas.',
        resultados: 'Mais de 800 cartilhas impressas e digitais distribuídas no município, com realização de 3 workshops práticos que capacitaram mais de 150 tutores.'
    },
    'vet_3': {
        curso: 'Veterinária',
        autor: 'Letícia Martins',
        titulo: 'Manejo Nutricional e Preventivo da Doença Renal Crônica em Caninos Idosos',
        tema: 'Nutrição Clínica, Nefrologia e Geriatria em Medicina de Pequenos Animais',
        problema: 'A Doença Renal Crônica (DRC) é uma das principais causas de mortalidade em cães idosos, frequentemente diagnosticada em fases tardias sem suporte dietético adequado.',
        objetivo: 'Avaliar os parâmetros nutricionais ideais (fósforo controlado, teor proteico de alto valor biológico e ácidos graxos ômega-3) para desacelerar a progressão da nefropatia geriátrica.',
        metodologia: 'Acompanhamento clínico de prontuários de 25 cães geriátricos em ambulatório-escola, correlacionando o tipo de alimentação com parâmetros séricos de ureia, creatinina e escore corporal.',
        resultados: 'Constatação de retardo de 40% na progressão do estágio clínico em animais que receberam dieta específica rica em ômega-3 e restrição calibrada de fósforo.'
    },
    'adm_1': {
        curso: 'Administração',
        autor: 'Gabriel Nogueira',
        titulo: 'Plano de Negócios e Viabilidade Financeira para Brechó Online Sustentável',
        tema: 'Empreendedorismo, Economia Circular e Análise de Viabilidade Econômica',
        problema: 'O impacto ambiental severo da indústria têxtil (Fast Fashion) aliado à falta de planejamento gerencial e financeiro que leva à mortalidade precoce de novos microbrechós.',
        objetivo: 'Estruturar um Plano de Negócios completo segundo a metodologia SEBRAE, compreendendo plano de marketing, análise de concorrência, estudo operacional e fluxo de caixa projetado.',
        metodologia: 'Pesquisa quantitativa com 250 consumidores da classe C, modelagem Canvas, projeção de Demonstrativo de Resultados (DRE) para 36 meses e cálculo de Ponto de Equilíbrio e TIR.',
        resultados: 'Comprovação da viabilidade financeira com Payback de 10 meses e margem líquida projetada de 24%, permitindo o lançamento real da startup na cidade.'
    },
    'adm_2': {
        curso: 'Administração',
        autor: 'Camila Ferreira',
        titulo: 'Estratégias de Marketing Digital e Tráfego Pago para Micro e Pequenas Empresas',
        tema: 'Marketing Digital de Performance e Transformação Comercial de Negócios Locais',
        problema: 'Comércios familiares de bairro perderam volume de vendas no pós-pandemia por desconhecerem ferramentas de posicionamento online no Google e redes sociais.',
        objetivo: 'Desenvolver e testar um modelo prático de atração e fidelização de clientes locais através do Google Meu Negócio, Meta Ads e atendimento estruturado via WhatsApp Business.',
        metodologia: 'Estudo de caso com três pequenas empresas da região (padaria, pet shop e oficina), estruturação de campanhas geolocalizadas em raio de 3 km e métricas de Custo por Lead (CPL).',
        resultados: 'Aumento médio de 48% nas mensagens de orçamento recebidas e retorno sobre investimento publicitário (ROAS) de 4,5x nos primeiros 60 dias.'
    },
    'adm_3': {
        curso: 'Administração',
        autor: 'Rodrigo Alves',
        titulo: 'Educação Financeira Juvenil: Método 50-30-20 e Investimentos no Tesouro Direto',
        tema: 'Finanças Pessoais, Orçamento Familiar e Educação Econômica na Juventude',
        problema: 'Jovens aprendizes e estagiários frequentemente contraem dívidas no cartão de crédito logo nos primeiros meses de trabalho devido ao desconhecimento de noções elementares de finanças.',
        objetivo: 'Elaborar uma metodologia dinâmica de gestão financeira com foco na regra 50-30-20 e introdução prática a títulos de renda fixa pública (Tesouro Selic) para formação de reserva de emergência.',
        metodologia: 'Aplicação de pesquisa diagnóstica de hábitos financeiros com 190 estudantes da 3ª série do EM, realização de oficinas interativas e fornecimento de planilha orçamentária automatizada.',
        resultados: '91% dos alunos participantes constituíram sua primeira reserva financeira e mais de 35% realizaram seu primeiro aporte em títulos públicos ou CDBs de liquidez diária.'
    }
};

function abrirDetalheTCC(id) {
    const dados = tccIdeiasDetalhes[id];
    if (!dados) return;

    if (document.getElementById('tccModalCursoBadge')) document.getElementById('tccModalCursoBadge').textContent = dados.curso;
    if (document.getElementById('tccModalTitulo')) document.getElementById('tccModalTitulo').textContent = dados.titulo;
    if (document.getElementById('tccModalAutor')) document.getElementById('tccModalAutor').textContent = `Autor(a): ${dados.autor}`;
    if (document.getElementById('tccModalTema')) document.getElementById('tccModalTema').textContent = dados.tema;
    if (document.getElementById('tccModalProblema')) document.getElementById('tccModalProblema').textContent = dados.problema;
    if (document.getElementById('tccModalObjetivo')) document.getElementById('tccModalObjetivo').textContent = dados.objetivo;
    if (document.getElementById('tccModalMetodologia')) document.getElementById('tccModalMetodologia').textContent = dados.metodologia;
    if (document.getElementById('tccModalResultados')) document.getElementById('tccModalResultados').textContent = dados.resultados;

    const modal = document.getElementById('modal-detalhe-tcc');
    if (modal) modal.classList.remove('hidden');
}

function fecharModalDetalheTCC() {
    const modal = document.getElementById('modal-detalhe-tcc');
    if (modal) modal.classList.add('hidden');
}

// Fechamento dos novos modais ao clicar no overlay escuro
window.addEventListener('click', function(e) {
    const modalPerfil = document.getElementById('modal-meu-perfil');
    if (modalPerfil && e.target === modalPerfil) {
        modalPerfil.classList.add('hidden');
    }
    const modalTCC = document.getElementById('modal-detalhe-tcc');
    if (modalTCC && e.target === modalTCC) {
        modalTCC.classList.add('hidden');
    }
    const modalPomodoroInfo = document.getElementById('modal-pomodoro-info');
    if (modalPomodoroInfo && e.target === modalPomodoroInfo) {
        modalPomodoroInfo.classList.add('hidden');
    }
    const modalTccConfig = document.getElementById('modal-tcc-config');
    if (modalTccConfig && e.target === modalTccConfig) {
        modalTccConfig.classList.add('hidden');
    }
    const modalPubConteudo = document.getElementById('modal-publicar-conteudo');
    if (modalPubConteudo && e.target === modalPubConteudo) {
        modalPubConteudo.classList.add('hidden');
    }
    const modalCriarSim = document.getElementById('modal-criar-simulado');
    if (modalCriarSim && e.target === modalCriarSim) {
        modalCriarSim.classList.add('hidden');
    }
});

// ==========================================
// SINCRONIZAÇÃO EM SEGUNDO PLANO COM O SERVIDOR
// ==========================================
async function sincronizarComServidor() {
    if (!usuarioLogado || !usuarioLogado.rm) return;
    try {
        if (window.API && typeof window.API.buscarUsuario === 'function') {
            const remoto = await window.API.buscarUsuario(usuarioLogado.rm);
            if (remoto && remoto.rm) {
                // Preserva a foto se o usuário já tiver localmente e o servidor retornar nulo/vazio
                if (!remoto.foto && usuarioLogado.foto) {
                    remoto.foto = usuarioLogado.foto;
                }
                // Atualiza dados locais com a versão mais recente do banco de dados
                Object.assign(usuarioLogado, remoto);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                if (usuarioLogado.foto) {
                    aplicarFotoPerfilNaInterface(usuarioLogado.foto);
                }
                carregarDadosPerfil();
                carregarRank();
                if (typeof atualizarDesempenho === 'function') atualizarDesempenho();
                if (typeof renderizarConquistas === 'function') renderizarConquistas();
            }
        }
    } catch (err) {
        console.warn('[StudySP] Sincronização inicial com o servidor indisponível:', err);
    }
}

async function carregarQuestoesDoServidor() {
    try {
        if (window.API && typeof window.API.buscarSimulados === 'function') {
            const simuladosServidor = await window.API.buscarSimulados();
            if (Array.isArray(simuladosServidor) && simuladosServidor.length > 0) {
                salvarSimuladosProfessoresLocais(simuladosServidor);
                renderizarSimuladosProfessoresNaTela();
            }
        }
    } catch (err) {
        console.warn('[StudySP] Simulados do servidor indisponíveis, mantendo locais:', err);
    }
}

async function carregarConteudosDoServidorInicial() {
    try {
        if (window.API && typeof window.API.buscarConteudos === 'function') {
            const conteudosServidor = await window.API.buscarConteudos();
            if (Array.isArray(conteudosServidor) && conteudosServidor.length > 0) {
                localStorage.setItem('bd_conteudos', JSON.stringify(conteudosServidor));
            }
        }
    } catch (err) {
        console.warn('[StudySP] Conteúdos do servidor indisponíveis na inicialização:', err);
    }
}

// Inicialização Final (Roda ao carregar a página)
carregarDadosPerfil(); 
carregarRank(); 
calcularMultiplicador(); 
atualizarDesempenho(); 
renderizarConquistas();
tornarMiniTimerArrastavel();
renderizarSimuladosProfessoresNaTela();
if (document.getElementById('containerQuestoesDinamicas') && document.getElementById('containerQuestoesDinamicas').children.length === 0) {
    adicionarBlocoQuestao();
}
sincronizarComServidor();
carregarQuestoesDoServidor();
carregarConteudosDoServidorInicial();