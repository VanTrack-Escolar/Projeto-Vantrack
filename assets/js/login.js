document.addEventListener('DOMContentLoaded',()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get('session_expired')==='true'){
        mostrarNotificacao('Sua sessão expirou. Faça login novamente.','aviso',4000);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    const reportStr = localStorage.getItem('sessao_debug_report');
    if(reportStr){
        try{
            const report = JSON.parse(reportStr);
            mostrarNotificacao(`Diagnóstico: Token=${report.token} | Usuário=${report.usuario} | Chaves=${report.localStorageKeys.join(',')}`,'erro',10000);
            localStorage.removeItem('sessao_debug_report');
        }catch(err){}
    }
    const fL=document.getElementById('form-login'), fRS=document.getElementById('form-recuperar-senha');
    const dH=document.querySelector('.dropdown-header'), dL=document.getElementById('dropdown-perfil-list'), dI=document.querySelectorAll('.dropdown-item');
    if(fL) fL.addEventListener('submit',handleLogin);
    if(fRS) fRS.addEventListener('submit',handleRecuperarSenha);
    document.querySelectorAll('.toggle-senha').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('i');
            if (input) {
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                if (icon) {
                    icon.classList.toggle('fa-eye');
                    icon.classList.toggle('fa-eye-slash');
                }
            }
        });
    });
    if(dH){
        dH.addEventListener('click',e=>{e.stopPropagation();dL.style.display=dL.style.display==='none'?'block':'none';dH.classList.toggle('open');});
        dI.forEach(item=>item.addEventListener('click',e=>{e.stopPropagation();const v=item.getAttribute('data-value');document.getElementById('perfil').value=v;document.getElementById('perfil-display').textContent=item.textContent;dL.style.display='none';dH.classList.remove('open');dH.classList.remove('is-placeholder');dI.forEach(it=>it.classList.remove('selected'));item.classList.add('selected');}));
        document.addEventListener('click',()=>{dL.style.display='none';dH.classList.remove('open');});
    }
    document.querySelectorAll('.msg-erro').forEach(m=>m.remove());
});

async function handleLogin(e){
    e.preventDefault();
    const email=document.getElementById('email').value.trim(), senha=document.getElementById('senha').value;
    if(!email||!validarEmail(email)){mostrarNotificacao('Email inválido','erro');return;}
    if(!senha||!validarSenha(senha).valido){mostrarNotificacao('Senha inválida','erro');return;}
    if(!document.getElementById('perfil').value){mostrarNotificacao('Selecione um perfil','erro');return;}
    const b=this.querySelector('button[type="submit"]');b.disabled=true;b.textContent='Entrando...';
    try{
        const r=await fetchAPI('POST',CONFIG.ENDPOINTS.LOGIN,{email:email,senha:senha});
        if(r){
            // Verificar se requer 2FA
            if(r.requer_2fa && r.dois_fatores_id){
                // Novo dispositivo ou conta protegida - guardar dados na sessão e redirecionar para 2FA
                const dados2FA={
                    dois_fatores_id:r.dois_fatores_id,
                    usuario_id:r.usuario_id,
                    metodo:r.metodo,
                    telefone_mascarado:r.telefone_mascarado,
                    email_mascarado:r.email_mascarado,
                    temp_token:r.temp_token,
                    usuario_dados:r.usuario
                };
                sessionStorage.setItem('dados_2fa',JSON.stringify(dados2FA));
                mostrarNotificacao('Autenticação em Dois Fatores exigida. Aguarde...','info',1500);
                setTimeout(()=>window.location.href='/pages/2fa.html',1000);
            }else if(r.token){
                // Dispositivo conhecido - login normal
                setToken(r.token);setUser(r.usuario);mostrarNotificacao('Login OK!','sucesso',1500);
                setTimeout(()=>{
                    const perfil=r.usuario.tipo_perfil;
                    if(perfil==='motorista'){
                        window.location.href='/pages/dashboard-motorista.html';
                    }else{
                        window.location.href='/pages/dashboard-aluno.html';
                    }
                },1000);
            }
        }
    }catch(e){mostrarNotificacao(e.message||'Erro login','erro');}finally{b.disabled=false;b.textContent='Entrar';}
}

async function handleRecuperarSenha(e){
    e.preventDefault();
    if(!validarFormulario(this)){mostrarNotificacao('Corrija os erros','erro');return;}
    const b=this.querySelector('button[type="submit"]');b.disabled=true;b.textContent='Enviando...';
    
    // Simular envio de e-mail de recuperação
    setTimeout(() => {
        mostrarNotificacao('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.','sucesso',3000);
        setTimeout(() => {
            window.location.href='/pages/index.html';
        }, 2000);
    }, 1000);
}
