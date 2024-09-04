const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));  // Servindo arquivos estáticos

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "3bgb"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Conectado ao MySQL!");
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/menu.html');
});

app.get('/formulario', (req, res) => {
    res.sendFile(__dirname + '/form.html');
});

app.get('/delete', (req, res) => {
    res.sendFile(__dirname + '/delete.html');
});

app.get('/search', (req, res) => {
    res.sendFile(__dirname + '/search.html');
});

app.get('/consulta', (req, res) => {
    res.sendFile(__dirname + '/consulta.html');
});


app.post('/submit', upload.single('image'), (req, res) => {
    const { name, password, phone } = req.body;
    const image = req.file.filename;

    const sql = "INSERT INTO 3bb_nomes (nome, senha, telefone, imagem) VALUES (?, ?, ?, ?)";
    con.query(sql, [name, password, phone, image], function (err, result) {
        if (err) {
            console.error("Erro ao inserir no banco de dados:", err);
            res.status(500).send("Erro ao salvar os dados. Por favor, tente novamente.");
            return;
        }
        console.log("1 registro inserido");
        res.send("Cadastro realizado com sucesso!");
    });
});

app.get('/usuarios', (req, res) => {
    const sql = "SELECT * FROM 3bb_nomes";
    con.query(sql, function (err, result) {
        if (err) throw err;

        let tableHtml = '<h1>Registros de Usuários</h1><table border="1"><tr><th>ID</th><th>Nome</th><th>Senha</th><th>Telefone</th><th>Imagem</th></tr>';
        result.forEach(user => {
            tableHtml += `<tr><td>${user.id}</td><td>${user.nome}</td><td>${user.senha}</td><td>${user.telefone}</td><td><img src="/uploads/${user.imagem}" alt="${user.nome}" width="100"></td></tr>`;
        });
        tableHtml += '</table>';

        res.send(tableHtml);
    });
});

app.post('/delete', (req, res) => {
    const { id } = req.body;
    const sql = "DELETE FROM 3bb_nomes WHERE id = ?";
    con.query(sql, [id], function (err, result) {
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

app.get('/search-results', (req, res) => {
    const { name, phone, password, id } = req.query;
    let sql = "SELECT * FROM 3bb_nomes WHERE 1=1";
    const params = [];

    if (name) {
        sql += " AND nome LIKE ?";
        params.push('%' + name + '%');
    }
    if (phone) {
        sql += " AND telefone LIKE ?";
        params.push('%' + phone + '%');
    }
    if (id) {
        sql += " AND id = ?";
        params.push(id);
    }

    con.query(sql, params, function (err, result) {
        if (err) {
            console.error("Erro ao buscar no banco de dados:", err);
            res.status(500).send("Erro ao buscar os dados. Por favor, tente novamente.");
            return;
        }

        let tableHtml = '<h1>Resultados da Pesquisa</h1><table border="1"><tr><th>ID</th><th>Nome</th><th>Senha</th><th>Telefone</th><th>Imagem</th></tr>';
        result.forEach(user => {
            tableHtml += `<tr><td>${user.id}</td><td>${user.nome}</td><td>${user.senha}</td><td>${user.telefone}</td><td><img src="/uploads/${user.imagem}" alt="${user.nome}" width="100"></td></tr>`;
        });
        tableHtml += '</table>';

        res.send(tableHtml);
    });
});

app.post('/submit_update', upload.single('image'), (req, res) => {
    const { id, name, password, phone } = req.body;
    let image = req.file ? req.file.filename : null;
   
    let sql = "UPDATE 3bb_nomes SET nome = ?, senha = ?, telefone = ?";
    let params = [name, password, phone];
   
    if (image) {
      sql += ", imagem = ?";
      params.push(image);
    }
   
    sql += " WHERE id = ?";
    params.push(id);
   
    con.query(sql, params, function (err, result) {
      if (err) throw err;
      res.send("Usuário atualizado com sucesso!");
    });
});

app.get('/list_update', (req, res) => {
    const sql = "SELECT * FROM 3bb_nomes";
    con.query(sql, (err, result) => {
      if (err) throw err;
      let formHtml = `
        <h1>Lista de Usuários</h1>
        <table border="1">
          <tr><th>ID</th><th>Nome</th><th>Senha</th><th>Telefone</th><th>Imagem</th><th>Atualizar</th></tr>
      `;
      result.forEach(user => {
        formHtml += `
          <tr>
            <form action="/submit_update" method="POST" enctype="multipart/form-data">
              <td><input type="hidden" name="id" value="${user.id}">${user.id}</td>
              <td><input type="text" name="name" value="${user.nome}"></td>
              <td><input type="password" name="password" value="${user.senha}"></td>
              <td><input type="text" name="phone" value="${user.telefone}"></td>
              <td><img src="/uploads/${user.imagem}" width="100"><br><input type="file" name="image"></td>
              <td><button type="submit">Atualizar</button></td>
            </form>
          </tr>
        `;
      });
      formHtml += `</table>`;
      res.send(formHtml);
    });
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
