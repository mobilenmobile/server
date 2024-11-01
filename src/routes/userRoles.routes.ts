import express from 'express';
import {
    createRole,
    getAllRoles,
    getRoleById,
    updateRole,
    deleteRole
} from '../controllers/userRole.controller';

const router = express.Router();

// Route to create a new role
router.post('/', createRole);

// Route to get all roles
router.get('/', getAllRoles);

// Route to get a specific role by ID
router.get('/:id', getRoleById);

// Route to update a specific role by ID
router.put('/:id', updateRole);

// Route to delete a specific role by ID
router.delete('/:id', deleteRole);

export default router;
