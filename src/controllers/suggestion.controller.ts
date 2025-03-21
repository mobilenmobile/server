import { Request, Response, NextFunction } from "express";
import { asyncErrorHandler } from "../middleware/error.middleware";
import { Product } from "../models/product/product.model";

// Get suggested keywords based on search query
export const getSuggestedKeywords = asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { search } = req.query;

        if (!search || typeof search !== "string") {
            return res.status(400).json({ success: false, message: "Invalid search query" });
        }

        // Fetch all products directly from the database
        const products = await Product.find({}, "productTitle productKeyword");

        // Create a regex pattern to match words that start with or contain the search term
        const regex = new RegExp(`\\b${search}`, "i"); // Match words starting with 'search' (case-insensitive)

        // Set to store unique matched titles
        const matchedTitles = new Set<string>();

        // First check for direct matches in product titles
        products.forEach(product => {
            if (regex.test(product.productTitle) ||
                product.productTitle.toLowerCase().includes(search.toLowerCase())) {
                matchedTitles.add(product.productTitle);
            }
        });

        // Then check keywords and add corresponding product title if found
        products.forEach(product => {
            // Skip if title already matched
            if (matchedTitles.has(product.productTitle)) {
                return;
            }

            // Check if keyword matches based on its type
            let keywordMatch = false;

            if (Array.isArray(product.productKeyword)) {
                // Handle array of keywords
                keywordMatch = product.productKeyword.some(
                    (keyword: string) => regex.test(keyword) || keyword.toLowerCase().includes(search.toLowerCase())
                );
            } else if (typeof product.productKeyword === 'string') {
                // Handle single string keyword
                keywordMatch = regex.test(product.productKeyword) ||
                    product.productKeyword.toLowerCase().includes(search.toLowerCase());
            }

            if (keywordMatch) {
                matchedTitles.add(product.productTitle);
            }
        });

        // Convert Set to Array for response
        const recommended = Array.from(matchedTitles);

        return res.status(200).json({ success: true, recommendations: recommended });
    }
);