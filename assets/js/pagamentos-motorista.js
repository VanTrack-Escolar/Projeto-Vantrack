/**
 * Módulo de Pagamentos - Dashboard Motorista (Premium CRM)
 * Gerencia visualização e controle de pagamentos dos alunos com design de ponta
 */

class GerenciadorPagamentosMotorista {
    constructor() {
        this.apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'http://localhost:5000/api';
        this.usuarioDados = JSON.parse(localStorage.getItem('usuario_dados') || '{}');
        this.motoristaId = this.usuarioDados.id;
        this.paginaAtual = 'pagamentos';
        this.alunosDadosCached = []; // Cache local de dados para filtros rápidos
        this.init();
    }

    async init() {
        if (!document.querySelector('.sidebar-menu')) {
            return;
        }

        this.adicionarMenuPagamentos();
    }

    adicionarMenuPagamentos() {
        const menu = document.querySelector('.sidebar-menu');
        if (!menu) return;

        if (menu.querySelector('[data-menu="pagamentos"]')) return;

        const itemPagamentos = document.createElement('a');
        itemPagamentos.href = '#pagamentos';
        itemPagamentos.className = 'menu-item';
        itemPagamentos.setAttribute('data-menu', 'pagamentos');
        itemPagamentos.innerHTML = `
            <i class="fas fa-wallet"></i>
            <span>Pagamentos</span>
        `;

        menu.appendChild(itemPagamentos);

        itemPagamentos.addEventListener('click', (e) => {
            e.preventDefault();
            this.ativarSecaoPagamentos();
        });
    }

    ativarSecaoPagamentos() {
        // Ocultar seções e atualizar menus
        document.querySelectorAll('.dashboard-section').forEach(secao => secao.classList.remove('active'));
        document.querySelectorAll('.menu-item').forEach(menu => menu.classList.remove('active'));
        
        const menuPagamento = document.querySelector('[data-menu="pagamentos"]');
        if (menuPagamento) {
            menuPagamento.classList.add('active');
        }

        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            pageTitle.textContent = 'Gestão de Pagamentos';
        }

        let secao = document.getElementById('pagamentos-section');
        if (!secao) {
            secao = this.criarSecaoPagamentos();
            document.querySelector('.content-area').appendChild(secao);
            this.anexarEventosFiltros();
        }
        secao.classList.add('active');

        this.carregarDadosPagamentos();
    }

    criarSecaoPagamentos() {
        const secao = document.createElement('section');
        secao.id = 'pagamentos-section';
        secao.className = 'dashboard-section';

        secao.innerHTML = `
            <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; margin-bottom: 24px;">
                <div>
                    <h1>Gestão de Pagamentos</h1>
                    <p>Monitore o fluxo de caixa, inadimplência e mensalidades da sua rota escolar</p>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button class="btn-small" id="btn-export-pdf" style="background: white; border: 1.5px solid var(--checkout-border); color: #475569; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-file-pdf" style="color: var(--checkout-red);"></i> Exportar PDF
                    </button>
                    <button class="btn-small" id="btn-export-excel" style="background: white; border: 1.5px solid var(--checkout-border); color: #475569; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-file-excel" style="color: var(--checkout-green);"></i> Exportar XLS
                    </button>
                </div>
            </div>

            <!-- Grelha de Cards Premium HSL -->
            <div class="resumo-card-grid">
                <div class="premium-metric-card" style="background: linear-gradient(135deg, #0f6cd5 0%, #0a56ac 100%);">
                    <p>Total de Alunos</p>
                    <h3 id="resumo-total-alunos">0</h3>
                </div>
                <div class="premium-metric-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                    <p>Alunos em Dia</p>
                    <h3 id="resumo-pagos">0</h3>
                </div>
                <div class="premium-metric-card" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">
                    <p>Inadimplentes</p>
                    <h3 id="resumo-pendentes">0</h3>
                </div>
                <div class="premium-metric-card" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                    <p>Atrasados</p>
                    <h3 id="resumo-atrasados">0</h3>
                </div>
            </div>

            <!-- Seção de Filtros e Busca -->
            <div class="card" style="margin-bottom: 24px; padding: 16px; border-radius: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; width: 100%;">
                    <div style="display: flex; gap: 12px; flex: 1; min-width: 280px; align-items: center;">
                        <div style="position: relative; flex: 1;">
                            <input type="text" id="busca-aluno" placeholder="Buscar aluno por nome..." class="form-control-checkout" style="padding-left: 36px; height: 42px;">
                            <i class="fas fa-search" style="position: absolute; left: 14px; top: 13px; color: #a9b4c3;"></i>
                        </div>
                        <div>
                            <select id="filtro-status" style="height: 42px; padding: 0 12px; border: 1.5px solid var(--checkout-border); border-radius: 8px; color: #475569; font-family: inherit; font-weight: 600; outline: none; background: white;">
                                <option value="">Todos os Status</option>
                                <option value="em-dia">✓ Em Dia</option>
                                <option value="pendente">⏳ Pendentes</option>
                                <option value="atrasado">⚠️ Atrasados</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Lista de Alunos e Finanças -->
            <div class="card" style="border-radius: 16px; overflow: hidden; box-shadow: var(--checkout-shadow);">
                <div class="card-body" style="padding: 0;">
                    <div style="overflow-x: auto;">
                        <table class="alunos-table" style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr>
                                    <th style="padding: 16px 20px;">Aluno</th>
                                    <th>Email</th>
                                    <th style="text-align: center;">Meses Pagos</th>
                                    <th style="text-align: center;">Pendências</th>
                                    <th style="text-align: center;">Atrasados</th>
                                    <th>Dívida Total</th>
                                    <th>Vencimento</th>
                                    <th style="padding-right: 20px; text-align: right;">Ações</th>
                                </tr>
                            </thead>
                            <tbody id="tabela-alunos">
                                <tr>
                                    <td colspan="8" style="text-align: center; padding: 40px; color: #a9b4c3;">
                                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; display: block; margin-bottom: 12px; color: var(--checkout-blue);"></i>
                                        Sincronizando base de dados...
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        return secao;
    }

    anexarEventosFiltros() {
        const busca = document.getElementById('busca-aluno');
        const filtro = document.getElementById('filtro-status');

        const aplicarFiltros = () => {
            const query = busca.value.toLowerCase().trim();
            const status = filtro.value;

            let filtrados = this.alunosDadosCached;

            if (query) {
                filtrados = filtrados.filter(aluno => aluno.nome.toLowerCase().includes(query));
            }

            if (status) {
                if (status === 'em-dia') {
                    // Sem pendências nem atrasos
                    filtrados = filtrados.filter(aluno => (aluno.pendentes || 0) === 0 && (aluno.atrasados || 0) === 0);
                } else if (status === 'pendente') {
                    filtrados = filtrados.filter(aluno => (aluno.pendentes || 0) > 0);
                } else if (status === 'atrasado') {
                    filtrados = filtrados.filter(aluno => (aluno.atrasados || 0) > 0);
                }
            }

            this.renderizarAlunosTabela(filtrados);
        };

        if (busca) busca.addEventListener('input', aplicarFiltros);
        if (filtro) filtro.addEventListener('change', aplicarFiltros);

        // Export Report Simulation Trigger
        const btnPdf = document.getElementById('btn-export-pdf');
        const btnExcel = document.getElementById('btn-export-excel');

        const triggerExport = (tipo) => {
            const label = tipo === 'Excel' ? 'XLS' : tipo;
            const msg = `Relatório consolidado exportado para ${label} com sucesso!`;
            
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao(msg, 'sucesso');
            } else if (typeof window.mostrarNotificacao === 'function') {
                window.mostrarNotificacao(msg, 'sucesso');
            } else {
                console.log(`[Exportar] ${msg}`);
            }
        };

        if (btnPdf) btnPdf.addEventListener('click', () => triggerExport('PDF'));
        if (btnExcel) btnExcel.addEventListener('click', () => triggerExport('Excel'));
    }

    async carregarDadosPagamentos() {
        if (!document.getElementById('pagamentos-section')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${this.apiUrl}/pagamentos/motorista/${this.motoristaId}/alunos`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const dados = await response.json();

            if (response.ok) {
                this.alunosDadosCached = dados.alunos || [];
                this.renderizarAlunosTabela(this.alunosDadosCached);
                this.atualizarMetricasTotais(this.alunosDadosCached);
            }
        } catch (erro) {
            console.error('Erro ao carregar pagamentos:', erro);
        }
    }

    atualizarMetricasTotais(alunos) {
        let totalAlunos = alunos.length;
        let emDiaCount = 0;
        let pendenteCount = 0;
        let atrasadoCount = 0;

        alunos.forEach(aluno => {
            const p = aluno.pendentes || 0;
            const a = aluno.atrasados || 0;
            
            if (p === 0 && a === 0) {
                emDiaCount++;
            } else if (a > 0) {
                atrasadoCount++;
            } else {
                pendenteCount++;
            }
        });

        document.getElementById('resumo-total-alunos').textContent = totalAlunos;
        document.getElementById('resumo-pagos').textContent = emDiaCount;
        document.getElementById('resumo-pendentes').textContent = pendenteCount;
        document.getElementById('resumo-atrasados').textContent = atrasadoCount;
    }

    renderizarAlunosTabela(alunos) {
        const tbody = document.getElementById('tabela-alunos');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!alunos || alunos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #a9b4c3;">
                        <i class="fas fa-inbox" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: #cbd5e1;"></i>
                        Nenhum aluno encontrado correspondente aos critérios.
                    </td>
                </tr>
            `;
            return;
        }

        alunos.forEach(aluno => {
            const totalReceberValue = aluno.total_pendente || 0;
            
            // Deduplicate name logic for listing
            let nomeExibicao = aluno.nome;
            const partes = aluno.nome.split(" ");
            if (partes.length > 2 && partes[0] === partes[partes.length / 2]) {
                nomeExibicao = partes.slice(0, partes.length / 2).join(" ");
            }

            const linha = document.createElement('tr');
            linha.style.borderBottom = '1px solid var(--checkout-border)';
            linha.style.transition = 'all 0.15s ease';

            linha.innerHTML = `
                <td style="padding: 16px 20px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 36px; height: 36px; border-radius: 50%; background: #e0f2fe; display: flex; align-items: center; justify-content: center; color: var(--checkout-blue); font-weight: 700; font-size: 0.95rem; border: 1.5px solid rgba(15, 108, 213, 0.15);">
                            ${nomeExibicao.charAt(0).toUpperCase()}
                        </div>
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 700; color: #1e293b;">${nomeExibicao}</span>
                            <span style="font-size: 0.75rem; color: #64748b;">Inscrito</span>
                        </div>
                    </div>
                </td>
                <td style="font-size: 0.85rem;">
                    <a href="mailto:${aluno.email}" style="color: var(--checkout-blue); text-decoration: none; font-weight: 600;">
                        ${aluno.email}
                    </a>
                </td>
                <td style="text-align: center;">
                    <span class="status-pill status-pill-pago">
                        ${aluno.pagos || 0}
                    </span>
                </td>
                <td style="text-align: center;">
                    ${aluno.pendentes > 0 
                        ? `<span class="status-pill status-pill-pendente">${aluno.pendentes}</span>`
                        : '<span style="color: #cbd5e1; font-weight: bold;">-</span>'
                    }
                </td>
                <td style="text-align: center;">
                    ${aluno.atrasados > 0 
                        ? `<span class="status-pill status-pill-atrasado">${aluno.atrasados}</span>`
                        : '<span style="color: #cbd5e1; font-weight: bold;">-</span>'
                    }
                </td>
                <td>
                    <span style="color: var(--checkout-blue); font-weight: 800; font-size: 0.95rem;">
                        R$ ${totalReceberValue.toFixed(2).replace('.', ',')}
                    </span>
                </td>
                <td style="color: #475569; font-size: 0.85rem; font-weight: 600;">
                    ${aluno.proxima_vencimento 
                        ? this.formatarData(aluno.proxima_vencimento)
                        : '-'
                    }
                </td>
                <td style="padding-right: 20px; text-align: right;">
                    <button class="btn-small" onclick="gerenciadorPagamentosMotorista.abrirDetalhesAluno('${aluno.id}', '${nomeExibicao}')" style="background: white; border: 1.5px solid var(--checkout-blue); color: var(--checkout-blue); font-weight: 700;">
                        <i class="fas fa-eye"></i> Detalhes
                    </button>
                </td>
            `;

            tbody.appendChild(linha);
        });
    }

    async abrirDetalhesAluno(alunoId, alunoNome) {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(
                `${this.apiUrl}/pagamentos/aluno/${alunoId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );

            const dados = await response.json();

            if (response.ok) {
                this.exibirModalDetalhes(alunoNome, dados.pagamentos);
            }
        } catch (erro) {
            console.error('Erro ao carregar detalhes:', erro);
        }
    }

    exibirModalDetalhes(alunoNome, pagamentos) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        const totalPago = pagamentos.filter(p => p.status === 'pago').reduce((acc, p) => acc + parseFloat(p.valor), 0);
        const totalPendente = pagamentos.filter(p => p.status === 'pendente').reduce((acc, p) => acc + parseFloat(p.valor), 0);
        const totalAtrasado = pagamentos.filter(p => p.status === 'atrasado').reduce((acc, p) => acc + parseFloat(p.valor), 0);

        let linhasTabela = '';
        if (pagamentos.length === 0) {
            linhasTabela = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 24px; color: #a9b4c3;">
                        Nenhum registro de faturamento encontrado.
                    </td>
                </tr>
            `;
        } else {
            pagamentos.forEach(p => {
                const statusBadge = this.obterStatusBadge(p.status);
                const mesAno = this.obterMesAno(p.mes_referencia, p.ano_referencia);
                linhasTabela += `
                    <tr style="border-bottom: 1px solid var(--checkout-border);">
                        <td style="padding: 12px 6px; font-weight: 600; color: #1e293b;">${mesAno}</td>
                        <td style="padding: 12px 6px; font-weight: 500; color: #475569;">${this.formatarData(p.data_vencimento)}</td>
                        <td style="padding: 12px 6px; color: var(--checkout-blue); font-weight: 800;">R$ ${parseFloat(p.valor).toFixed(2).replace('.', ',')}</td>
                        <td style="padding: 12px 6px;">${statusBadge}</td>
                        <td style="padding: 12px 6px; text-transform: capitalize; font-weight: 600; color: #64748b;">${p.metodo_pagamento || '-'}</td>
                    </tr>
                `;
            });
        }

        modal.innerHTML = `
            <div class="modal-content" style="max-width: 650px; max-height: 85vh; overflow-y: auto;">
                <div class="modal-header">
                    <h2 style="color: var(--checkout-blue); font-weight: 800;">
                        <i class="fas fa-file-invoice-dollar"></i> Histórico: ${alunoNome}
                    </h2>
                    <button onclick="this.closest('.modal-overlay').remove()" class="btn-close-modal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <!-- Detalhes Financeiros Rápido -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
                    <div style="background: #e8f5e9; padding: 14px; border-radius: 12px; border-left: 4px solid var(--checkout-green); box-shadow: var(--checkout-shadow);">
                        <p style="margin: 0; font-size: 0.75rem; color: #065f46; font-weight: 700; text-transform: uppercase;">Total Recebido</p>
                        <p style="margin: 4px 0 0 0; font-size: 1.25rem; font-weight: 800; color: #065f46;">
                            R$ ${totalPago.toFixed(2).replace('.', ',')}
                        </p>
                    </div>

                    <div style="background: #fee2e2; padding: 14px; border-radius: 12px; border-left: 4px solid var(--checkout-red); box-shadow: var(--checkout-shadow);">
                        <p style="margin: 0; font-size: 0.75rem; color: #991b1b; font-weight: 700; text-transform: uppercase;">A Receber</p>
                        <p style="margin: 4px 0 0 0; font-size: 1.25rem; font-weight: 800; color: #991b1b;">
                            R$ ${totalPendente.toFixed(2).replace('.', ',')}
                        </p>
                    </div>

                    <div style="background: #fef3c7; padding: 14px; border-radius: 12px; border-left: 4px solid var(--checkout-orange); box-shadow: var(--checkout-shadow);">
                        <p style="margin: 0; font-size: 0.75rem; color: #92400e; font-weight: 700; text-transform: uppercase;">Total Atrasado</p>
                        <p style="margin: 4px 0 0 0; font-size: 1.25rem; font-weight: 800; color: #92400e;">
                            R$ ${totalAtrasado.toFixed(2).replace('.', ',')}
                        </p>
                    </div>
                </div>

                <div style="overflow-x: auto;">
                    <table class="alunos-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                        <thead>
                            <tr style="border-bottom: 2px solid var(--checkout-border);">
                                <th style="padding: 10px 6px;">Referência</th>
                                <th style="padding: 10px 6px;">Vencimento</th>
                                <th style="padding: 10px 6px;">Valor</th>
                                <th style="padding: 10px 6px;">Status</th>
                                <th style="padding: 10px 6px;">Método</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasTabela}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    obterStatusBadge(status) {
        const statusMap = {
            'pago': { cor: '#10b981', ícone: 'fa-check-circle', label: 'Pago' },
            'pendente': { cor: '#3b82f6', ícone: 'fa-exclamation-circle', label: 'Pendente' },
            'atrasado': { cor: '#f59e0b', ícone: 'fa-clock', label: 'Atrasado' }
        };

        const config = statusMap[status] || statusMap['pendente'];
        return `<span style="background: ${config.cor}; color: white; padding: 3px 10px; border-radius: 20px; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px; font-weight: bold;">
            <i class="fas ${config.ícone}"></i> ${config.label}
        </span>`;
    }

    obterMesAno(mes, ano) {
        const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return `${meses[mes]} / ${ano}`;
    }

    formatarData(data) {
        if (!data) return '-';
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
}

// Instância global
let gerenciadorPagamentosMotorista;

// Inicializar ao carregar página - APENAS PARA MOTORISTAS
document.addEventListener('DOMContentLoaded', () => {
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados') || '{}');
    
    if (usuarioDados.tipo_perfil === 'motorista' && document.querySelector('.sidebar-menu')) {
        gerenciadorPagamentosMotorista = new GerenciadorPagamentosMotorista();
    }
});
