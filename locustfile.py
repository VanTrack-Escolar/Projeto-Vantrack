# Instruções:
# 1. Instale o locust: pip install locust
# 2. Execute o teste: locust -f locustfile.py
# 3. Acesse http://localhost:8089 para iniciar o Teste de Carga

from locust import HttpUser, task, between

class VantrackLoadTest(HttpUser):
    # Simula o utilizador esperando de 1 a 3 segundos entre tarefas
    wait_time = between(1, 3)

    def on_start(self):
        """ Executado no início de cada utilizador simulado """
        pass

    @task(1)
    def testar_rota_publica(self):
        """ Testa o endpoint que devolve falha/redirecionamento se não logado """
        self.client.get("/api/")

    @task(3)
    def testar_tentativa_login(self):
        """ 
        Testa o rate limiter disparando muitas requisições de login falhadas 
        """
        response = self.client.post("/api/login", json={
            "email": "email_falso_teste_carga@teste.com",
            "senha": "123"
        })
        
        # Validar se o Rate Limit está a responder corretamente (429 Too Many Requests)
        if response.status_code == 429:
            response.success()
