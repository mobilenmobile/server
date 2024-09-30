// routes/socialMediaRoutes.js
import express from 'express';
import { getAllSocialMedias, newSocialMedia } from '../controllers/socialmedia.controller';


const router = express.Router();

// Create or update social media links
router.post('/socialmedia', newSocialMedia);

// Get all social media links
router.get('/socialmedia', getAllSocialMedias);

// Delete a social media link by name
// router.delete('/:name', deleteSocialMedia);

export default router;
