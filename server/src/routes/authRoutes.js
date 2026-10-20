import express from 'express';
import { precostingStore } from '../db/precostingStore.js';
import { getDbStatus } from '../db/connection.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username dan password wajib diisi.',
    });
  }

  try {
    const user = await precostingStore.findUserByUsername(username);

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah. Periksa kembali kredensial Anda.',
      });
    }

    const { password: _, ...safeUser } = user;
    const dbStatus = getDbStatus();

    res.json({
      success: true,
      message: `Selamat datang kembali, ${safeUser.name}!`,
      data: safeUser,
      database: dbStatus.isConnected ? 'postgresql' : 'memory-fallback',
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan sistem saat memproses login.',
    });
  }
});

// GET /api/auth/users - list default available users for easy quick login
router.get('/users', async (req, res) => {
  try {
    const users = await precostingStore.getUsers();
    const safeUsers = (users || []).map(({ password, ...u }) => u);
    const dbStatus = getDbStatus();

    res.json({
      success: true,
      data: safeUsers,
      database: dbStatus.isConnected ? 'postgresql' : 'memory-fallback',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil data user.',
    });
  }
});

export default router;
