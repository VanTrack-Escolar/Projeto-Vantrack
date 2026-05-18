document.addEventListener('DOMContentLoaded',()=>{
    console.log('[DOMContentLoaded] Inicializando...');
    const fCA=document.getElementById('form-cadastro-aluno'),fCM=document.getElementById('form-cadastro-motorista');
    
    console.log(`[FORMS] Aluno: ${fCA?'✓':'✗'}, Motorista: ${fCM?'✓':'✗'}`);
    
    if(fCA) fCA.addEventListener('submit',e=>handleCadastro(e,'aluno'));
    if(fCM) fCM.addEventListener('submit',e=>handleCadastro(e,'motorista'));
    
    document.querySelectorAll('input[data-validar]').forEach(i=>{
        i.addEventListener('blur',()=>{
            console.log(`[BLUR] ${i.id} validando...`);
            validarFormulario(i.form);
        });
    });
    
    document.getElementById('cpf')?.addEventListener('input',aplicarMascaraCPF);
    document.getElementById('telefone')?.addEventListener('input',aplicarMascaraTelefone);
    
    // Toggle de senha - cadastro
    document.querySelectorAll('.toggle-senha').forEach(btn=>{
        btn.addEventListener('click',e=>{
            e.preventDefault();
            const input=btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon=btn.querySelector('i');
            if(input){
                const isPassword=input.type==='password';
                input.type=isPassword?'text':'password';
                icon?.classList.toggle('fa-eye');
                icon?.classList.toggle('fa-eye-slash');
                console.log(`[TOGGLE] Senha ${isPassword?'visível':'ocultada'}`);
            }
        });
    });
});

function aplicarMascaraCPF(e){
    let v=e.target.value.replace(/\D/g,'');
    if(v.length>11)v=v.substring(0,11);
    if(v.length>9)v=v.substring(0,3)+'.'+v.substring(3,6)+'.'+v.substring(6,9)+'-'+v.substring(9);
    else if(v.length>6)v=v.substring(0,3)+'.'+v.substring(3,6)+'.'+v.substring(6);
    else if(v.length>3)v=v.substring(0,3)+'.'+v.substring(3);
    e.target.value=v;
}

function aplicarMascaraTelefone(e){
    let v=e.target.value.replace(/\D/g,'');
    if(v.length>11)v=v.substring(0,11);
    if(v.length>6)v='('+v.substring(0,2)+') '+v.substring(2,7)+'-'+v.substring(7);
    else if(v.length>2)v='('+v.substring(0,2)+') '+v.substring(2);
    e.target.value=v;
}

async function handleCadastro(e,tp){
    e.preventDefault();
    console.log(`\n[CADASTRO] ======== INICIANDO CADASTRO ${tp.toUpperCase()} ========`);
    
    const f=e.target;
    
    // Validar formulário
    if(!validarFormulario(f)){
        console.log('[CADASTRO] ✗ Validação FALHOU - campos com erro');
        mostrarNotificacao('Por favor, preencha todos os campos corretamente','erro');
        return;
    }
    console.log('[CADASTRO] ✓ Validação passou');
    
    // Validar senhas
    const s=document.getElementById('senha').value,cs=document.getElementById('confirmar-senha').value;
    if(s!==cs){
        console.log('[CADASTRO] ✗ Senhas não conferem');
        mostrarNotificacao('Senhas não conferem','erro');
        return;
    }
    console.log('[CADASTRO] ✓ Senhas conferem');
    
    // Preparar dados - REMOVER MÁSCARAS
    const cpfSemMascara=document.getElementById('cpf').value.replace(/\D/g,'');
    const telefoneSemMascara=document.getElementById('telefone').value.replace(/\D/g,'');
    const nome=document.getElementById('nome').value.trim();
    const email=document.getElementById('email').value.trim();
    const cidade=document.getElementById('cidade').value.trim();
    
    console.log('[CADASTRO] Dados coletados:');
    console.log(`  Nome: ${nome}`);
    console.log(`  Email: ${email}`);
    console.log(`  CPF: ${cpfSemMascara} (${cpfSemMascara.length} dígitos)`);
    console.log(`  Telefone: ${telefoneSemMascara} (${telefoneSemMascara.length} dígitos)`);
    console.log(`  Cidade: ${cidade}`);
    console.log(`  Tipo: ${tp}`);
    
    const b=f.querySelector('button[type="submit"]');
    b.disabled=true;
    b.textContent='Cadastrando...';
    
    try{
        const payload={
            email: email,
            cpf: cpfSemMascara,
            nome: nome,
            telefone: telefoneSemMascara,
            cidade: cidade,
            tipo_perfil: tp,
            senha: s
        };
        
        console.log('[CADASTRO] Enviando payload para ' + CONFIG.ENDPOINTS.CADASTRO + ':', payload);
        
        const r=await fetchAPI('POST',CONFIG.ENDPOINTS.CADASTRO,payload);
        
        console.log('[CADASTRO] Resposta recebida:', r);
        
        if(r&&r.id){
            console.log('[CADASTRO] ✓ SUCESSO! ID:', r.id);
            mostrarNotificacao('✓ Cadastro realizado com sucesso! Redirecionando...','sucesso',2000);
            setTimeout(()=>{
                console.log('[CADASTRO] Redirecionando para /pages/index.html');
                window.location.href='/pages/index.html';
            },2000);
        }else{
            console.log('[CADASTRO] ✗ Resposta inválida:', r);
            mostrarNotificacao(r?.erro || 'Erro ao cadastrar','erro');
        }
    }catch(e){
        console.error('[CADASTRO] ✗ ERRO:', e);
        mostrarNotificacao(e.message||'Erro ao cadastrar','erro');
    }finally{
        b.disabled=false;
        b.textContent=tp==='aluno'?'Cadastrar como Aluno':'Cadastrar como Motorista';
        console.log('[CADASTRO] ======== FIM CADASTRO ========\n');
    }
}
