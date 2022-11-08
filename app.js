const express = require('express')
const app = express()
const axios = require('axios')
const HOST = 'localhost'
const cors = require('cors')
const morgan = require('morgan')
const mysql = require('mysql2')
const PORT = 3150 || process.env.PORT

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'sistemainstitucional'
})

connection.connect(function (err) {
    if (err) throw err
    console.log('Connected!')
})

app.use(express.json())
app.use(cors())
app.use(morgan('dev'))

app.post('/updateinfo', (req, res) => {
    const { nombre, apellidos, id, email, fecha_nacimiento } = req.body
    const query = `UPDATE personas SET nombre = '${nombre}', apellidos = '${apellidos}', email = '${email}', fecha_nacimiento = '${fecha_nacimiento}' WHERE id = ${id}`
    connection.query(query, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

app.post('/updatepassword', (req, res) => {
    const { id, contraseña } = req.body
    const query = `UPDATE personas SET contraseña = '${contraseña}' WHERE id = ${id}`
    connection.query(query, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})

app.listen(PORT, async () => {
    const response = await axios({
        method: 'post',
        url: 'http://localhost:3000/register',
        headers: { 'Content-Type': 'application/json' },
        data: {
            apiName: "account",
            protocol: "http",
            host: HOST,
            port: PORT,
        }
    })
    await axios.post('http://localhost:3000/switch/account', {
        "url": "http://localhost:" + PORT,
        "enabled": true
    })
    console.log(response.data)
    console.log(`Auth server listening on port ${PORT}`)
})
