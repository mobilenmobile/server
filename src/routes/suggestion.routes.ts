
import express from 'express'
import { getSuggestedKeywords } from '../controllers/suggestion.controller';
import { storeSuggestions } from '../suggestion';
const router = express.Router();

router.get("/", getSuggestedKeywords)
router.get("/store", storeSuggestions)

export default router;