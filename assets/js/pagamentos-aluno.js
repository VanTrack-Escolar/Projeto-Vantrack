/**
 * Módulo de Pagamentos - Dashboard Aluno (Premium Checkout)
 * Gerencia pagamentos para alunos com design e micro-interações de ponta
 */

class GerenciadorPagamentosAluno {
    constructor() {
        this.apiUrl = typeof CONFIG !== 'undefined' ? CONFIG.API_URL : 'http://localhost:5000/api';
        this.usuarioDados = JSON.parse(localStorage.getItem('usuario_dados') || '{}');
        this.alunoId = this.usuarioDados.id;
        this.init();
    }

    async init() {
        this.criarModal();
        
        // Aguardar o modal ser inserido no DOM
        setTimeout(() => {
            this.anexarEventos();
        }, 100);
        
        await this.carregarPagamentos();
    }

    criarModal() {
        if (document.getElementById('modal-pagamento')) {
            return;
        }

        const html = `
            <div id="modal-pagamento" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="max-width: 520px; padding: 28px;">
                    <!-- CONTEÚDO DO CHECKOUT -->
                    <div id="checkout-form-wrapper">
                        <div class="modal-header">
                            <h2>
                                <i class="fas fa-shield-alt"></i> Checkout Seguro
                            </h2>
                            <button class="btn-close-modal" id="btn-fechar-checkout">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Detalhes do Pagamento -->
                        <div class="info-box" style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <span style="font-size: 0.85rem; color: #64748b; font-weight: 600;">VALOR DA MENSALIDADE</span>
                                <span id="checkout-referencia" style="font-size: 0.85rem; background: var(--checkout-blue); color: white; padding: 2px 8px; border-radius: 20px; font-weight: 700;"></span>
                            </div>
                            <div style="font-size: 2rem; font-weight: 800; color: var(--checkout-blue); margin-bottom: 8px;" id="checkout-valor">
                                R$ 0,00
                            </div>
                            <div style="font-size: 0.85rem; color: #475569; display: flex; align-items: center; gap: 6px;">
                                <i class="fas fa-user-tie" style="color: #64748b;"></i>
                                <span><strong>Motorista:</strong> <span id="checkout-motorista"></span></span>
                            </div>
                        </div>

                        <!-- Selector de abas de pagamento -->
                        <div class="payment-tabs">
                            <button type="button" class="payment-tab-btn active" data-tab="pix">
                                <i class="fas fa-mobile-alt"></i>
                                <span>PIX</span>
                            </button>
                            <button type="button" class="payment-tab-btn" data-tab="card-credit">
                                <i class="fas fa-credit-card"></i>
                                <span>Crédito</span>
                            </button>
                            <button type="button" class="payment-tab-btn" data-tab="card-debit">
                                <i class="fas fa-credit-card"></i>
                                <span>Débito</span>
                            </button>
                            <button type="button" class="payment-tab-btn" data-tab="cash">
                                <i class="fas fa-money-bill-wave"></i>
                                <span>Dinheiro</span>
                            </button>
                        </div>

                        <form id="form-checkout">
                            <!-- ABA 1: PIX -->
                            <div class="payment-form-panel active" id="panel-pix">
                                <div class="pix-container">
                                    <p style="margin: 0; font-size: 0.9rem; color: #475569; font-weight: 500;">
                                        Escaneie o QR Code abaixo para pagar via PIX instantâneo:
                                    </p>
                                    <div class="pix-qrcode-placeholder">
                                        <div class="pix-qrcode-scan-line"></div>
                                        <!-- QR code SVG ou placeholder imagem premium -->
                                        <i class="fas fa-qrcode" style="font-size: 8rem; color: #334155;"></i>
                                    </div>
                                    <p style="margin: 0; font-size: 0.8rem; color: #64748b;">
                                        Ou copie a chave "Copia e Cola" abaixo:
                                    </p>
                                    <div class="pix-key-box">
                                        <span class="pix-key-text" id="pix-chave-copia">00020101021226870014br.gov.pix0125aluno@vantrack.com.br5204000053039865406150.005802BR5915VanTrackPayments6009Sao Paulo62070503***</span>
                                        <button type="button" class="btn-copy-pix" id="btn-copiar-chave">
                                            <i class="fas fa-copy"></i> Copiar
                                        </button>
                                    </div>
                                    <div style="font-size: 0.8rem; color: #b45309; display: flex; align-items: center; gap: 6px; background: #fffbeb; padding: 10px; border-radius: 8px; width: 100%;">
                                        <i class="fas fa-clock"></i>
                                        <span>Este código PIX expira em <strong id="pix-timer">10:00</strong> minutos.</span>
                                    </div>
                                </div>
                            </div>

                            <!-- ABA 2: CARTÃO CRÉDITO / ABA 3: CARTÃO DÉBITO -->
                            <div class="payment-form-panel" id="panel-card">
                                <!-- Cartão Virtual Interativo -->
                                <div class="card-wrapper">
                                    <div class="credit-card-mock" id="card-mock-element">
                                        <!-- FRENTE DO CARTÃO -->
                                        <div class="card-face front">
                                            <div class="card-header-row">
                                                <div class="card-chip"></div>
                                                <span class="card-brand" id="card-brand-logo">VISA</span>
                                            </div>
                                            <div class="card-number-display" id="card-display-number">•••• •••• •••• ••••</div>
                                            <div class="card-footer-row">
                                                <div>
                                                    <div class="card-label">TITULAR DO CARTÃO</div>
                                                    <div class="card-value" id="card-display-name">NOME COMPLETO</div>
                                                </div>
                                                <div>
                                                    <div class="card-label">VALIDADE</div>
                                                    <div class="card-value" id="card-display-expiry">MM/AA</div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- VERSO DO CARTÃO -->
                                        <div class="card-face back">
                                            <div class="card-magnetic-stripe"></div>
                                            <div class="card-signature-area">
                                                <div class="card-signature-stripes"></div>
                                                <div class="card-cvv-display" id="card-display-cvv">•••</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Formulário de Cartão -->
                                <div class="form-group">
                                    <label>NÚMERO DO CARTÃO</label>
                                    <input type="text" class="form-control-checkout" id="card-number" maxlength="19" placeholder="4000 1234 5678 9010" required>
                                </div>
                                <div class="form-group">
                                    <label>NOME IMPRESSO NO CARTÃO</label>
                                    <input type="text" class="form-control-checkout" id="card-name" placeholder="MARIA DOS SANTOS" required style="text-transform: uppercase;">
                                </div>
                                <div class="form-grid-row">
                                    <div class="form-group">
                                        <label>VALIDADE</label>
                                        <input type="text" class="form-control-checkout" id="card-expiry" maxlength="5" placeholder="MM/AA" required>
                                    </div>
                                    <div class="form-group">
                                        <label>CVV (CÓD. SEGURANÇA)</label>
                                        <input type="text" class="form-control-checkout" id="card-cvv" maxlength="4" placeholder="123" required>
                                    </div>
                                </div>
                            </div>

                            <!-- ABA 4: DINHEIRO -->
                            <div class="payment-form-panel" id="panel-cash">
                                <div class="cash-slip-box">
                                    <div style="font-size: 2.5rem; text-align: center; margin-bottom: 12px;">💵</div>
                                    <h4 style="margin: 0 0 8px 0; color: #92400e; font-weight: 700; text-align: center;">Pagamento Presencial</h4>
                                    <p style="margin: 0; font-size: 0.85rem; color: #b45309; line-height: 1.5; text-align: center;">
                                        Ao selecionar essa opção, você declara que fará o pagamento em dinheiro diretamente ao motorista na van escolar.
                                    </p>
                                </div>
                                <div style="background: #f8fafc; border: 1px solid var(--checkout-border); padding: 16px; border-radius: 10px; font-size: 0.85rem; color: #475569;">
                                    <i class="fas fa-info-circle" style="color: var(--checkout-blue); margin-right: 6px;"></i>
                                    O motorista receberá uma notificação para confirmar a transação assim que receber o valor em mãos.
                                </div>
                            </div>

                            <!-- Botões de Ação do Formulário -->
                            <div style="display: flex; gap: 12px; margin-top: 24px;">
                                <button type="button" class="btn-secondary-checkout" id="btn-cancelar-checkout" style="flex: 1; padding: 12px;">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn-primary-checkout" id="btn-confirmar-checkout" style="flex: 1.5; padding: 12px;">
                                    <i class="fas fa-lock"></i> Confirmar Pagamento
                                </button>
                            </div>
                        </form>
                    </div>

                    <!-- TELA DE SUCESSO DO CHECKOUT -->
                    <div id="checkout-success-wrapper" style="display: none;">
                        <div class="success-checkout-panel">
                            <div class="success-icon-wrapper">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h2 style="margin: 0 0 10px 0; color: #065f46; font-weight: 800;">Transação Aprovada!</h2>
                            <p style="margin: 0 0 24px 0; color: #047857; font-size: 0.95rem; font-weight: 500; max-width: 320px; line-height: 1.5;">
                                Seu pagamento foi registrado e sincronizado com o banco de dados do motorista com sucesso.
                            </p>
                            <div style="width: 100%; border-top: 1px solid #d1fae5; padding-top: 20px; display: flex; flex-direction: column; gap: 8px; align-items: center; margin-bottom: 24px;">
                                <div style="display: flex; justify-content: space-between; width: 80%; font-size: 0.85rem; color: #047857;">
                                    <span>Identificador:</span>
                                    <strong id="success-tx-id" style="font-family: monospace;">TX-9382103</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; width: 80%; font-size: 0.85rem; color: #047857;">
                                    <span>Método:</span>
                                    <strong id="success-tx-method" style="text-transform: capitalize;">PIX</strong>
                                </div>
                            </div>
                            <button type="button" class="btn-primary-checkout" id="btn-sucesso-fechar" style="max-width: 200px; background: var(--checkout-green); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                                Voltar ao Painel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    anexarEventos() {
        const checkoutModal = document.getElementById('modal-pagamento');
        if (!checkoutModal) return;

        const btnFechar = document.getElementById('btn-fechar-checkout');
        const btnCancelar = document.getElementById('btn-cancelar-checkout');
        const btnSucessoFechar = document.getElementById('btn-sucesso-fechar');
        const formCheckout = document.getElementById('form-checkout');
        
        // Fechamento simples
        const fecharModal = () => {
            checkoutModal.style.display = 'none';
            // Restaurar abas e formulários caso estejam em sucesso
            document.getElementById('checkout-form-wrapper').style.display = 'block';
            document.getElementById('checkout-success-wrapper').style.display = 'none';
        };

        if (btnFechar) btnFechar.addEventListener('click', fecharModal);
        if (btnCancelar) btnCancelar.addEventListener('click', fecharModal);
        if (btnSucessoFechar) btnSucessoFechar.addEventListener('click', fecharModal);

        // Seletor de Abas de Pagamento
        const abas = document.querySelectorAll('.payment-tab-btn');
        abas.forEach(aba => {
            aba.addEventListener('click', () => {
                abas.forEach(b => b.classList.remove('active'));
                aba.classList.add('active');

                const tabType = aba.getAttribute('data-tab');
                
                // Ocultar todos os painéis de formulário
                document.querySelectorAll('.payment-form-panel').forEach(p => p.classList.remove('active'));

                if (tabType === 'pix') {
                    document.getElementById('panel-pix').classList.add('active');
                } else if (tabType === 'card-credit' || tabType === 'card-debit') {
                    document.getElementById('panel-card').classList.add('active');
                } else if (tabType === 'cash') {
                    document.getElementById('panel-cash').classList.add('active');
                }
            });
        });

        // 3D Credit Card Realtime Mockup Handlers
        const cardMock = document.getElementById('card-mock-element');
        const inputNumber = document.getElementById('card-number');
        const inputName = document.getElementById('card-name');
        const inputExpiry = document.getElementById('card-expiry');
        const inputCvv = document.getElementById('card-cvv');

        if (inputNumber) {
            inputNumber.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                // Format card number 0000 0000 0000 0000
                v = v.replace(/(\d{4})(?=\d)/g, '$1 ');
                e.target.value = v;

                document.getElementById('card-display-number').textContent = v || '•••• •••• •••• ••••';

                // Detect card brand automatically
                const brand = document.getElementById('card-brand-logo');
                if (v.startsWith('4')) {
                    brand.textContent = 'VISA';
                } else if (v.startsWith('5')) {
                    brand.textContent = 'MASTERCARD';
                } else if (v.startsWith('3')) {
                    brand.textContent = 'AMEX';
                } else {
                    brand.textContent = 'CARD';
                }
            });
        }

        if (inputName) {
            inputName.addEventListener('input', (e) => {
                const clean = e.target.value.toUpperCase();
                document.getElementById('card-display-name').textContent = clean || 'NOME COMPLETO';
            });
        }

        if (inputExpiry) {
            inputExpiry.addEventListener('input', (e) => {
                let v = e.target.value.replace(/\D/g, '');
                if (v.length > 2) {
                    v = v.substring(0, 2) + '/' + v.substring(2, 4);
                }
                e.target.value = v;
                document.getElementById('card-display-expiry').textContent = v || 'MM/AA';
            });
        }

        if (inputCvv) {
            // Flip card to CVV back-face on focus!
            inputCvv.addEventListener('focus', () => {
                if (cardMock) cardMock.classList.add('flipped');
            });
            inputCvv.addEventListener('blur', () => {
                if (cardMock) cardMock.classList.remove('flipped');
            });
            inputCvv.addEventListener('input', (e) => {
                const v = e.target.value.replace(/\D/g, '');
                e.target.value = v;
                document.getElementById('card-display-cvv').textContent = v || '•••';
            });
        }

        // Copy PIX key handling
        const btnCopiar = document.getElementById('btn-copiar-chave');
        if (btnCopiar) {
            btnCopiar.addEventListener('click', () => {
                const text = document.getElementById('pix-chave-copia').textContent;
                navigator.clipboard.writeText(text).then(() => {
                    btnCopiar.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    btnCopiar.style.background = 'var(--checkout-green)';
                    
                    if (typeof mostrarNotificacao !== 'undefined') {
                        mostrarNotificacao('Chave PIX copiada com sucesso!', 'sucesso');
                    }

                    setTimeout(() => {
                        btnCopiar.innerHTML = '<i class="fas fa-copy"></i> Copiar';
                        btnCopiar.style.background = 'var(--checkout-blue)';
                    }, 2000);
                });
            });
        }

        // Submit checkout transaction
        if (formCheckout) {
            formCheckout.addEventListener('submit', (e) => this.processarPagamento(e));
        }
    }

    abrirModal(pagamento) {
        const mesAno = this.obterMesAno(pagamento.mes_referencia, pagamento.ano_referencia);
        
        document.getElementById('checkout-referencia').textContent = mesAno;
        document.getElementById('checkout-valor').textContent = this.formatarValor(pagamento.valor);
        document.getElementById('checkout-motorista').textContent = pagamento.motorista_nome;
        document.getElementById('form-checkout').dataset.pagamentoId = pagamento.id;

        // Reset forms and inputs
        const number = document.getElementById('card-number');
        const name = document.getElementById('card-name');
        const expiry = document.getElementById('card-expiry');
        const cvv = document.getElementById('card-cvv');

        if (number) number.value = '';
        if (name) name.value = '';
        if (expiry) expiry.value = '';
        if (cvv) cvv.value = '';

        document.getElementById('card-display-number').textContent = '•••• •••• •••• ••••';
        document.getElementById('card-display-name').textContent = 'NOME COMPLETO';
        document.getElementById('card-display-expiry').textContent = 'MM/AA';
        document.getElementById('card-display-cvv').textContent = '•••';

        // Start dynamic PIX timer mockup
        this.iniciarPIXTimer();

        // Show modal overlay
        document.getElementById('modal-pagamento').style.display = 'flex';
    }

    iniciarPIXTimer() {
        let duration = 600; // 10 minutes
        const timerDisplay = document.getElementById('pix-timer');
        if (!timerDisplay) return;

        if (this.pixInterval) clearInterval(this.pixInterval);

        this.pixInterval = setInterval(() => {
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            
            timerDisplay.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            if (--duration < 0) {
                clearInterval(this.pixInterval);
                timerDisplay.textContent = 'EXPIRADO';
                timerDisplay.style.color = '#ef4444';
            }
        }, 1000);
    }

    async processarPagamento(e) {
        e.preventDefault();

        const pagamentoId = document.getElementById('form-checkout').dataset.pagamentoId;
        const activeTab = document.querySelector('.payment-tab-btn.active');
        const tabType = activeTab ? activeTab.getAttribute('data-tab') : 'pix';

        let metodo = 'pix';
        if (tabType === 'card-credit') {
            metodo = 'credito';
        } else if (tabType === 'card-debit') {
            metodo = 'debito';
        } else if (tabType === 'cash') {
            metodo = 'dinheiro';
        }

        const btnConfirmar = document.getElementById('btn-confirmar-checkout');
        btnConfirmar.disabled = true;
        btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiUrl}/pagamentos/${pagamentoId}/pagar`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ metodo_pagamento: metodo })
            });

            const dados = await response.json();

            if (response.ok) {
                // Populate success screens beautifully
                const txId = 'TX-' + Math.floor(1000000 + Math.random() * 9000000);
                document.getElementById('success-tx-id').textContent = txId;
                document.getElementById('success-tx-method').textContent = metodo === 'pix' ? 'PIX Instantâneo' : metodo === 'credito' ? 'Cartão de Crédito' : metodo === 'debito' ? 'Cartão de Débito' : 'Dinheiro Presencial';

                // Slide out the form wrapper, slide in success wrapper
                document.getElementById('checkout-form-wrapper').style.display = 'none';
                document.getElementById('checkout-success-wrapper').style.display = 'block';
                
                await this.carregarPagamentos();
            } else {
                if (typeof mostrarNotificacao !== 'undefined') {
                    mostrarNotificacao(`Erro no pagamento: ${dados.erro}`, 'erro');
                } else {
                    alert(`Erro: ${dados.erro}`);
                }
            }
        } catch (erro) {
            console.error('Erro ao realizar pagamento:', erro);
            if (typeof mostrarNotificacao !== 'undefined') {
                mostrarNotificacao('Erro ao conectar com gateway de pagamentos.', 'erro');
            } else {
                alert('Erro ao processar pagamento');
            }
        } finally {
            btnConfirmar.disabled = false;
            btnConfirmar.innerHTML = '<i class="fas fa-lock"></i> Confirmar Pagamento';
        }
    }

    async carregarPagamentos() {
        if (!document.getElementById('pagamentos-table-body')) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${this.apiUrl}/pagamentos/aluno/${this.alunoId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const dados = await response.json();

            if (response.ok) {
                this.exibirPagamentos(dados.pagamentos, dados.resumo);
            }
        } catch (erro) {
            console.error('Erro ao carregar pagamentos:', erro);
        }
    }

    exibirPagamentos(pagamentos, resumo) {
        const tbody = document.getElementById('pagamentos-table-body');
        if (!tbody) {
            return;
        }

        const menuPagamento = document.querySelector('[data-menu="pagamentos"]');
        if (menuPagamento && resumo.qtd_pendente > 0) {
            const badge = menuPagamento.querySelector('.badge') || document.createElement('span');
            badge.className = 'badge badge-danger';
            badge.textContent = resumo.qtd_pendente;
            badge.style.cssText = 'background: #ef4444; color: white; padding: 2px 6px; border-radius: 12px; font-size: 0.75rem; margin-left: 8px;';
            if (!menuPagamento.querySelector('.badge')) {
                menuPagamento.appendChild(badge);
            }
        } else if (menuPagamento) {
            const b = menuPagamento.querySelector('.badge');
            if (b) b.remove();
        }

        tbody.innerHTML = '';

        if (pagamentos.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 40px; color: #a9b4c3;">
                        <i class="fas fa-wallet" style="font-size: 2.5rem; margin-bottom: 12px; display: block; color: #cbd5e1;"></i>
                        Nenhum pagamento registrado
                    </td>
                </tr>
            `;
            return;
        }

        pagamentos.forEach(pagamento => {
            const linha = document.createElement('tr');
            const statusBadge = this.obterStatusBadge(pagamento.status);
            const mesAno = this.obterMesAno(pagamento.mes_referencia, pagamento.ano_referencia);

            linha.innerHTML = `
                <td>${mesAno}</td>
                <td>${this.formatarData(pagamento.data_vencimento)}</td>
                <td style="font-weight: 700; color: #0F6CD5;">R$ ${pagamento.valor.toFixed(2)}</td>
                <td>${statusBadge}</td>
                <td>
                    ${pagamento.status === 'pendente' || pagamento.status === 'atrasado' ? `
                        <button class="btn-primary-small" onclick="gerenciadorPagamentos.abrirModal(${JSON.stringify(pagamento).replace(/"/g, '&quot;')})">
                            <i class="fas fa-credit-card"></i> Pagar Agora
                        </button>
                    ` : pagamento.status === 'pago' ? `
                        <button class="btn-small" style="background: #10b981; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: default;">
                            <i class="fas fa-check"></i> Pago ✓
                        </button>
                    ` : `
                        <span style="color: #cbd5e1; font-size: 0.9rem;">-</span>
                    `}
                </td>
            `;

            tbody.appendChild(linha);
        });
    }

    obterStatusBadge(status) {
        const statusMap = {
            'pago': { cor: '#10b981', ícone: 'fa-check-circle', label: 'Pago' },
            'pendente': { cor: '#3b82f6', ícone: 'fa-exclamation-circle', label: 'Pendente' },
            'atrasado': { cor: '#f59e0b', ícone: 'fa-clock', label: 'Atrasado' },
            'cancelado': { cor: '#a9b4c3', ícone: 'fa-times-circle', label: 'Cancelado' }
        };

        const config = statusMap[status] || statusMap['pendente'];
        return `<span style="background: ${config.cor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 6px; font-weight: bold;">
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

    formatarValor(valor) {
        return `R$ ${parseFloat(valor).toFixed(2).replace('.', ',')}`;
    }
}

// Instância global
let gerenciadorPagamentos;

// Inicializar ao carregar página - APENAS PARA ALUNOS
document.addEventListener('DOMContentLoaded', () => {
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados') || '{}');
    
    if (usuarioDados.tipo_perfil === 'aluno' && document.getElementById('pagamentos-table-body')) {
        gerenciadorPagamentos = new GerenciadorPagamentosAluno();
    }
});
