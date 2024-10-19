import express from "express"
import { getInventoryData, getMonthlyOrderStats } from "../controllers/dashboard.controller"
// import { getBarCharts, getDasboardStats, getLineCharts, getPieCharts } from "../controllers/dashboard.js"

const router = express.Router()

router.get("/inventorydata", getInventoryData)
router.get("/stats", getMonthlyOrderStats)
// router.get("/stats",getDasboardStats)

// router.get("/pie",getPieCharts)

// router.get("/bar",getBarCharts)

// router.get("/line",getLineCharts)

export default router