# finza 🪙

Sistema de controle financeiro via WhatsApp com dashboard web.

## Setup do Banco de Dados

### 1. Clone e configure o ambiente

```bash
cp .env.example .env
# edite .env com suas credenciais
```

### 2. Suba o PostgreSQL com Docker

```bash
docker compose up -d
```

O Docker vai automaticamente executar os arquivos em `db/migrations/` em ordem alfabética na primeira inicialização.

### 3. Verifique se o banco subiu corretamente

```bash
docker compose ps
# finza-db deve estar "healthy"

docker exec -it finza-db psql -U finza -d finza -c "\dt"
# deve listar: cartoes, categorias, gastos, users
```

### 4. Acesse o banco diretamente (opcional)

```bash
docker exec -it finza-db psql -U finza -d finza
```

### Comandos úteis

```bash
# parar o banco
docker compose stop

# destruir tudo (inclusive dados)
docker compose down -v

# ver logs
docker compose logs -f postgres

# resetar banco (apaga dados e recria)
docker compose down -v && docker compose up -d
```

## Estrutura do banco

```
users           → usuários do sistema
cartoes         → cartões cadastrados por usuário
categorias      → categorias de gastos por usuário
gastos          → registro de cada gasto

Views:
  vw_gastos_por_categoria  → total por categoria/mês
  vw_faturas_mes_atual     → fatura atual de cada cartão
  vw_gastos_por_forma      → total por forma de pagamento/mês
```