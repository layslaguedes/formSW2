const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload()); // Middleware para upload de arquivos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração da conexão com o banco de dados
const con = mysql.createConnection({
    host: "sql10.freemysqlhosting.net",
    user: "sql10729887",
    password: "QlnaW6G2x3",
    database: "sql10729887"
});

// Conectar ao banco de dados
con.connect(function (err) {
    if (err) {
        console.error("Erro ao conectar ao MySQL:", err);
        process.exit(1); // Encerra o processo se a conexão falhar
    }
    console.log("Conectado ao MySQL!");
});

// Rotas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'menu.html'));
});

app.get('/formulario', (req, res) => {
    res.sendFile(path.join(__dirname, 'form.html'));
});

app.get('/delete', (req, res) => {
    res.sendFile(path.join(__dirname, 'delete.html'));
});

app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'search.html'));
});

app.get('/consulta', (req, res) => {
    res.sendFile(path.join(__dirname, 'consulta.html'));
});

app.get('/update', (req, res) => {
    res.sendFile(path.join(__dirname, 'update.html'));
});

app.get('/listar', (req, res) => {
    res.sendFile(path.join(__dirname, 'listar.html'));
});

app.get('/usuarios', (req, res) => {
    const sql = "SELECT * FROM usuario";
    con.query(sql, (err, result) => {
        if (err) {
            console.error("Erro ao buscar usuários:", err);
            res.status(500).send("Erro ao buscar usuários.");
            return;
        }
        res.json(result);
    });
});

// Rota para submeter dados e imagem
app.post('/submit', (req, res) => {
    const { name, password, phone } = req.body;
    const image = req.files && req.files.image ? req.files.image.data : null;

    const sql = "INSERT INTO usuario (nome, senha, telefone, imagem) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, password, phone, image], (err, result) => {
        if (err) {
            console.error("Erro ao inserir no banco de dados:", err);
            res.status(500).send("Erro ao salvar os dados. Por favor, tente novamente.");
            return;
        }
        console.log("1 registro inserido");
        res.send("Cadastro realizado com sucesso!");
    });
});

// Rota para deletar usuário
app.post('/delete', (req, res) => {
    const { id } = req.body;
    const sql = "DELETE FROM usuario WHERE id = ?";
    con.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao excluir do banco de dados:", err);
            res.status(500).send("Erro ao excluir o usuário. Por favor, tente novamente.");
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).send("Usuário não encontrado.");
            return;
        }
        res.send("Usuário excluído com sucesso!");
    });
});

// Rota para buscar dados de usuário
app.get('/search-results', (req, res) => {
    const { query } = req.query;

    let sql = "SELECT id, nome, telefone, senha, imagem FROM usuario";
    const params = [];

    if (query && query !== '*') {
        sql += " WHERE nome LIKE ? OR telefone LIKE ? OR senha LIKE ? OR id = ?";
        const likeQuery = '%' + query + '%';
        params.push(likeQuery, likeQuery, likeQuery, query);
    }

    con.query(sql, params, (err, result) => {
        if (err) {
            console.error("Erro ao buscar no banco de dados:", err);
            res.status(500).send("Erro ao buscar os dados. Por favor, tente novamente.");
            return;
        }
        res.json(result);
    });
});

// Rota para atualizar dados de usuário
app.post('/update', (req, res) => {
    const { id, name, password, phone } = req.body;
    const image = req.files && req.files.image ? req.files.image.data : null;

    let sql = "UPDATE usuario SET ";
    const params = [];

    if (name) {
        sql += "nome = ?, ";
        params.push(name);
    }
    if (password) {
        sql += "senha = ?, ";
        params.push(password);
    }
    if (phone) {
        sql += "telefone = ?, ";
        params.push(phone);
    }
    if (image) {
        sql += "imagem = ?, ";
        params.push(image);
    }

    if (params.length > 0) {
        sql = sql.slice(0, -2); // Remove a última vírgula
        sql += " WHERE id = ?";
        params.push(id);

        con.query(sql, params, (err, result) => {
            if (err) {
                console.error("Erro ao atualizar o banco de dados:", err);
                res.status(500).send("Erro ao atualizar os dados. Por favor, tente novamente.");
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).send("Usuário não encontrado.");
                return;
            }
            res.send("Usuário atualizado com sucesso!");
        });
    } else {
        res.status(400).send("Nenhum dado para atualizar.");
    }
});

// Rota para exibir imagem do usuário
app.get('/usuario/:id/imagem', (req, res) => {
    const { id } = req.params;
    const sql = "SELECT imagem FROM usuario WHERE id = ?";

    con.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Erro ao buscar a imagem:", err);
            res.status(500).send("Erro ao buscar a imagem. Por favor, tente novamente.");
            return;
        }

        if (result.length > 0 && result[0].imagem) {
            res.set('Content-Type', 'image/jpeg');
            res.send(result[0].imagem);
        } else {
            res.status(404).send("Imagem não encontrada.");
        }
    });
});

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
