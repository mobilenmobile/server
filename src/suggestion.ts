import { asyncErrorHandler } from "./middleware/error.middleware";
import { Product } from "./models/product/product.model";

const fs = require("fs");
const path = require("path");

const SUGGESTIONS_FILE = path.join(__dirname, "../data/suggestions.json");

// Define the type for product mapping
export interface ProductMapping {
  title: string;
  keywords: string | string[];
}

export const storeSuggestions = asyncErrorHandler(async (req, res) => {
    try {
        // Fetch all products and extract titles & keywords
        const products = await Product.find({}, "productTitle productKeyword");
        console.log(products);
        
        // Create a map of product titles to their keywords
        const productMap: ProductMapping[] = products.map(product => ({
            title: product.productTitle,
            keywords: product.productKeyword // Store as is without checking if it's an array
        }));
        
        console.log(productMap);
        
        // Write just the product map to the file
        fs.writeFileSync(
            SUGGESTIONS_FILE,
            JSON.stringify(productMap, null, 2),
            "utf8"
        );
        
        res.status(200).json({});
        console.log("Suggestions stored successfully");
    } catch (error) {
        res.status(500).json({});
        console.error("Error storing suggestions:", error);
    }
});

/**
 * Get all suggestion keywords
 * @returns {ProductMapping[]} - Array of products with their titles and keywords
 */
export const getSuggestions = (): ProductMapping[] => {
    try {
        const data = fs.readFileSync(SUGGESTIONS_FILE, "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading suggestions:", error);
        return [];
    }
};

module.exports = { storeSuggestions, getSuggestions };