import express from 'express';
import { precostingStore } from '../db/precostingStore.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = precostingStore.findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Username atau password salah.',
    });
  }

  const { password: _, ...safeUser } = user;
  res.json({
    success: true,
    message: `Selamat datang kembali, ${safeUser.name}!`,
    data: safeUser,
  });
});

// GET /api/auth/users - list default available users for easy quick login
router.get('/users', (req, res) => {
  const users = precostingStore.getUsers().map(({ password, ...u }) => u);
  res.json({
    success: true,
    data: users,
  });
});

export default router;
