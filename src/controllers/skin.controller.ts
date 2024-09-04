// import { asyncErrorHandler } from "../middleware/error.middleware"
// import fs from "fs"
// import path from "path"
// import ErrorHandler from "../utils/errorHandler"
// import { Request } from "express"
// import { NewSkinBody } from "../types/types"

// const filePath = path.join(__dirname, "skinData.json")

// export const addSkinData = asyncErrorHandler(async (req: Request<{}, {}, NewSkinBody>, res, next) => {

//     const { skinBrand, skinModel } = req.body

//     if (!skinBrand || !skinModel) {
//         return next(new ErrorHandler("Please provide all fields", 400))
//     }


//     try {
//         // Read existing data
//         let data = { skins: [] as any };
//         if (fs.existsSync(filePath)) {
//             const fileContent = fs.readFileSync(filePath, 'utf-8');
//             data = JSON.parse(fileContent);
//         }

//         // Add new skin data
//         data.skins.push({ skinBrand, skinModel });

//         // Write updated data back to the file
//         fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');

//         res.status(200).json({ message: 'Skin data added successfully' });
//     } catch (error) {
//         next(new ErrorHandler('Error updating skin data', 500));
//     }
// });

    
// })


// export const getSkinData = () => {

// }