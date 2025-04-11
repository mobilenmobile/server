import express from 'express';
import { newBlog, getBlogs, getBlogById, updateBlog, deleteBlog } from '../controllers/blog.controller';
import { EditorOnly } from '../middleware/auth.middleware';


const router = express.Router();

router.get('/', getBlogs);
router.get('/:id', getBlogById);

//protected routes for editor and admin
router.post('/', EditorOnly, newBlog);
router.patch('/:id', EditorOnly, updateBlog);
router.delete('/:id', EditorOnly, deleteBlog);

export default router;
