import express from 'express';
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} from '../controllers/userRole.controller';
import { adminOnly, EditorOnly } from '../middleware/auth.middleware';

const router = express.Router();

// Route to create a new role
router.post('/', EditorOnly, createRole);

// Route to get all roles
router.get('/', EditorOnly, getAllRoles);

// Route to get a specific role by ID
router.get('/:id', EditorOnly, getRoleById);

// Route to update a specific role by ID
router.put('/:id', adminOnly, updateRole);

// Route to delete a specific role by ID
router.delete('/:id', adminOnly, deleteRole);

export default router;
