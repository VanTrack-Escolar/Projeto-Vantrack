CREATE DATABASE IF NOT EXISTS vantrack;
USE vantrack;

CREATE TABLE usuarios (
  id CHAR(36) PRIMARY KEY,
  tipo_perfil VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  sobrenome VARCHAR(100) NOT NULL,
  cpf VARCHAR(11) UNIQUE NOT NULL,
  email VARCHAR(254) UNIQUE NOT NULL,
  telefone VARCHAR(11) NOT NULL,
  cidade VARCHAR(100) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);
CREATE INDEX idx_usuarios_tipo_perfil ON usuarios(tipo_perfil);

CREATE TABLE sessoes (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  revogado_em DATETIME NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_sessoes_usuario_id ON sessoes(usuario_id);
CREATE INDEX idx_sessoes_token_hash ON sessoes(token_hash);

CREATE TABLE veiculos (
  id CHAR(36) PRIMARY KEY,
  motorista_id CHAR(36) NOT NULL,
  placa VARCHAR(8) UNIQUE NOT NULL,
  modelo VARCHAR(100) NOT NULL,
  ano INT NOT NULL,
  capacidade_passageiros INT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_veiculos_motorista_id ON veiculos(motorista_id);
CREATE INDEX idx_veiculos_placa ON veiculos(placa);

CREATE TABLE rotas (
  id CHAR(36) PRIMARY KEY,
  motorista_id CHAR(36) NOT NULL,
  veiculo_id CHAR(36),
  titulo VARCHAR(255) NOT NULL,
  local_saida VARCHAR(255) NOT NULL,
  local_chegada VARCHAR(255) NOT NULL,
  horario_saida TIME NOT NULL,
  horario_chegada TIME,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id),
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);
CREATE INDEX idx_rotas_motorista_id ON rotas(motorista_id);
CREATE INDEX idx_rotas_veiculo_id ON rotas(veiculo_id);

CREATE TABLE inscricoes (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  rota_id CHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(aluno_id, rota_id),
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id)
);
CREATE INDEX idx_inscricoes_aluno_id ON inscricoes(aluno_id);
CREATE INDEX idx_inscricoes_rota_id ON inscricoes(rota_id);

CREATE TABLE localizacoes_gps (
  id CHAR(36) PRIMARY KEY,
  veiculo_id CHAR(36) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  velocidade DECIMAL(6, 2),
  direcao DECIMAL(3, 0),
  precisao DECIMAL(6, 2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
);
CREATE INDEX idx_localizacoes_veiculo_id ON localizacoes_gps(veiculo_id);
CREATE INDEX idx_localizacoes_timestamp ON localizacoes_gps(timestamp);

CREATE TABLE enderecos (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  rota_id CHAR(36) NOT NULL,
  endereco_coleta VARCHAR(500) NOT NULL,
  endereco_entrega VARCHAR(500) NOT NULL,
  latitude_coleta DECIMAL(10, 8),
  longitude_coleta DECIMAL(11, 8),
  latitude_entrega DECIMAL(10, 8),
  longitude_entrega DECIMAL(11, 8),
  principal BOOLEAN DEFAULT true,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id)
);
CREATE INDEX idx_enderecos_aluno_id ON enderecos(aluno_id);
CREATE INDEX idx_enderecos_rota_id ON enderecos(rota_id);

CREATE TABLE presenca_diaria (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  rota_id CHAR(36) NOT NULL,
  data DATE NOT NULL,
  vai_embarcar BOOLEAN NOT NULL DEFAULT true,
  confirmado_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(aluno_id, rota_id, data),
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id)
);
CREATE INDEX idx_presenca_diaria_aluno_id ON presenca_diaria(aluno_id);
CREATE INDEX idx_presenca_diaria_rota_id ON presenca_diaria(rota_id);
CREATE INDEX idx_presenca_diaria_data ON presenca_diaria(data);

CREATE TABLE mensagens_chat (
  id CHAR(36) PRIMARY KEY,
  remetente_id CHAR(36) NOT NULL,
  destinatario_id CHAR(36) NOT NULL,
  texto TEXT NOT NULL,
  lido BOOLEAN DEFAULT false,
  lido_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (remetente_id) REFERENCES usuarios(id),
  FOREIGN KEY (destinatario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_mensagens_chat_remetente_id ON mensagens_chat(remetente_id);
CREATE INDEX idx_mensagens_chat_destinatario_id ON mensagens_chat(destinatario_id);
CREATE INDEX idx_mensagens_chat_criado_em ON mensagens_chat(criado_em);

CREATE TABLE dois_fatores (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  dispositivo_hash VARCHAR(255) NOT NULL,
  codigo_2fa VARCHAR(6) NOT NULL,
  metodo VARCHAR(10) NOT NULL,
  telefone_sms VARCHAR(11),
  email_envio VARCHAR(254),
  verificado BOOLEAN DEFAULT false,
  tentativas_restantes INT DEFAULT 3,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expira_em DATETIME NOT NULL,
  verificado_em DATETIME NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_dois_fatores_usuario_id ON dois_fatores(usuario_id);
CREATE INDEX idx_dois_fatores_dispositivo_hash ON dois_fatores(dispositivo_hash);
CREATE INDEX idx_dois_fatores_expira_em ON dois_fatores(expira_em);

CREATE TABLE pagamentos (
  id CHAR(36) PRIMARY KEY,
  aluno_id CHAR(36) NOT NULL,
  motorista_id CHAR(36) NOT NULL,
  rota_id CHAR(36) NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  mes_referencia INT NOT NULL,
  ano_referencia INT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pendente',
  data_vencimento DATE NOT NULL,
  data_pagamento DATETIME NULL,
  metodo_pagamento VARCHAR(50),
  descricao VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (aluno_id) REFERENCES usuarios(id),
  FOREIGN KEY (motorista_id) REFERENCES usuarios(id),
  FOREIGN KEY (rota_id) REFERENCES rotas(id),
  UNIQUE(aluno_id, motorista_id, rota_id, mes_referencia, ano_referencia)
);
CREATE INDEX idx_pagamentos_aluno_id ON pagamentos(aluno_id);
CREATE INDEX idx_pagamentos_motorista_id ON pagamentos(motorista_id);
CREATE INDEX idx_pagamentos_rota_id ON pagamentos(rota_id);
CREATE INDEX idx_pagamentos_status ON pagamentos(status);
CREATE INDEX idx_pagamentos_data_pagamento ON pagamentos(data_pagamento);

CREATE TABLE chamados (
  id CHAR(36) PRIMARY KEY,
  usuario_id CHAR(36) NOT NULL,
  assunto VARCHAR(150) NOT NULL,
  descricao TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'aberto',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
CREATE INDEX idx_chamados_usuario_id ON chamados(usuario_id);
CREATE INDEX idx_chamados_status ON chamados(status);

