document.addEventListener('DOMContentLoaded',()=>{
    const params=new URLSearchParams(window.location.search);
    if(params.get('session_expired')==='true'){
        mostrarNotificacao('Sua sessão expirou. Faça login novamente.','aviso',4000);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    const fL=document.getElementById('form-login'), fRS=document.getElementById('form-recuperar-senha'), bTS=document.querySelector('.toggle-senha');
    const dH=document.querySelector('.dropdown-header'), dL=document.getElementById('dropdown-perfil-list'), dI=document.querySelectorAll('.dropdown-item');
    if(fL) fL.addEventListener('submit',handleLogin);
    if(fRS) fRS.addEventListener('submit',handleRecuperarSenha);
    if(bTS) bTS.addEventListener('click',e=>{e.preventDefault();const i=document.getElementById('senha'),ic=e.target.closest('.toggle-senha').querySelector('i');i.type=i.type==='password'?'text':'password';ic.classList.toggle('fa-eye');ic.classList.toggle('fa-eye-slash');});
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
    try{
        const r=await fetchAPI('POST','/recuperar-senha',{email:document.getElementById('email-recuperar').value.trim(),nova_senha:document.getElementById('nova-senha').value});
        if(r){mostrarNotificacao('Senha atualizada!','sucesso',1500);setTimeout(()=>window.location.href='/pages/index.html',1000);}
    }catch(e){mostrarNotificacao(e.message||'Erro','erro');}finally{b.disabled=false;b.textContent='Recuperar';}
}
