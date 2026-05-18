let tentativasRestantes = 3;
let timerReenvio = 0;
let timerId = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializar2FA();
  setupCodigoInput();
  setupFormulario();
});

function inicializar2FA() {
  const dados2FA = JSON.parse(sessionStorage.getItem('dados_2fa'));
  
  if (!dados2FA) {
    // Sem dados 2FA na sessão, volta ao login
    window.location.href = '../index.html';
    return;
  }

  // Exibir informações do envio
  const metodoEnvio = document.getElementById('metodo-envio');
  const detalhesEnvio = document.getElementById('detalhes-envio');
  
  metodoEnvio.textContent = dados2FA.metodo === 'SMS' ? 'celular' : 'email';
  
  if (dados2FA.metodo === 'SMS' && dados2FA.telefone_mascarado) {
    detalhesEnvio.textContent = `Telefone: ${dados2FA.telefone_mascarado}`;
  } else if (dados2FA.metodo === 'EMAIL' && dados2FA.email_mascarado) {
    detalhesEnvio.textContent = `Email: ${dados2FA.email_mascarado}`;
  }

  // Tentar enviar código se ainda não foi enviado
  if (!dados2FA.codigo_enviado) {
    enviarCodigo2FA();
    dados2FA.codigo_enviado = true;
    sessionStorage.setItem('dados_2fa', JSON.stringify(dados2FA));
  }

  // Iniciar timer para reenvio
  iniciarTimerReenvio();
}

function setupCodigoInput() {
  const digitos = document.querySelectorAll('.digito');
  
  digitos.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && /[0-9]/.test(e.target.value)) {
        e.target.value = e.target.value[0];
        
        // Auto-focus próximo campo
        if (index < digitos.length - 1) {
          digitos[index + 1].focus();
        } else {
          // Último dígito - verificar código automaticamente
          verificarCodigoAutomatico();
        }
      } else {
        e.target.value = '';
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && index > 0) {
        digitos[index - 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const texto = (e.clipboardData || window.clipboardData).getData('text');
      const numeros = texto.replace(/[^0-9]/g, '');
      
      if (numeros.length === 6) {
        numeros.split('').forEach((num, i) => {
          if (i < digitos.length) {
            digitos[i].value = num;
          }
        });
        verificarCodigoAutomatico();
      }
    });
  });
}

function setupFormulario() {
  const form = document.getElementById('form-2fa');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    verificarCodigo();
  });
}

function verificarCodigoAutomatico() {
  const digitos = document.querySelectorAll('.digito');
  const codigoCompleto = Array.from(digitos).every(d => d.value);
  
  if (codigoCompleto) {
    setTimeout(verificarCodigo, 300);
  }
}

async function verificarCodigo() {
  const digitos = document.querySelectorAll('.digito');
  const codigo = Array.from(digitos).map(d => d.value).join('');

  if (codigo.length !== 6 || !codigo.match(/^[0-9]{6}$/)) {
    mostrarNotificacao('Por favor, insira um código válido de 6 dígitos', 'erro');
    return;
  }

  const dados2FA = JSON.parse(sessionStorage.getItem('dados_2fa'));
  
  const btnText = document.getElementById('btn-text');
  const btnSpinner = document.getElementById('btn-spinner');
  const btnSubmit = document.querySelector('button[type="submit"]');

  btnText.style.display = 'none';
  btnSpinner.style.display = 'inline-block';
  btnSubmit.disabled = true;

  try {
    const response = await fetch(`${CONFIG.API_URL}/dois-fatores/verificar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usuario_id: dados2FA.usuario_id,
        codigo: codigo
      })
    });

    const resultado = await response.json();

    if (response.ok && resultado.status === 'verificado' && resultado.token) {
      // Salvar JWT final
      setToken(resultado.token);
      
      // Limpar sessão temporária
      sessionStorage.removeItem('dados_2fa');

      mostrarNotificacao('Código verificado! Entrando...', 'sucesso', 1500);

      setTimeout(() => {
          // Redirecionar para dashboard
          const perfil = dados2FA.usuario_dados.tipo_perfil;
          if (perfil === 'motorista') {
            window.location.href = '/pages/dashboard-motorista.html';
          } else {
            window.location.href = '/pages/dashboard-aluno.html';
          }
      }, 1000);
    } else {
      const tentativasRestantes = resultado.tentativas_restantes || window.tentativasRestantes;
      atualizarTentativas(tentativasRestantes);
      
      if (tentativasRestantes <= 0) {
        mostrarNotificacao('Número máximo de tentativas atingido. Faça login novamente.', 'erro', 2000);
        setTimeout(() => window.location.href = '/pages/index.html', 1500);
      } else {
        mostrarNotificacao(`Código inválido! ${resultado.erro || 'Tente novamente.'}`, 'erro');
        limparCodigo();
      }
    }
  } catch (erro) {
    console.error('Erro ao verificar código:', erro);
    mostrarNotificacao('Erro ao verificar código. Tente novamente.', 'erro');
  } finally {
    btnText.style.display = 'inline';
    btnSpinner.style.display = 'none';
    btnSubmit.disabled = false;
  }
}

async function enviarCodigo2FA() {
  const dados2FA = JSON.parse(sessionStorage.getItem('dados_2fa'));
  
  try {
    const response = await fetch(
      `${CONFIG.API_URL}/dois-fatores/enviar/${dados2FA.dois_fatores_id}`,
      { method: 'POST' }
    );

    if (!response.ok) {
      console.warn('Falha ao enviar código automaticamente');
    }
  } catch (erro) {
    console.error('Erro ao enviar código:', erro);
  }
}

async function reenviarCodigo() {
  if (timerReenvio > 0) return;

  const dados2FA = JSON.parse(sessionStorage.getItem('dados_2fa'));
  
  try {
    const btnReenviar = document.getElementById('btn-reenviar');
    btnReenviar.disabled = true;

    const response = await fetch(
      `${CONFIG.API_URL}/dois-fatores/reenviar/${dados2FA.dois_fatores_id}`,
      { method: 'POST' }
    );

    if (response.ok) {
      mostrarNotificacao('Código reenviado com sucesso!', 'sucesso');
      limparCodigo();
      iniciarTimerReenvio();
    } else {
      const erro = await response.json();
      mostrarNotificacao(`Erro ao reenviar: ${erro.erro || 'Tente novamente mais tarde'}`, 'erro');
    }
  } catch (erro) {
    console.error('Erro ao reenviar código:', erro);
    mostrarNotificacao('Erro ao reenviar código. Tente novamente.', 'erro');
  }
}

function iniciarTimerReenvio() {
  timerReenvio = 60;
  const btnReenviar = document.getElementById('btn-reenviar');
  const timerText = document.getElementById('timer-text');
  const timerSegundos = document.getElementById('timer-segundos');

  btnReenviar.style.display = 'none';
  timerText.style.display = 'inline';

  timerId = setInterval(() => {
    timerReenvio--;
    timerSegundos.textContent = timerReenvio;

    if (timerReenvio <= 0) {
      clearInterval(timerId);
      btnReenviar.style.display = 'inline';
      btnReenviar.disabled = false;
      timerText.style.display = 'none';
    }
  }, 1000);
}

function atualizarTentativas(tentativas) {
  tentativasRestantes = tentativas;
  const tentativasInfo = document.getElementById('tentativas-info');

  if (tentativas > 0) {
    tentativasInfo.textContent = `Tentativas restantes: ${tentativas}`;
    if (tentativas <= 1) {
      tentativasInfo.classList.add('aviso');
    }
  } else {
    tentativasInfo.textContent = 'Nenhuma tentativa restante';
    tentativasInfo.classList.add('aviso');
  }
}

function limparCodigo() {
  document.querySelectorAll('.digito').forEach(input => {
    input.value = '';
  });
  document.querySelector('.digito').focus();
}
