#!/usr/bin/env python3
"""
Script para inicializar o banco de dados MySQL com o schema
"""
import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('.env')

DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'vantrack')
DB_PORT = int(os.getenv('DB_PORT', 3306))

def setup_database():
    """Cria o banco de dados e executa o schema"""
    
    try:
        # Conectar sem banco de dados específico
        print(f"Conectando ao MySQL em {DB_HOST}:{DB_PORT}...")
        connection = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            port=DB_PORT
        )
        
        if connection.is_connected():
            print("✓ Conectado ao MySQL com sucesso!")
            
            cursor = connection.cursor()
            
            # Ler schema.sql
            schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
            if not os.path.exists(schema_path):
                schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            print(f"\nLendo schema de: {schema_path}")
            
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_content = f.read()
            
            # Executar cada statement do schema
            print("\n🔄 Executando schema SQL...")
            statements = schema_content.split(';')
            
            executed_count = 0
            skipped_count = 0
            for statement in statements:
                statement = statement.strip()
                if statement:
                    try:
                        cursor.execute(statement)
                        executed_count += 1
                        # print(f"  ✓ {statement[:60]}...")
                    except Error as e:
                        # Ignorar erro de tabela já existente
                        if "already exists" in str(e):
                            skipped_count += 1
                        else:
                            print(f"  ✗ Erro ao executar: {statement[:50]}...")
                            print(f"    {e}")
            
            connection.commit()
            print(f"✓ Schema executado com sucesso! ({executed_count} statements, {skipped_count} já existentes)")
            
            # Verificar se banco foi criado
            cursor.execute("SHOW DATABASES LIKE 'vantrack'")
            result = cursor.fetchone()
            if result:
                print(f"✓ Banco de dados '{DB_NAME}' criado/verificado")
            
            # Verificar tabelas
            cursor.execute(f"USE {DB_NAME}")
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print(f"✓ Total de tabelas: {len(tables)}")
            for table in tables:
                print(f"  • {table[0]}")
            
            cursor.close()
            connection.close()
            
            return True
        
    except Error as e:
        print(f"✗ Erro na conexão MySQL: {e}")
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("SETUP DO BANCO DE DADOS VANTRACK (MySQL)")
    print("=" * 60)
    print(f"\nConfigurações:")
    print(f"  Host: {DB_HOST}")
    print(f"  Port: {DB_PORT}")
    print(f"  User: {DB_USER}")
    print(f"  Database: {DB_NAME}")
    print()
    
    success = setup_database()
    
    print("\n" + "=" * 60)
    if success:
        print("✓ SETUP CONCLUÍDO COM SUCESSO!")
        print("  O banco de dados está pronto para uso.")
    else:
        print("✗ ERRO NO SETUP")
        print("  Verifique a conexão MySQL e as credenciais.")
    print("=" * 60)
