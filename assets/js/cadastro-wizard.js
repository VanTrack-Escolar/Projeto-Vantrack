document.addEventListener('DOMContentLoaded', () => {
    console.log('[Wizard] Inicializando assistente passo a passo...');
    
    // Elementos principais
    const form = document.getElementById('form-cadastro-motorista');
    const sections = document.querySelectorAll('.step-section');
    const indicators = document.querySelectorAll('.step-indicator');
    const lines = document.querySelectorAll('.step-line');
    
    const btnPrev = document.getElementById('btn-wizard-prev');
    const btnNext = document.getElementById('btn-wizard-next');
    const btnSubmit = document.getElementById('btn-wizard-submit');
    
    // Inputs de Escolas
    const escolaInput = document.getElementById('escola_input');
    const btnAddEscola = document.getElementById('btn-add-escola');
    const schoolsContainer = document.getElementById('schools-tags');
    
    // Estado do Wizard
    let currentStep = 1;
    const totalSteps = 5;
    let schoolsList = [];

    // Mascarar inputs do Passo 1
    const cpfInput = document.getElementById('cpf');
    const telInput = document.getElementById('telefone');
    if (cpfInput) cpfInput.addEventListener('input', aplicarMascaraCPF);
    if (telInput) telInput.addEventListener('input', aplicarMascaraTelefone);

    // Mascarar inputs do Passo 2 (CNH Validade)
    const cnhValidadeInput = document.getElementById('cnh_validade');
    if (cnhValidadeInput) {
        cnhValidadeInput.addEventListener('input', (e) => {
            let v = e.target.value.replace(/\D/g, '');
            if (v.length > 8) v = v.substring(0, 8);
            if (v.length > 4) v = v.substring(0, 2) + '/' + v.substring(2, 4) + '/' + v.substring(4);
            else if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
            e.target.value = v;
        });
    }

    // Mascarar inputs do Passo 3 (Placa do veículo)
    const placaInput = document.getElementById('veiculo_placa');
    if (placaInput) {
        placaInput.addEventListener('input', (e) => {
            let v = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            // Formatar no padrão AAA-9999 ou ABC1D23
            if (v.length > 8) v = v.substring(0, 8);
            e.target.value = v;
        });
    }

    // Toggle de senha - cadastro
    document.querySelectorAll('.toggle-senha').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = btn.querySelector('i');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                icon?.classList.toggle('fa-eye');
                icon?.classList.toggle('fa-eye-slash');
            }
        });
    });

    // Controlar dinamicamente as escolas
    if (btnAddEscola && escolaInput) {
        btnAddEscola.addEventListener('click', adicionarEscola);
        escolaInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                adicionarEscola();
            }
        });
    }

    function adicionarEscola() {
        const escolaNome = escolaInput.value.trim();
        if (!escolaNome) return;
        
        if (schoolsList.includes(escolaNome)) {
            mostrarNotificacao('Esta escola já foi adicionada!', 'aviso');
            return;
        }

        schoolsList.push(escolaNome);
        escolaInput.value = '';
        renderizarEscolas();
    }

    function removerEscola(nome) {
        schoolsList = schoolsList.filter(s => s !== nome);
        renderizarEscolas();
    }

    function renderizarEscolas() {
        if (!schoolsContainer) return;
        schoolsContainer.innerHTML = '';
        
        if (schoolsList.length === 0) {
            schoolsContainer.innerHTML = '<span class="no-schools-text">Nenhuma escola adicionada ainda.</span>';
            return;
        }

        schoolsList.forEach(school => {
            const tag = document.createElement('div');
            tag.className = 'school-tag';
            tag.innerHTML = `
                <span>${school}</span>
                <span class="remove-tag" data-name="${school}">&times;</span>
            `;
            
            tag.querySelector('.remove-tag').addEventListener('click', () => {
                removerEscola(school);
            });
            
            schoolsContainer.appendChild(tag);
        });
    }

    // Navegação do Wizard (Voltar e Avançar)
    if (btnNext) btnNext.addEventListener('click', () => {
        if (validarPassoAtual(currentStep)) {
            currentStep++;
            atualizarWizard();
        }
    });

    if (btnPrev) btnPrev.addEventListener('click', () => {
        currentStep--;
        atualizarWizard();
    });

    // Atualizar UI do Wizard
    function atualizarWizard() {
        console.log(`[Wizard] Mudando para o passo: ${currentStep}`);
        
        // Exibir seções corretas e gerenciar classe ativa para prioridade CSS
        sections.forEach((sec, idx) => {
            const isActive = (idx + 1) === currentStep;
            sec.style.display = isActive ? 'flex' : 'none';
            if (isActive) {
                sec.classList.add('active');
            } else {
                sec.classList.remove('active');
            }
        });

        // Atualizar indicadores visuais
        indicators.forEach((ind, idx) => {
            const stepNum = idx + 1;
            ind.classList.remove('active', 'completed');
            
            if (stepNum === currentStep) {
                ind.classList.add('active');
            } else if (stepNum < currentStep) {
                ind.classList.add('completed');
            }
        });

        // Atualizar linhas de ligação
        lines.forEach((line, idx) => {
            const stepNum = idx + 1;
            line.classList.remove('completed');
            if (stepNum < currentStep) {
                line.classList.add('completed');
            }
        });

        // Controlar visibilidade de botões
        btnPrev.style.display = currentStep > 1 ? 'block' : 'none';
        btnNext.style.display = currentStep < totalSteps ? 'block' : 'none';
        btnSubmit.style.display = currentStep === totalSteps ? 'block' : 'none';

        // Compilar resumo no passo 5
        if (currentStep === totalSteps) {
            compilarResumo();
        }
    }

    // Validar cada passo localmente com mensagens extremamente claras e auto-foco
    function validarPassoAtual(step) {
        limparTodosErros();

        if (step === 1) {
            const nome = document.getElementById('nome');
            const cpf = document.getElementById('cpf');
            const email = document.getElementById('email');
            const tel = document.getElementById('telefone');
            const cidade = document.getElementById('cidade');
            const senha = document.getElementById('senha');
            const confirmarSenha = document.getElementById('confirmar-senha');

            if (!nome.value.trim()) { marcarErro(nome); nome.focus(); mostrarNotificacao('Por favor, digite seu nome completo.', 'erro'); return false; }
            if (!validarNome(nome.value)) { marcarErro(nome); nome.focus(); mostrarNotificacao('O nome deve conter apenas letras e ter no mínimo 3 caracteres.', 'erro'); return false; }
            
            if (!cpf.value.trim()) { marcarErro(cpf); cpf.focus(); mostrarNotificacao('Por favor, digite seu CPF.', 'erro'); return false; }
            if (!validarCPF(cpf.value)) { marcarErro(cpf); cpf.focus(); mostrarNotificacao('O CPF digitado é inválido. Digite um CPF com 11 dígitos.', 'erro'); return false; }
            
            if (!email.value.trim()) { marcarErro(email); email.focus(); mostrarNotificacao('Por favor, preencha seu endereço de e-mail.', 'erro'); return false; }
            if (!validarEmail(email.value)) { marcarErro(email); email.focus(); mostrarNotificacao('O formato do e-mail é inválido. Exemplo: usuario@dominio.com', 'erro'); return false; }
            
            if (!tel.value.trim()) { marcarErro(tel); tel.focus(); mostrarNotificacao('Por favor, digite seu número de telefone.', 'erro'); return false; }
            if (!validarTelefone(tel.value)) { marcarErro(tel); tel.focus(); mostrarNotificacao('O telefone deve conter código de área (DDD) e de 10 a 11 dígitos.', 'erro'); return false; }
            
            if (!cidade.value.trim()) { marcarErro(cidade); cidade.focus(); mostrarNotificacao('Por favor, preencha o nome da sua cidade.', 'erro'); return false; }
            if (!validarCidade(cidade.value)) { marcarErro(cidade); cidade.focus(); mostrarNotificacao('A cidade deve conter pelo menos 3 letras.', 'erro'); return false; }
            
            const vSenha = validarSenha(senha.value);
            if (!senha.value) { marcarErro(senha); senha.focus(); mostrarNotificacao('Por favor, digite uma senha.', 'erro'); return false; }
            if (!vSenha.valido) { marcarErro(senha); senha.focus(); mostrarNotificacao('A senha deve conter no mínimo 4 caracteres.', 'erro'); return false; }
            
            if (senha.value !== confirmarSenha.value) { marcarErro(confirmarSenha); confirmarSenha.focus(); mostrarNotificacao('A confirmação de senha não coincide com a senha digitada.', 'erro'); return false; }
        } 
        else if (step === 2) {
            const cnhNum = document.getElementById('cnh_numero');
            const cnhCat = document.getElementById('cnh_categoria');
            const cnhVal = document.getElementById('cnh_validade');

            if (!cnhNum.value.trim() || cnhNum.value.trim().length < 5) { marcarErro(cnhNum); cnhNum.focus(); mostrarNotificacao('O número da CNH é obrigatório e deve ter no mínimo 5 dígitos.', 'erro'); return false; }
            if (!cnhCat.value) { marcarErro(cnhCat); cnhCat.focus(); mostrarNotificacao('Selecione a categoria de CNH válida para transporte escolar.', 'erro'); return false; }
            if (!cnhVal.value.trim() || !/^\d{2}\/\d{2}\/\d{4}$/.test(cnhVal.value)) { marcarErro(cnhVal); cnhVal.focus(); mostrarNotificacao('Digite uma data de validade da CNH válida no formato DD/MM/AAAA.', 'erro'); return false; }
        } 
        else if (step === 3) {
            const placa = document.getElementById('veiculo_placa');
            const modelo = document.getElementById('veiculo_modelo');
            const ano = document.getElementById('veiculo_ano');
            const cap = document.getElementById('veiculo_capacidade');

            if (!placa.value.trim() || placa.value.trim().length < 5) { marcarErro(placa); placa.focus(); mostrarNotificacao('A placa do veículo é obrigatória (formato mínimo de 5 caracteres).', 'erro'); return false; }
            if (!modelo.value.trim() || modelo.value.trim().length < 2) { marcarErro(modelo); modelo.focus(); mostrarNotificacao('Digite o modelo da van escolar (mínimo 2 caracteres).', 'erro'); return false; }
            
            const anoVal = parseInt(ano.value);
            const anoAtual = new Date().getFullYear();
            if (isNaN(anoVal) || anoVal < 2000 || anoVal > anoAtual + 1) { marcarErro(ano); ano.focus(); mostrarNotificacao(`O ano de fabricação do veículo deve ser entre 2000 e ${anoAtual + 1}.`, 'erro'); return false; }
            
            const capVal = parseInt(cap.value);
            if (isNaN(capVal) || capVal <= 0 || capVal > 100) { marcarErro(cap); cap.focus(); mostrarNotificacao('A capacidade de passageiros deve ser um número entre 1 e 100.', 'erro'); return false; }
        }
        else if (step === 4) {
            // Escolas são opcionais, mas sugerimos adicionar pelo menos uma
            if (schoolsList.length === 0) {
                mostrarNotificacao('Dica: Adicionar as escolas ajuda a traçar suas rotas no dashboard!', 'aviso');
            }
        }

        return true;
    }

    function marcarErro(input) {
        input.classList.add('input-erro');
    }

    function limparTodosErros() {
        document.querySelectorAll('.input-erro').forEach(i => i.classList.remove('input-erro'));
    }

    // Compilar e exibir resumo visual no Passo 5
    function compilarResumo() {
        const summaryContainer = document.querySelector('.wizard-summary-card');
        if (!summaryContainer) return;

        const nome = document.getElementById('nome').value;
        const email = document.getElementById('email').value;
        const cpf = document.getElementById('cpf').value;
        const tel = document.getElementById('telefone').value;
        const cidade = document.getElementById('cidade').value;

        const cnhNum = document.getElementById('cnh_numero').value;
        const cnhCat = document.getElementById('cnh_categoria').value;
        const cnhVal = document.getElementById('cnh_validade').value;

        const placa = document.getElementById('veiculo_placa').value;
        const modelo = document.getElementById('veiculo_modelo').value;
        const ano = document.getElementById('veiculo_ano').value;
        const cap = document.getElementById('veiculo_capacidade').value;

        let schoolsHtml = '';
        if (schoolsList.length === 0) {
            schoolsHtml = '<span style="font-size: 0.85rem; color: var(--placeholder-gray); font-style: italic;">Nenhuma escola cadastrada</span>';
        } else {
            schoolsHtml = `<div class="summary-schools-list">
                ${schoolsList.map(s => `<span class="summary-school-badge">${s}</span>`).join('')}
            </div>`;
        }

        summaryContainer.innerHTML = `
            <div class="summary-group">
                <div class="summary-group-title"><i class="fas fa-user"></i> Informações Pessoais</div>
                <div class="summary-item"><span class="summary-item-label">Nome:</span><span class="summary-item-value">${nome}</span></div>
                <div class="summary-item"><span class="summary-item-label">CPF:</span><span class="summary-item-value">${cpf}</span></div>
                <div class="summary-item"><span class="summary-item-label">Email:</span><span class="summary-item-value">${email}</span></div>
                <div class="summary-item"><span class="summary-item-label">Telefone:</span><span class="summary-item-value">${tel}</span></div>
                <div class="summary-item"><span class="summary-item-label">Cidade:</span><span class="summary-item-value">${cidade}</span></div>
            </div>

            <div class="summary-group">
                <div class="summary-group-title"><i class="fas fa-id-card"></i> Dados de Habilitação</div>
                <div class="summary-item"><span class="summary-item-label">Nº CNH:</span><span class="summary-item-value">${cnhNum}</span></div>
                <div class="summary-item"><span class="summary-item-label">Categoria:</span><span class="summary-item-value">Cat. ${cnhCat}</span></div>
                <div class="summary-item"><span class="summary-item-label">Validade:</span><span class="summary-item-value">${cnhVal}</span></div>
            </div>

            <div class="summary-group">
                <div class="summary-group-title"><i class="fas fa-bus"></i> Dados da Van Escolar</div>
                <div class="summary-item"><span class="summary-item-label">Placa:</span><span class="summary-item-value">${placa}</span></div>
                <div class="summary-item"><span class="summary-item-label">Modelo:</span><span class="summary-item-value">${modelo}</span></div>
                <div class="summary-item"><span class="summary-item-label">Ano:</span><span class="summary-item-value">${ano}</span></div>
                <div class="summary-item"><span class="summary-item-label">Capacidade:</span><span class="summary-item-value">${cap} passageiros</span></div>
            </div>

            <div class="summary-group">
                <div class="summary-group-title"><i class="fas fa-school"></i> Escolas Atendidas</div>
                ${schoolsHtml}
            </div>
        `;
    }

    // Submissão do formulário final (Dupla inserção)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('[Wizard] Iniciando envio integrado de dados...');

            // Validação final de segurança
            for (let s = 1; s <= 4; s++) {
                if (!validarPassoAtual(s)) {
                    currentStep = s;
                    atualizarWizard();
                    return;
                }
            }

            const nome = document.getElementById('nome').value.trim();
            const email = document.getElementById('email').value.trim();
            const cpfSemMascara = document.getElementById('cpf').value.replace(/\D/g, '');
            const telefoneSemMascara = document.getElementById('telefone').value.replace(/\D/g, '');
            const cidade = document.getElementById('cidade').value.trim();
            const s = document.getElementById('senha').value;

            // CNH
            const cnhNum = document.getElementById('cnh_numero').value.trim();
            const cnhCat = document.getElementById('cnh_categoria').value;
            const cnhVal = document.getElementById('cnh_validade').value;

            // Veículo
            const placa = document.getElementById('veiculo_placa').value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const modelo = document.getElementById('veiculo_modelo').value.trim();
            const ano = parseInt(document.getElementById('veiculo_ano').value);
            const capacidade = parseInt(document.getElementById('veiculo_capacidade').value);

            btnSubmit.disabled = true;
            btnSubmit.textContent = 'Registrando...';

            try {
                // Passo 1: Registrar Usuário do Perfil Motorista
                const userPayload = {
                    email: email,
                    cpf: cpfSemMascara,
                    nome: nome,
                    telefone: telefoneSemMascara,
                    cidade: cidade,
                    tipo_perfil: 'motorista',
                    senha: s
                };

                console.log('[Wizard] Registrando conta de motorista...', userPayload);
                const userResponse = await fetchAPI('POST', CONFIG.ENDPOINTS.CADASTRO, userPayload);
                console.log('[Wizard] Resposta conta motorista:', userResponse);

                if (!userResponse || !userResponse.id) {
                    throw new Error(userResponse?.erro || 'Erro ao registrar usuário.');
                }

                const driverId = userResponse.id;
                mostrarNotificacao('✓ Conta criada com sucesso!', 'sucesso');

                // Passo 2: Cadastrar Veículo na tabela veiculos vinculando ao novo motorista
                const vehiclePayload = {
                    placa: placa,
                    modelo: modelo,
                    ano: ano,
                    capacidade: capacidade,
                    motorista_id: driverId // Esse valor é UUID string, e agora suportado na API!
                };

                console.log('[Wizard] Registrando van escolar...', vehiclePayload);
                try {
                    const vehicleResponse = await fetchAPI('POST', CONFIG.ENDPOINTS.VEICULO || '/api/veiculos', vehiclePayload);
                    console.log('[Wizard] Resposta veículo:', vehicleResponse);
                    mostrarNotificacao('✓ Veículo cadastrado com sucesso!', 'sucesso');
                } catch (vehError) {
                    console.error('[Wizard] Falha ao registrar veículo no banco:', vehError);
                    mostrarNotificacao('Aviso: Conta criada, mas cadastre o veículo no dashboard.', 'aviso', 4000);
                }

                // Passo 3: Salvar dados complementares locais (CNH e Escolas)
                localStorage.setItem(`driver_cnh_${driverId}`, JSON.stringify({
                    numero: cnhNum,
                    categoria: cnhCat,
                    validade: cnhVal
                }));
                localStorage.setItem(`driver_schools_${driverId}`, JSON.stringify(schoolsList));

                mostrarNotificacao('✓ Cadastro completo! Redirecionando...', 'sucesso', 2000);
                
                setTimeout(() => {
                    window.location.href = '/pages/index.html';
                }, 2000);

            } catch (err) {
                console.error('[Wizard] Falha durante o cadastro integrado:', err);
                mostrarNotificacao(err.message || 'Erro ao realizar cadastro.', 'erro');
                btnSubmit.disabled = false;
                btnSubmit.textContent = 'Concluir Cadastro';
            }
        });
    }
});

// Helper de envio FetchAPI
async function fetchAPI(method, endpoint, payload = null) {
    const url = `${CONFIG.API_URL}${endpoint}`;
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    if (payload) {
        options.body = JSON.stringify(payload);
    }
    const response = await fetch(url, options);
    return response.json();
}

function aplicarMascaraCPF(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 9) v = v.substring(0, 3) + '.' + v.substring(3, 6) + '.' + v.substring(6, 9) + '-' + v.substring(9);
    else if (v.length > 6) v = v.substring(0, 3) + '.' + v.substring(3, 6) + '.' + v.substring(6);
    else if (v.length > 3) v = v.substring(0, 3) + '.' + v.substring(3);
    e.target.value = v;
}

function aplicarMascaraTelefone(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 6) v = '(' + v.substring(0, 2) + ') ' + v.substring(2, 7) + '-' + v.substring(7);
    else if (v.length > 2) v = '(' + v.substring(0, 2) + ') ' + v.substring(2);
    e.target.value = v;
}

// Emissão de Toasts (Notificação)
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 3000) {
    const container = document.getElementById('notificacoes');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = `notificacao notificacao-${tipo}`;
    
    // Clean message by removing any "Erro:", "Error:" or "Falha ao..." prefix
    let cleanMsg = mensagem.trim();
    cleanMsg = cleanMsg.replace(/^(erro|error|falha|fail|falha ao cadastrar usuário|erro ao cadastrar|erro ao realizar cadastro)[:\s\-\.]*/gi, '').trim();
    if (cleanMsg.length > 0) {
        cleanMsg = cleanMsg.charAt(0).toUpperCase() + cleanMsg.slice(1);
    } else {
        cleanMsg = tipo === 'erro' ? 'Ocorreu um erro inesperado.' : mensagem;
    }

    let iconClass = 'fas fa-info-circle';
    if (tipo === 'erro') iconClass = 'fas fa-exclamation-circle';
    else if (tipo === 'sucesso') iconClass = 'fas fa-check-circle';
    else if (tipo === 'aviso') iconClass = 'fas fa-exclamation-triangle';

    notif.innerHTML = `
        <i class="${iconClass}" style="font-size: 16px; margin-right: 8px;"></i>
        <span>${cleanMsg}</span>
    `;

    container.appendChild(notif);

    setTimeout(() => {
        notif.style.animation = 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
        setTimeout(() => notif.remove(), 400);
    }, duracao);
}
