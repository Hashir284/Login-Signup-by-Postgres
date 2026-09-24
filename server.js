import express from 'express'
import 'dotenv/config.js'
import pool from './Config/db.js'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import cors from 'cors'

let app = express()

// 1. Cross-Domain Access Fix
app.use(
  cors({
    origin: process.env.FRONTEND_URL || true, // Frontend ka Vercel URL
    credentials: true, // Cookies transfer karne ke liye zaroori hai
  })
)

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

    // FIX: sameSite: 'none' add kar diya hai cross-domain cookies ke liye
    res.cookie('Token', userToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })

    res.send({
      status: 'success',
      msg: 'User Insert Successfully',
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
      msg: 'Something went wrong',
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

    // FIX: sameSite: 'none' add kar diya hai
    res.cookie('Token', userToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    })

    return res.send({
      status: 'success',
      message: 'Login Successful',
      user: current_user,
    })
  } catch (error) {
    return res.status(500).send({
      status: 'Error',
      message: 'Something went wrong',
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
  // FIX: clearCookie me bhi same options zaroori hain
  res.clearCookie('Token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  })

  return res.send({
    status: 'success',
    message: 'Logout successful',
  })
})

export default app