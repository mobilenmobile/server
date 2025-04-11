export interface Product {
    _id: string;
    productTitle: string;
    productCategory: string;
    productBrand: {
        _id: string;
        name: string; // Assuming the brand has a name property
    };
    productModel: string;
    productDescription: string;
    productVariance: ProductVariance;
    // Add more properties as needed
}

export interface ProductVariance {
    comboPrice: any;
    quantity: any;
    _id: string;
    id: string;
    color: string; // Assuming color is always present in productVariance
    ramAndStorage: {
        _id: string;
        id: string;
        ram: string;
        storage: string;
    }[];
    thumbnail: string;
    sellingPrice: string;
    boxPrice: string;
}

export interface AdminSearchRequestQuery {
    searchQuery?: string;
    category?: string;
    sort?: 'A-Z' | 'Z-A' | 'oldest' | 'newest';
    page?: number;
}




// Interface for FrontendData, representing the raw input data from the frontend
export type FrontendData = {
    deviceCategory: string;  // e.g., "smartphone"
    deviceBrand: string;     // e.g., "infinix"
    deviceModel: string;     // e.g., "infinix note 40 pro 5g"
    deviceModelQuantity: number;  // e.g., 12
}[];

// Interface for ProductWiseQty, representing the transformed data grouped by category and brand
export interface ProductWiseQty {
    category: string;  // e.g., "smartphone"
    brands: Brand[];   // Array of brands within the category
}

// Interface for Brand, representing a brand and its models
export interface Brand {
    brandName: string;  // e.g., "infinix"
    models: Model[];    // Array of models under the brand
}

// Interface for Model, representing the individual product model and its quantity
export interface Model {
    modelName: string;  // e.g., "infinix note 40 pro 5g"
    quantity: number;   // e.g., 12
}


// Defining the types for better type safety
export interface fModel {
    modelName: string;
    quantity: number;
}

export interface fBrand {
    brandName: string;
    models: fModel[];
}

export interface InputData {
    category: string;
    brands: fBrand[];
}

export interface fProductWiseQty {
    brand: string;
    models: {
        modelName: string;
        quantity: number;
    }[];
}