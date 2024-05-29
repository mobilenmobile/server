import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

const uploadOnCloudinary = async (localFilePath: string) => {
  console.log("from clouianary=> ", localFilePath);
  try {
    if (!localFilePath) return null;
    //upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    // file has been uploaded successfull
    //console.log("file is uploaded on cloudinary ", response.url);

    return response;
  } catch (error) {
    console.log(error);
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload operation got failed
    return null;
  }
};

// const uploadSingleCloudinary=async(localFile:any)=>{
//   console.log("singleFilePath=>"+localFile);
//   try{

//   }
//   catch(error){

//   }

// }

const uploadMultipleCloudinary = async (localFiles: any) => {
  console.log("multipleFilepath =>" + localFiles);

  try {
    const uploadedImages = [];
    for (const file of localFiles) {
      const response = await cloudinary.uploader.upload(file.path, {
        timeout: 60000,
      });
      console.log(response);
      fs.unlinkSync(file.path);
      uploadedImages.push(response.secure_url);
      console.log("response=> " + response.public_id);
    }

    return uploadedImages;
  } catch (error) {
    console.log(error);

    for (const file of localFiles) {
      fs.unlinkSync(file.path);
    }

    return null;
  }
};

const deleteImgInCloudinary = async (imgUrl: string) => {
  const splited_url = imgUrl.split("/").at(-1)!;
  const public_id = splited_url.split(".")[0];

  const response = await cloudinary.uploader.destroy(public_id);
  return response;
};

export { uploadOnCloudinary, uploadMultipleCloudinary, deleteImgInCloudinary };
