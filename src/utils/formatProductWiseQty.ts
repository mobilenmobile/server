import { FrontendData, ProductWiseQty } from "../types/productTypes";


export default function formatProductWiseQty(frontendData: FrontendData) {
    // Transform the data to match ProductWiseQtySchema format
    const transformedData: ProductWiseQty[] = frontendData.reduce((acc: ProductWiseQty[], item) => {
        // Find if the category already exists in the accumulator
        let category = acc.find(c => c.category === item.deviceCategory);

        if (!category) {
            // If category doesn't exist, create a new entry for that category
            category = {
                category: item.deviceCategory,
                brands: []  // Initialize an empty brands array for this category
            };
            acc.push(category);
        }

        // Find if the brand already exists within the category
        let brand = category.brands.find(b => b.brandName === item.deviceBrand);

        if (!brand) {
            // If brand doesn't exist, create a new entry for that brand
            brand = {
                brandName: item.deviceBrand,
                models: []  // Initialize an empty models array for this brand
            };
            category.brands.push(brand);
        }

        // Add the model and quantity to the brand
        brand.models.push({
            modelName: item.deviceModel,
            quantity: item.deviceModelQuantity
        });

        return acc;
    }, []);

    return transformedData;
}