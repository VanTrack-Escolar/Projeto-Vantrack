document.addEventListener('DOMContentLoaded', () => {
    const usuarioDados = JSON.parse(localStorage.getItem('usuario_dados') || '{}');
    const btnVoltar = document.getElementById('btn-voltar-dashboard');

    if (btnVoltar) {
        btnVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            if (usuarioDados.tipo_perfil === 'motorista') {
                window.location.href = '/pages/dashboard-motorista.html';
            } else if (usuarioDados.tipo_perfil === 'admin') {
                window.location.href = '/pages/dashboard-admin.html';
            } else {
                window.location.href = '/pages/dashboard-aluno.html';
            }
        });
    }
});
