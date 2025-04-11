import express from 'express';
import { deleteBanner, getAllBanners, newBanner, updateBanner } from '../controllers/banner.controller';
import { EditorOnly } from '../middleware/auth.middleware';


const router = express.Router();

// Get all banners
router.get('/', getAllBanners);

// Create a new banner
router.post('/', EditorOnly, newBanner);

// Update a banner by ID
router.patch('/:bannerId', EditorOnly, updateBanner);

// Delete a banner by ID
router.delete('/:bannerId', EditorOnly, deleteBanner);

export default router;
