# Usa uma imagem Python leve oficial
FROM python:3.9-slim

# Evita que o Python grave arquivos .pyc e força o log em tempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Define diretório de trabalho
WORKDIR /app

# Instala dependências do sistema necessárias para mysqlclient e compilações
RUN apt-get update && apt-get install -y \
    pkg-config \
    libmariadb-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependência primeiro para otimizar o cache do Docker
COPY requirements.txt .

# Instala dependências Python, adicionando o gunicorn e eventlet para produção
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn eventlet

# Copia o restante do código
COPY . .

# Expõe a porta do Flask
EXPOSE 5000

# Inicializa usando Gunicorn com o eventlet worker para suportar WebSockets
CMD ["gunicorn", "--worker-class", "eventlet", "-w", "1", "--bind", "0.0.0.0:5000", "app:app"]
