const mongoose = require("mongoose")

const boxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  length: {
    type: Number,
    required: true,
    min: 0,
  },
  breadth: {
    type: Number,
    required: true,
    min: 0,
  },
  height: {
    type: Number,
    required: true,
    min: 0,
  },
  weight: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt fields
})

// Model
export const Box = mongoose.model("Box", boxSchema)

// module.exports = Box
