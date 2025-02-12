import multer from "multer";
import { v4 as uuid } from "uuid";

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./public");
  },
  filename(req, file, callback) {
    // console.log(`Uploaded File Size: ${req.file.size} bytes`); // Logs the size of the uploaded file
    const id = uuid();
    console.log(req, file)
    const extName = file.originalname.split(".").pop();
    callback(null, `${id}.${extName}`);
  },
});


//define multer size
export const fileUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});
