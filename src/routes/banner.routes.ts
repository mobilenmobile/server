import express from 'express';
import { deleteBanner, getAllBanners, getBanners, newBanner, updateBanner } from '../controllers/banner.controller';


const router = express.Router();

// Create a new banner
router.post('/', newBanner);

// Get all banners
router.get('/', getAllBanners); // New route
// Get a banner by ID
router.get('/:bannerId', getBanners);

// Update a banner by ID
router.patch('/:bannerId', updateBanner);

// Delete a banner by ID
router.delete('/:bannerId', deleteBanner);

export default router;
