const express = require('express')
const credentials = require('../db_credentials');
const app = express()
const axios = require('axios')
const HOST = 'localhost'
const cors = require('cors')
const morgan = require('morgan')
const mysql = require('mysql2')
var portfinder = require('portfinder');
portfinder.setBasePort(3150);
portfinder.setHighestPort(3199);
var setTerminalTitle = require('set-terminal-title');
setTerminalTitle('Accounts Service', { verbose: true });
var PORT;
const DB_NAME = 'sistemainstitucional'
const DB_USER = credentials['DB_USER']
const DB_PASSWORD = credentials['DB_PASSWORD']

const connection = mysql.createConnection({
    host: HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
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

app.post('/addtarjeta', (req, res) => {
    const { id, numero, nombre_titular, fecha_expiracion, cvv, proveedor } = req.body

    // look if the card exists in the bank
    axios.get(`http://${HOST}:5000/tarjeta-${numero}`)
        .then(response => {
            if (response.data == 'Consultas deshabilitadas') {
                return res.status(503).json({ message: 'consultas deshabilitadas por parte del banco', service: 'Consultas bancarias' })
            } else {
                if (response.data.length > 0 && response.data != 'Empty result') {
                    // check if the camps are the same
                    const { numero: numero_res, nombre_titular: nombre_titular_res, fecha_expiracion: fecha_expiracion_res, cvv: cvv_res, proveedor: proveedor_res } = response.data[0]
                    console.log(response.data[0])
                    console.log(req.body)
                    const fecha_expiracion_res_temp = fecha_expiracion_res.split('T')[0]
                    if (numero_res === numero && nombre_titular_res === nombre_titular && fecha_expiracion_res_temp === fecha_expiracion && cvv_res === cvv && proveedor_res === proveedor) {
                        const query = `INSERT INTO tarjetas (id_persona, numero, nombre_titular, fecha_expiracion, cvv, proveedor) VALUES (${id}, '${numero}', '${nombre_titular}', '${fecha_expiracion}','${cvv}', '${proveedor}')`
                        console.log(query)
                        connection.query(query, (err, result) => {
                            if (err) throw err
                            res.send('Tarjeta agregada')
                        })
                    } else {
                        res.send('Datos incorrectos')
                    }
                } else {
                    res.send('Tarjeta no existe')
                }
            }
        })
        .catch(error => {
            console.log(error)
            res.status(500).send(error)
        })
})

app.post('/deletetarjeta', (req, res) => {
    const { id } = req.body
    const query = `DELETE FROM tarjetas WHERE id = ${id}`
    connection.query(query, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})


app.post('/addcuenta', (req, res) => {
    const { id, numero, nombre_titular, email, banco } = req.body

    axios.get(`http://${HOST}:5000/cuenta-${numero}`)
        .then(response => {
            if (response.data.length > 0 && response.data != 'Empty result') {
                const { numero: numero_res, nombre_titular: nombre_titular_res, email: email_res, nombre: banco_res } = response.data[0]
                console.log(response.data[0])
                console.log(req.body)
                if (numero_res === numero && nombre_titular_res === nombre_titular && email_res === email && banco_res === banco) {
                    const query = `INSERT INTO cuentas (id_persona, numero, nombre_titular, email, banco) VALUES (${id}, '${numero}', '${nombre_titular}', '${email}','${banco}')`
                    connection.query(query, (err, result) => {
                        if (err) throw err
                        res.send('Cuenta agregada')
                    })
                } else {
                    res.send('Datos incorrectos')
                }
            } else {
                res.send('Cuenta no existe')
            }
        })
        .catch(error => {
            console.log(error)
            res.status(500).send(error)
        })
})

app.post('/deletecuenta', (req, res) => {
    const { id } = req.body
    const query = `DELETE FROM cuentas WHERE id = ${id}`
    connection.query(query, (err, result) => {
        if (err) throw err
        res.send(result)
    })
})


portfinder.getPort(function (err, port) {
    PORT = port;
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
})
