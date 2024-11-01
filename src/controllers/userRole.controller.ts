// roleController.js
import { Request, Response, NextFunction } from 'express';
import { asyncErrorHandler } from '../middleware/error.middleware';
import ErrorHandler from '../utils/errorHandler';
import { Role } from '../models/userRoleModel';


// Create a new role
export const createRole = asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { roleName, permissions = [], isDefault = false } = req.body;

        if (!roleName) {
            return next(new ErrorHandler('Role name is required', 400));
        }

        const existingRole = await Role.findOne({ roleName });
        if (existingRole) {
            return res.status(400).json({ success: false, message: 'Role already exists' });
        }

        const role = await Role.create({ roleName, permissions, isDefault });
        return res.status(201).json({ success: true, message: 'Role created successfully', role });
    }
);

// Get all roles
export const getAllRoles = asyncErrorHandler(
    async (req: Request, res: Response) => {
        const roles = await Role.find();
        return res.status(200).json({ success: true, roles });
    }
);

// Get a specific role by ID
export const getRoleById = asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return next(new ErrorHandler('Role not found', 404));
        }

        return res.status(200).json({ success: true, role });
    }
);

// Update a role
export const updateRole = asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const { roleName, permissions, isDefault } = req.body;

        let role = await Role.findById(req.params.id);
        if (!role) {
            return next(new ErrorHandler('Role not found', 404));
        }

        role.roleName = roleName || role.roleName;
        role.permissions = permissions || role.permissions;
        role.isDefault = isDefault !== undefined ? isDefault : role.isDefault;

        await role.save();
        return res.status(200).json({ success: true, message: 'Role updated successfully', role });
    }
);


// Delete a role
export const deleteRole = asyncErrorHandler(
    async (req: Request, res: Response, next: NextFunction) => {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return next(new ErrorHandler('Role not found', 404));
        }

        await Role.findByIdAndDelete(req.params.id);  // Use findByIdAndDelete instead of remove

        return res.status(200).json({ success: true, message: 'Role deleted successfully' });
    }
);