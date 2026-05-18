// 1. Mostrar / esconder senha dinâmico (Funciona para Aluno e Motorista)
const botoesToggle = document.querySelectorAll(".toggle-senha");

botoesToggle.forEach(botao => {
    botao.addEventListener("click", function() {
        const container = this.closest('.input-group') || this.parentElement;
        const campoSenha = container.querySelector('input[type="password"], input[type="text"]');
        const iconeSenha = this.querySelector('.material-icons') || this;

        if (campoSenha) {
            if (campoSenha.type === "password") {
                campoSenha.type = "text";
                iconeSenha.textContent = "visibility_off";
            } else {
                campoSenha.type = "password";
                iconeSenha.textContent = "visibility";
            }
        }
    });
});

// 2. Integração REAL com o Banco de Dados (Python/MySQL)
const formCadastro = document.getElementById("form-cadastro");

if (formCadastro) {
    formCadastro.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const btnSubmit = formCadastro.querySelector('button[type="submit"]');
        const textoOriginal = btnSubmit.innerHTML;
        btnSubmit.innerHTML = "Cadastrando...";
        btnSubmit.disabled = true;

        try {
            const nome = document.getElementById("nome").value.trim();
            const sobrenome = document.getElementById("sobrenome").value.trim();
            const cpf = document.getElementById("cpf").value.replace(/\D/g, ''); 
            const telefone = document.getElementById("telefone").value.replace(/\D/g, '');
            const cidade = document.getElementById("cidade").value.trim();
            const email = document.getElementById("email").value.trim();
            const senha = document.getElementById("senha").value;

            // VALIDAÇÃO FRONTEND: Impede envio de campos vazios
            if (!nome || !sobrenome || !cpf || !telefone || !cidade || !email || !senha) {
                throw new Error("Por favor, preencha todos os campos obrigatórios.");
            }

            let tipoPerfil = "aluno";
            if (window.location.pathname.includes("motorista")) {
                tipoPerfil = "motorista";
            }

            const payload = {
                nome: `${nome} ${sobrenome}`,
                cpf: cpf,
                email: email,
                telefone: telefone,
                cidade: cidade,
                senha: senha,
                tipo_perfil: tipoPerfil
            };

            // Enviar para o endpoint de cadastro no backend
            const resposta = await fetchAPI('POST', CONFIG.ENDPOINTS.CADASTRO, payload);

            mostrarNotificacao('Cadastro realizado com sucesso! Redirecionando...', 'sucesso');
            
            setTimeout(() => {
                window.location.href = '/pages/index.html';
            }, 2000);

        } catch (erro) {
            console.error("Erro no cadastro:", erro);
            mostrarNotificacao(erro.message || "Erro ao realizar cadastro. Verifique os dados.", "erro");
        } finally {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        }
    });
}
