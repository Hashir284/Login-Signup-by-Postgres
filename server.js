import express from 'express'
import 'dotenv/config.js'
import pool from './Config/db.js'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'

let app = express()

// Dynamic CORS Header Middleware (Sabse upar rakhein)
app.use((req, res, next) => {
  const allowedOrigins = [
    'https://login-signup-by-postgres-front.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ]
  const origin = req.headers.origin

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://login-signup-by-postgres-front.vercel.app')
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

  // Browser ki OPTIONS (Preflight) request ko turant 200 OK response bhejein
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  next()
})

app.use(express.json())
app.use(cookieParser())

// Test Route
app.get('/', (req, res) => {
  res.send({ status: 'success', message: 'Backend Server Working Fine!' })
})

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
      msg: 'Required parameters are missing or invalid',
    })
  }

  try {
    let result = await pool.query(
      `INSERT INTO users (name, email, password) VALUES($1, $2, $3) RETURNING id, name, email`,
      [user_name, email, password]
    )
    let current_user = result.rows[0]
    let userToken = jwt.sign({ current_user }, 'topsecret')

    res.cookie('Token', userToken, {
      httpOnly: true,
      // secure: true,
      
      // sameSite: 'none',
      
    })

    res.send({
      status: 'success',
      msg: 'User Inserted Successfully',
      user: current_user,
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).send({
        status: 'Error',
        msg: 'Email already exists',
      })
    }
    return res.status(500).send({
      status: 'Error',
      msg: error.message || 'Something went wrong',
    })
  }
})

app.post('/login', async (req, res) => {
  let { password, email } = req.body
  if (
    typeof password !== 'string' ||
    typeof email !== 'string' ||
    !password.trim() ||
    !email.trim()
  ) {
    return res.status(400).send({
      status: 'Error',
      msg: 'Required parameters are missing or invalid',
    })
  }

  try {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ])
    if (result.rows.length === 0) {
      return res
        .status(401)
        .send({ status: 'error', msg: 'Email does not exist' })
    }
    if (result.rows[0].password !== password) {
      return res
        .status(401)
        .send({ status: 'error', msg: 'Password did not match' })
    }
    let current_user = result.rows[0]
    delete current_user.password
    let userToken = jwt.sign({ current_user }, 'topsecret')

    res.cookie('Token', userToken, {
      httpOnly: true,
      // secure: true,
      // sameSite: 'none',
    })

    return res.send({
      status: 'success',
      message: 'Login Successful',
      user: current_user,
    })
  } catch (error) {
    return res.status(500).send({
      status: 'Error',
      message: error.message || 'Something went wrong',
    })
  }
})

app.get('/me', (req, res) => {
  const token = req.cookies?.Token

  if (!token) {
    return res.status(401).send({
      status: 'error',
      message: 'Unauthorized',
    })
  }

  try {
    const user = jwt.verify(token, 'topsecret')

    return res.send({
      status: 'success',
      user: user.current_user,
    })
  } catch (error) {
    return res.status(401).send({
      status: 'error',
      message: 'Invalid or expired token',
    })
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('Token', {
    httpOnly: true,
    // secure: true,
    // sameSite: 'none',
  })

  return res.send({
    status: 'success',
    message: 'Logout successful',
  })
})

export default app