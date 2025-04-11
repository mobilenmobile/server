// routes/socialMediaRoutes.js
import express from 'express';
import { getAllSocialMedias, newSocialMedia } from '../controllers/socialmedia.controller';
import { EditorOnly } from '../middleware/auth.middleware';


const router = express.Router();

router.get('/socialmedia', getAllSocialMedias);

// Create or update social media links
router.post('/socialmedia', EditorOnly, newSocialMedia);

// Delete a social media link by name
// router.delete('/:name', deleteSocialMedia);

export default router;
