import express from "express"
import { getInventoryData, getMonthlyOrderStats } from "../controllers/dashboard.controller"
import { getProductStats, getSearchedProductStats, } from "../controllers/Dashboard/productHistory.controller"
import { getProductViewStats, trackProductView } from "../controllers/Dashboard/productViewHistory.controller"
import { getVisitAnalytics, trackWebsiteVisit } from "../controllers/Dashboard/websiteVisitors.controller"
import { getAnalyticsData } from "../controllers/Dashboard/dashboard.controller"
import { EditorOnly } from "../middleware/auth.middleware"
// import { getBarCharts, getDasboardStats, getLineCharts, getPieCharts } from "../controllers/dashboard.js"

const router = express.Router()



//product history
router.get("/trackProductView", trackProductView)
router.post("/trackWebsiteVisit", trackWebsiteVisit)

// ----------------------- protected routes-------------------------------
router.get("/inventorydata", EditorOnly, getInventoryData)
router.get("/stats", EditorOnly, getMonthlyOrderStats)
router.get("/getAnalyticsData", EditorOnly, getAnalyticsData)

router.get("/productStats", EditorOnly, getProductStats)
router.get("/getProductViewStats", EditorOnly, getProductViewStats)
router.get("/getWebsiteVisitAnalytic", EditorOnly, getVisitAnalytics)
router.get("/getSearchProductStats", EditorOnly, getSearchedProductStats)

// ------------------- Archived routes ----------------------------------
// router.get("/stats",getDasboardStats)
// router.get("/pie",getPieCharts)
// router.get("/bar",getBarCharts)
// router.get("/line",getLineCharts)

export default router