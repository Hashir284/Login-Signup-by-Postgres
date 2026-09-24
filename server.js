import express from 'express'
import 'dotenv/config.js'
import pool from './Config/db.js'
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

let app = express()
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

app.post('/signup', async (req, res) => {
    let { user_name, password, email } = req.body
    if (
        typeof user_name !== 'string' ||
        typeof password !== 'string' ||
        typeof email !== 'string' ||
        !user_name.trim() ||
        !password.trim() ||
        !email.trim()
    ) {
        return res.status(400).send({
            status: 'Error',
            msg: 'Required parameters are missing or invalid'
        })
    }

    // await pool.query(`CREATE TABLE IF NOT EXISTS users (
    //     id SERIAL PRIMARY KEY,
    //     name VARCHAR(100) not null,
    //     email VARCHAR(255) UNIQUE NOT NULL,
    //     password VARCHAR(255) not null
    //     )`)

    try {
        let result = await pool.query(`INSERT INTO users (name, email, password) VALUES($1, $2, $3) RETURNING id, name, email`, [user_name, email, password])
        let current_user = result.rows[0]
        let userToken = jwt.sign({
            current_user
            // iat: Date.now() / 1000, // miliseconds to seconds
            // exp: (Date.now() / 1000) + (60 * 60 * 24) // add 1 day second
        }, 'topsecret');
        res.cookie('Token', userToken, {
            // maxAge: 86400000, // 1 day
            httpOnly: true,
            secure: true
        })
        res.send({
            status: 'success',
            msg: 'User Insert Successfully',
            user: current_user
        })
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).send({
                "status": "Error",
                "msg": "Email already exists"
            })
        }
        return res.status(500).send({
            status: 'Error',
            msg: 'Something went wrong'
        })
    }
})

app.post('/login', async(req, res)=>{
    let { password, email } = req.body
    if (
        typeof password !== 'string' ||
        typeof email !== 'string' ||
        !password.trim() ||
        !email.trim()
    ) {
        return res.status(400).send({
            status: 'Error',
            msg: 'Required parameters are missing or invalid'
        })
    }

    try {
        const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [ email ])
        if(result.rows.length === 0){
            return res.status(401).send({status:'error', msg:'Email does not exist'})
        }
        if(result.rows[0].password !== password){
            return res.status(401).send({status:'error', msg:'Password did not match'})
        }
        let current_user = result.rows[0]
        delete current_user.password
        let userToken = jwt.sign({
            current_user
            // iat: Date.now() / 1000, // miliseconds to seconds
            // exp: (Date.now() / 1000) + (60 * 60 * 24) // add 1 day second
        }, 'topsecret');
        res.cookie('Token', userToken, {
            // maxAge: 86400000, // 1 day
            httpOnly: true,
            secure: true
        })
        return res.send({
            status: 'success',
            message: 'Login Successful',
            user: current_user
        })
    } catch (error) {
        return res.status(500).send({
            status: 'Error',
            message: 'Something went wrong'
        })
    }
})

app.get('/me', (req, res) => {
    const token = req.cookies?.Token

    if (!token) {
        return res.status(401).send({
            status: 'error',
            message: 'Unauthorized'
        })
    }

    try {
        const user = jwt.verify(token, 'topsecret')

        return res.send({
            status: 'success',
            user: user.current_user
        })
    } catch (error) {
        return res.status(401).send({
            status: 'error',
            message: 'Invalid or expired token'
        })
    }
})

app.post('/logout', (req, res) => {
    res.clearCookie('Token')

    return res.send({
        status: 'success',
        message: 'Logout successful'
    })
})

//static hosting
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(express.static(path.join(__dirname, 'Web/dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Web/dist', 'index.html'))
})

app.listen(8000, () => {
  console.log('Website running at http://localhost:8000')
})