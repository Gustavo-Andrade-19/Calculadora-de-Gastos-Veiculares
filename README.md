# Calculadora de Gastos com Combustível

Aplicação web full-stack para calcular gastos de combustível em viagens, com autenticação de usuário, histórico persistente e mapa interativo.

##  Características

-  **Cálculo de Gastos** - Calcula litros e custo total baseado em consumo e distância
-  **Mapa Interativo** - Integrado com Leaflet e Nominatim para geolocalização
-  **Autenticação** - Login/Registro com JWT e senha encriptada (bcryptjs)
-  **Histórico Persistente** - Cada usuário vê apenas seus próprios cálculos
-  **Dark Mode** - Tema claro/escuro com preferência salva
-  **Orçamento de Viagem** - Cálculos com manutenção (2x) e lucro (30%)
-  **Responsivo** - Funciona em desktop, tablet e mobile

##  Screenshots

### Cálculo de Gastos - Desktop
![Cálculo de Gastos](.github/images/calc-desktop.png)

### Mapa Interativo
![Mapa com Rota](.github/images/mapa.png)

### Histórico de Viagens
![Histórico](.github/images/historico.png)

### Autenticação
![Login/Registro](.github/images/login.png)

### Dark Mode
![Dark Mode](.github/images/dark-mode.png)

### Mobile Responsivo
![Mobile](.github/images/calc-mobile.png)

##  Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript Vanilla
- Leaflet.js v1.9.4 (mapas)
- Leaflet Routing Machine (rotas)

**Backend:**
- Node.js + Express.js
- sql.js (SQLite em memória)
- bcryptjs (hashing de senhas)
- jsonwebtoken (JWT)
- CORS habilitado

##  Instalação

### Pré-requisitos
- Node.js v16+
- npm ou yarn

### Setup Local

1. **Clone o repositório**
```bash
git clone https://github.com/Gustavo-Andrade-19/Calcular-Gasto-Veiculo.git
cd Calcular-Gasto-Veiculo
```

2. **Instale dependências do backend**
```bash
cd backend
npm install
```

3. **Crie arquivo .env**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

4. **Inicie o servidor backend**
```bash
npm start
# Ou: node server.js
```
Servidor rodará em: `http://localhost:3000`

5. **Abra o frontend**
```bash
# Opção 1: Servir com Python
cd ..
python -m http.server 8000

# Opção 2: Usar qualquer servidor HTTP
# Acesse em: http://localhost:8000
```

##  Autenticação

### Fluxo de Login
1. Usuário registra com email + senha
2. Senha é hasheada com bcryptjs (10 rounds)
3. No login, JWT é gerado (válido por 24h)
4. Token salvo em localStorage
5. Requisições para `/historico` e `/salvar-calculo` requerem token

### Rotas Protegidas
- `GET /historico` - Requer JWT
- `POST /salvar-calculo` - Requer JWT

### Rotas Públicas
- `GET /teste` - Health check
- `POST /registrar` - Novo usuário
- `POST /login` - Gera token
- `POST /calcular` - Calcula gasto
- `GET /geocodificar` - Busca endereço

##  Estrutura do Banco de Dados

### Tabela: usuarios
```
id (INTEGER PRIMARY KEY)
email (TEXT UNIQUE)
senha_hash (TEXT)
dataCriacao (DATETIME)
```

### Tabela: historico
```
id (INTEGER PRIMARY KEY)
user_id (INTEGER FK → usuarios.id)
origem (TEXT)
destino (TEXT)
distancia (REAL)
kmLitro (REAL)
precoCombustivel (REAL)
litrosNecessarios (REAL)
custoTotal (REAL)
dataCriacao (DATETIME)
```

##  Deploy no Render.com

### Configurar para Produção

1. **Atualize package.json com start script**
```json
"scripts": {
  "start": "node server.js",
  "dev": "node server.js"
}
```

2. **Deploy no Render**
   - Conecte seu repositório GitHub
   - Type: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `NODE_ENV`: production
     - `JWT_SECRET`: [gere uma chave segura]
     - `PORT`: 3000

3. **Configurar CORS**
   - Frontend URL do Render: `https://seu-app.onrender.com`
   - Atualize `CORS_ORIGIN` no backend

##  Testando com cURL

```bash
# Health check
curl http://localhost:3000/teste

# Registrar usuário
curl -X POST http://localhost:3000/registrar \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","senha":"senha123"}'

# Login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","senha":"senha123"}'

# Ver histórico (com token)
curl http://localhost:3000/historico \
  -H "Authorization: Bearer SEU_TOKEN"

# Salvar cálculo
curl -X POST http://localhost:3000/salvar-calculo \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"origem":"SP","destino":"RJ","distancia":430,"kmLitro":12,"precoCombustivel":5.5,"litrosNecessarios":35.83,"custoTotal":197.06}'
```

##  Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=sua-chave-secreta-segura-aqui
CORS_ORIGIN=http://localhost:8000
```

**Em produção (Render.com):**
- Gere um `JWT_SECRET` forte com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Configure `CORS_ORIGIN` para seu domínio final

##  Segurança

-  Senhas hasheadas com bcryptjs (10 rounds salt)
-  JWT com expiração de 24h
-  Dados de usuário isolados (user_id no banco)
-  TODO: HTTPS em produção
-  TODO: Rate limiting
-  TODO: Validação de email

##  Responsividade

Testado em:
- Desktop (1920x1080)
- Tablet (768px)
- Mobile (480px, 375px)

##  Próximas Implementações

- [ ] Filtros no histórico
- [ ] Exportar CSV
- [ ] Múltiplos perfis de veículo
- [ ] Gráficos de gastos
- [ ] Editar/Deletar cálculos
- [ ] Integração com Google Maps

##  Reportar Problemas

Se encontrar bugs, abra uma issue no GitHub!

##  Licença

MIT

##  Autor

[ https://www.linkedin.com/in/gustavoandrade10/ ] - [ Gustavo-Andrade-19 ] 




