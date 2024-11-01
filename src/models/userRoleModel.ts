import mongoose from "mongoose";

// permissions.js
const PERMISSIONS = {
    VIEW_DASHBOARD: 'VIEW_DASHBOARD',
    MANAGE_ORDERS: 'MANAGE_ORDERS',
    MANAGE_PRODUCTS: 'MANAGE_PRODUCTS',
    MANAGE_SETTINGS: 'MANAGE_SETTINGS',
    MANAGE_USERS: 'MANAGE_USERS',
    MANAGE_BANNERS: 'MANAGE_BANNERS',
    MANAGE_COUPONS: 'MANAGE_COUPONS',
    MANAGE_BLOGS: 'MANAGE_BLOGS',
    MANAGE_ROLES: 'MANAGE_ROLES'
};


const roleSchema = new mongoose.Schema({
    roleName: { type: String, required: true },
    permissions: {
        type: [String],
        enum: Object.values(PERMISSIONS),
        default: []
    },
    isDefault: { type: Boolean, default: false }
});

export const Role = mongoose.model('Role', roleSchema);
