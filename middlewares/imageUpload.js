const multer = require("multer");
const ApiError = require("../utils/apiError");

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ApiError("Only images are allowed", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

exports.uploadSingleImage = (fieldName) => upload.single(fieldName);
exports.uploadMultipleImages = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// ✅ New helper for multiple fields
exports.uploadMixedImages = (fieldsArray) => upload.fields(fieldsArray);
