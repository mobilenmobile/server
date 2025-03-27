import express from "express"
import { getInventoryData, getMonthlyOrderStats } from "../controllers/dashboard.controller"
import { getProductStats, getSearchedProductStats,  } from "../controllers/Dashboard/productHistory.controller"
import { getProductViewStats, trackProductView } from "../controllers/Dashboard/productViewHistory.controller"
import { getVisitAnalytics, trackWebsiteVisit } from "../controllers/Dashboard/websiteVisitors.controller"
import { getAnalyticsData } from "../controllers/Dashboard/dashboard.controller"
// import { getBarCharts, getDasboardStats, getLineCharts, getPieCharts } from "../controllers/dashboard.js"

const router = express.Router()

router.get("/inventorydata", getInventoryData)
router.get("/stats", getMonthlyOrderStats)
router.get("/getAnalyticsData", getAnalyticsData)

//product history
router.get("/productStats", getProductStats)
router.get("/trackProductView", trackProductView)
router.get("/getProductViewStats", getProductViewStats)
router.post("/trackWebsiteVisit", trackWebsiteVisit)
router.get("/getWebsiteVisitAnalytic", getVisitAnalytics)
router.get("/getSearchProductStats", getSearchedProductStats)
// router.get("/stats",getDasboardStats)

// router.get("/pie",getPieCharts)

// router.get("/bar",getBarCharts)

// router.get("/line",getLineCharts)

export default router