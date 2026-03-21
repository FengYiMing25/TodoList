import { Response } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { AuthRequest } from "../types";
import db from "../database";
import { generateToken, asyncHandler } from "../middlewares";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('Register request received:', req.body);
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ success: false, message: "请填写所有必填项" });
    return;
  }

  console.log('Checking existing user...');
  const existingUser = db.get<{ id: string }>("SELECT id FROM users WHERE username = ? OR email = ?", [username, email]);
  console.log('Existing user:', existingUser);

  if (existingUser) {
    res.status(400).json({ success: false, message: "用户名或邮箱已存在" });
    return;
  }

  console.log('Hashing password...');
  const hashedPassword = await bcrypt.hash(password, 10);
  const userId = uuidv4();
  console.log('Generated userId:', userId);

  console.log('Inserting user...');
  db.run(`INSERT INTO users (id, username, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`, [userId, username, email, hashedPassword]);
  console.log('User inserted successfully');

  const token = generateToken(userId);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: userId,
        username,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token,
    },
  });
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ success: false, message: "请输入用户名和密码" });
    return;
  }

  const user = db.get<{ id: string; username: string; email: string; password: string; avatar: string; created_at: string; updated_at: string }>(
    "SELECT * FROM users WHERE username = ? OR email = ?",
    [username, username],
  );

  if (!user) {
    res.status(401).json({ success: false, message: "用户名或密码错误" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401).json({ success: false, message: "用户名或密码错误" });
    return;
  }

  const token = generateToken(user.id);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      token,
    },
  });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = db.get<{ id: string; username: string; email: string; avatar: string; created_at: string; updated_at: string }>(
    "SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?",
    [req.userId!],
  );

  if (!user) {
    res.status(404).json({ success: false, message: "用户不存在" });
    return;
  }

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    },
  });
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, email, avatar } = req.body;

  db.run(`UPDATE users SET username = COALESCE(?, username), email = COALESCE(?, email), avatar = COALESCE(?, avatar), updated_at = datetime('now') WHERE id = ?`, [
    username,
    email,
    avatar,
    req.userId,
  ]);

  const user = db.get<{ id: string; username: string; email: string; avatar: string; created_at: string; updated_at: string }>(
    "SELECT id, username, email, avatar, created_at, updated_at FROM users WHERE id = ?",
    [req.userId!],
  );

  res.json({
    success: true,
    data: {
      id: user?.id,
      username: user?.username,
      email: user?.email,
      avatar: user?.avatar,
      createdAt: user?.created_at,
      updatedAt: user?.updated_at,
    },
  });
});
