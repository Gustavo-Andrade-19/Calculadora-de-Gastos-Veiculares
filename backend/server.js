const express = require('express')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())


function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(401).json({ erro: 'Token não fornecido!' });
    }

    jwt.verify(token, 'sua-chave-secreta-aqui', (err, user) => {
        if (err) {
            return res.status(403).json({ erro: 'Token inválido!' });
        }
        req.user = user; 
        next();
    });
}

const initSqlJs = require('sql.js');

let db;

initSqlJs().then(SQL => {
    db = new SQL.Database();
    
    db.run(`
        CREATE TABLE IF NOT EXISTS historico (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            origem TEXT,
            destino TEXT,
            distancia REAL,
            kmLitro REAL,
            precoCombustivel REAL,
            litrosNecessarios REAL,
            custoTotal REAL,
            dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES usuarios(id)
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            senha_hash TEXT NOT NULL,
            dataCriacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `); 






    console.log('Banco de dados inicializado!');
    carregarHistoricoDoArquivo();

});

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'historico.json');

function carregarHistoricoDoArquivo() {
    if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, 'utf-8');
        const historico = JSON.parse(data);

        historico.forEach(item => {
            db.run(`
                INSERT INTO historico (origem, destino, distancia, kmLitro, precoCombustivel, litrosNecessarios, custoTotal, dataCriacao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [item.origem, item.destino, item.distancia, item.kmLitro, item.precoCombustivel, item.litrosNecessarios, item.custoTotal, item.dataCriacao]);
        });

        console.log('Histórico carregado do arquivo!');
    }
}

function salvarHistoricoNoArquivo() {
    try {
        const result = db.exec(`SELECT * FROM historico`);
        if (result.length > 0) {
            const columns = result[0].columns;
            const values = result[0].values;

            const historico = values.map(row => {
                let obj = {};
                columns.forEach((col, idx) => {
                    obj[col] = row[idx];
                })
                return obj;
            });
            fs.writeFileSync(dbPath, JSON.stringify(historico, null, 2))
        }
    } catch (error) {
        console.error('Erro ao salvar histórico no arquivo:', error);

    }

}


app.get('/teste', (req, res) => {
    res.json({mensagem: 'Servidor rodando!'})
})


app.post('/calcular', (req, res) => {
    const { kmLitro, distancia, precoCombustivel } = req.body

    if (!kmLitro || !distancia || !precoCombustivel) {
        return res.status(400).json({ erro: 'Faltam dados!' })
    }

    const litrosNecessarios = distancia / kmLitro
    const custoTotal = litrosNecessarios * precoCombustivel

    res.json({
        litrosNecessarios: litrosNecessarios,
        custoTotal: custoTotal
    })
})


app.get('/geocodificar', async (req, res) => {
    const endereco = req.query.endereco

    if (!endereco) {
        return res.status(400).json({ erro: 'Endereço não fornecido!' })
    }

    try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(endereco)}&format=json`
        const response = await fetch(url)
        const data = await response.json()

        if (!data || data.length === 0) {
            return res.status(404).json({ erro: 'Endereço não encontrado!' })
        }

        res.json({
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon)
        })
    } catch (error) {
        console.error('Erro:', error)
        res.status(500).json({ erro: 'Erro ao buscar o endereço!' })
    }
})

app.post('/salvar-calculo', verificarToken, (req, res) => {
    const { origem, destino, distancia, kmLitro, precoCombustivel, litrosNecessarios, custoTotal } = req.body;
    const user_id = req.user.id; 

    if(!db) {
        return res.status(500).json({ erro: 'Banco de dados não iniciado!'});
    }

    try {
        db.run(`
            INSERT INTO historico (user_id, origem, destino, distancia, kmLitro, precoCombustivel, litrosNecessarios, custoTotal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [user_id, origem, destino, distancia, kmLitro, precoCombustivel, litrosNecessarios, custoTotal]);

        salvarHistoricoNoArquivo();

        res.json({ mensagem: 'Cálculo salvo com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar cálculo:', error);
        res.status(500).json({ erro: 'Erro ao salvar cálculo!' });
    }
});

app.get('/historico', verificarToken, (req, res) => {
    if (!db) {
        return res.status(500).json({ erro: 'Banco de dados não iniciado!' })
    }

    try {
       
        const user_id = req.user.id;
        const result = db.exec(`
            SELECT * FROM historico WHERE user_id = ${user_id} ORDER BY dataCriacao DESC LIMIT 10`);

        if (result.length === 0) {
            return res.json({ historico: [], mensagem: 'Nenhum cálculo salvo ainda!'});
        }

        const columns = result[0].columns;
        const values = result[0].values;

        const historico = values.map(row => {
            let obj = {};
            columns.forEach((col, idx) => {
                obj[col] = row[idx];
            });
            return obj;
        });

        res.json({ historico});
    } catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ erro: 'Erro ao buscar historico!'});

    }

});

app.post('/registrar', (req, res) => {
    const { email, senha } = req.body;

    if (!db) {
        return res.status(500).json({ erro: 'Banco de dados não iniciado!' });
    }

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha obrigatórios!' });
    }

   
    const emailVerify = db.exec(`SELECT * FROM usuarios WHERE email = '${email.replace(/'/g, "''")}'`);
    if (emailVerify.length > 0) {
        return res.status(400).json({ erro: 'Email já cadastrado!' });
    }

   
    const senhaHash = bcrypt.hashSync(senha, 10);

   
    try {
        db.run(`
            INSERT INTO usuarios (email, senha_hash) 
            VALUES (?, ?)
        `, [email, senhaHash]);

        res.status(201).json({ 
            mensagem: 'Usuário registrado com sucesso!' 
        });
    } catch (error) {
        console.error('Erro ao registrar:', error);
        res.status(500).json({ erro: 'Erro ao registrar usuário!' });
    }
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!db) {
        return res.status(500).json({ erro: 'Banco de dados não iniciado!' });
    }

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha obrigatórios!' });
    }

   
    const result = db.exec(`SELECT * FROM usuarios WHERE email = '${email.replace(/'/g, "''")}'`);
    if (result.length === 0) {
        return res.status(401).json({ erro: 'Email ou senha inválidos!' });
    }

    
    const columns = result[0].columns;
    const values = result[0].values[0];
    const usuario = {};
    columns.forEach((col, idx) => {
        usuario[col] = values[idx];
    });

   
    const senhaCorreta = bcrypt.compareSync(senha, usuario.senha_hash);
    if (!senhaCorreta) {
        return res.status(401).json({ erro: 'Email ou senha inválidos!' });
    }

    
    const token = jwt.sign(
        { id: usuario.id, email: usuario.email }, 
        'sua-chave-secreta-aqui', 
        { expiresIn: '24h' }
    );

    res.json({ 
        mensagem: 'Login realizado com sucesso!', 
        token: token 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
})
