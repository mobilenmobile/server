const mongoose = require("mongoose");

// Define Schema
const productSchema = new mongoose.Schema({
    SuggestionKeywords: { type: [String], index: true }, // Array of Strings for optimized queries
});

// Create Model
const Product = mongoose.model("Product", productSchema);