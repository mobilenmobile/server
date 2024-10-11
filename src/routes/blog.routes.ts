import express from 'express';
import { newBlog, getBlogs, getBlogById, updateBlog, deleteBlog } from '../controllers/blog.controller';
import { authenticated } from '../middleware/auth.middleware';


const router = express.Router();

router.post('/', newBlog);
router.get('/', getBlogs);
router.get('/:id', getBlogById);
router.patch('/:id', updateBlog);
router.delete('/:id', deleteBlog);

export default router;
