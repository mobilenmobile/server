import { Request, Response } from "express";
import { asyncErrorHandler } from "../../middleware/error.middleware";
import { WebsiteVisit } from "../../models/websiteVisit/websiteVisitModel";
import { User } from "../../models/auth/user.model";


// Function to generate timeframe dynamically
const generateTimeFrame = (): string => {
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 12) return "6-12";
    if (hours >= 12 && hours < 18) return "12-18";
    if (hours >= 18 && hours < 24) return "18-24";
    return "0-6";
};

const getDateRange = (startDateStr?: string, endDateStr?: string, defaultRange?: string) => {
    let startDate, endDate, prevStartDate, prevEndDate;
    const now = new Date();

    if (startDateStr && endDateStr) {
        startDate = new Date(startDateStr);
        endDate = new Date(endDateStr);

        // Calculate previous timeframe of the same duration
        const duration = endDate.getTime() - startDate.getTime();
        prevStartDate = new Date(startDate.getTime() - duration);
        prevEndDate = new Date(endDate.getTime() - duration);
    } else if (defaultRange === "last7days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 7);
        endDate = new Date();

        prevStartDate = new Date();
        prevStartDate.setDate(startDate.getDate() - 7);
        prevEndDate = new Date(startDate);
    } else if (defaultRange === "last30days") {
        startDate = new Date();
        startDate.setDate(now.getDate() - 30);
        endDate = new Date();

        prevStartDate = new Date();
        prevStartDate.setDate(startDate.getDate() - 30);
        prevEndDate = new Date(startDate);
    } else {
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));

        prevStartDate = new Date(startDate);
        prevStartDate.setDate(startDate.getDate() - 1);
        prevEndDate = new Date(endDate);
        prevEndDate.setDate(endDate.getDate() - 1);
    }

    return { startDate, endDate, prevStartDate, prevEndDate };
};

const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return "N/A";
    return (((current - previous) / previous) * 100).toFixed(2) + "%";
};

export const trackWebsiteVisit = asyncErrorHandler(async (req: Request, res: Response) => {
    const { userId } = req.body // User ID can be null
    let userExistId = null;
    const isUserExist = await User.findById(userId);
    // console.log(isUserExist)
    if (isUserExist) userExistId = userId
    const visitTime = new Date();
    const timeFrame = generateTimeFrame(); // Automatically generated

    // Check if the user already has a WebsiteVisit record in this timeframe
    const existingVisit = await WebsiteVisit.findOne({ userId, timeFrame });

    if (existingVisit) {
        existingVisit.visitCount += 1;
        await existingVisit.save();
    } else {
        await WebsiteVisit.create({ userId: userExistId, visitTime, timeFrame });
    }

    res.status(200).json({ success: true, message: "WebsiteVisit tracked successfully" });
});

export const getVisitAnalytics = asyncErrorHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, dateRange } = req.query;

    const { startDate: finalStartDate, endDate: finalEndDate, prevStartDate, prevEndDate } = getDateRange(
        startDate as string,
        endDate as string,
        dateRange as string
    );

    // Fetch Active Users (Users with userId)
    const totalActiveUsers = await WebsiteVisit.distinct("userId", {
        userId: { $ne: null },
        createdAt: { $gte: finalStartDate, $lte: finalEndDate },
    });

    // Count total visits
    const totalVisits = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: finalStartDate, $lte: finalEndDate } } },
        { $group: { _id: null, totalVisits: { $sum: "$visitCount" } } },
    ]);

    // Count visits for anonymous users (userId: null)
    const totalAnonymousVisits = await WebsiteVisit.aggregate([
        { $match: { userId: null, createdAt: { $gte: finalStartDate, $lte: finalEndDate } } },
        { $group: { _id: null, totalAnonymousVisits: { $sum: "$visitCount" } } },
    ]);

    // Fetch most visited timeframe
    const mostVisitedTimeframe = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: finalStartDate, $lte: finalEndDate } } },
        { $group: { _id: "$timeFrame", totalVisits: { $sum: "$visitCount" } } },
        { $sort: { totalVisits: -1 } },
        { $limit: 1 },
    ]);

    // Fetch Previous Data for Growth Calculation
    const prevTotalActiveUsers = await WebsiteVisit.distinct("userId", {
        userId: { $ne: null },
        createdAt: { $gte: prevStartDate, $lte: prevEndDate },
    });

    const prevTotalVisits = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, totalVisits: { $sum: "$visitCount" } } },
    ]);

    const prevTotalAnonymousVisits = await WebsiteVisit.aggregate([
        { $match: { userId: null, createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, totalAnonymousVisits: { $sum: "$visitCount" } } },
    ]);

    const prevMostVisitedTimeframe = await WebsiteVisit.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: "$timeFrame", totalVisits: { $sum: "$visitCount" } } },
        { $sort: { totalVisits: -1 } },
        { $limit: 1 },
    ]);

    // Extract counts from aggregation results
    const totalVisitsCount = totalVisits[0]?.totalVisits || 0;
    const totalAnonymousVisitsCount = totalAnonymousVisits[0]?.totalAnonymousVisits || 0;
    const prevTotalVisitsCount = prevTotalVisits[0]?.totalVisits || 0;
    const prevTotalAnonymousVisitsCount = prevTotalAnonymousVisits[0]?.totalAnonymousVisits || 0;

    // Calculate Growth Percentages
    const activeUsersGrowth = calculateGrowth(totalActiveUsers.length, prevTotalActiveUsers.length);
    const totalVisitorsGrowth = calculateGrowth(totalVisitsCount, prevTotalVisitsCount);
    const anonymousVisitsGrowth = calculateGrowth(totalAnonymousVisitsCount, prevTotalAnonymousVisitsCount);
    const mostVisitedTimeframeGrowth = calculateGrowth(
        mostVisitedTimeframe[0]?.totalVisits || 0,
        prevMostVisitedTimeframe[0]?.totalVisits || 0
    );

    res.status(200).json({
        success: true,
        totalActiveUsers: totalActiveUsers.length,
        activeUsersGrowth,
        totalVisits: totalVisitsCount,
        totalVisitorsGrowth,
        totalAnonymousVisits: totalAnonymousVisitsCount,
        anonymousVisitsGrowth,
        mostVisitedTimeframe: mostVisitedTimeframe[0]?._id || "No data",
        mostVisitedTimeframeGrowth,
    });
});

