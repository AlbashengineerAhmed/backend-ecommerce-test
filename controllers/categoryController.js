const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const streamifier = require("streamifier");

const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/imageUpload");
const cloudinary = require("../utils/cloudinary");
const Category = require("../models/categoryModel");

exports.uploadCategoryImage = uploadSingleImage("image");

/// Resize image (upload to Cloudinary instead of local storage)
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  const uploadFromBuffer = (fileBuffer) => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Ecommerce/categories",
          public_id: `category-${uuidv4()}-${Date.now()}`,
        },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(fileBuffer).pipe(uploadStream);
    });
  };

  const result = await uploadFromBuffer(req.file.buffer);

  // Here we are directly using the Cloudinary URL to save in the database
  req.body.image = result.secure_url; // This should now have the Cloudinary URL without any local URL prefix

  next();
});
// @desc      Get all categories
// @route     GET /api/v1/categories
// @access    Public
exports.getCategories = factory.getAll(Category);

// @desc      Get specific category by id
// @route     GET /api/v1/categories/:id
// @access    Public
exports.getCategory = factory.getOne(Category);

// @desc      Create category
// @route     POST /api/v1/categories
// @access    Private
exports.createCategory = factory.createOne(Category);

// @desc      Update category
// @route     PATCH /api/v1/categories/:id
// @access    Private
exports.updateCategory = factory.updateOne(Category);

// @desc     Delete category
// @route    DELETE /api/v1/categories/:id
// @access   Private
exports.deleteCategory = factory.deleteOne(Category);

exports.deleteAll = factory.deleteAll(Category);
