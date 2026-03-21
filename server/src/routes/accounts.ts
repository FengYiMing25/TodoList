import { Router } from "express";
import { getAccounts, getAccountById, createAccount, updateAccount, deleteAccount, getStatistics } from "../controllers/accountController";
import { authMiddleware } from "../middlewares";

const router = Router();

router.get("/statistics", authMiddleware, getStatistics);
router.get("/", authMiddleware, getAccounts);
router.get("/:id", authMiddleware, getAccountById);
router.post("/", authMiddleware, createAccount);
router.put("/:id", authMiddleware, updateAccount);
router.delete("/:id", authMiddleware, deleteAccount);

export default router;
