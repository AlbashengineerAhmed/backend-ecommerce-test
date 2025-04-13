const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const streamifier = require("streamifier"); // Add this
const cloudinary = require("../utils/cloudinary"); // Add this

const factory = require("./handlersFactory");
const { uploadSingleImage } = require("../middlewares/imageUpload");
const Brand = require("../models/brandModel");

exports.uploadBrandImage = uploadSingleImage("image");

// Upload image to Cloudinary
exports.resizeImage = asyncHandler(async (req, res, next) => {
  if (!req.file) return next();

  try {
    const ext = req.file.mimetype.split("/")[1];
    if (!["jpg", "jpeg", "png", "gif"].includes(ext)) {
      return next(new ApiError("Invalid image format", 400));
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "Ecommerce/brands",
          public_id: `brand-${uuidv4()}-${Date.now()}`,
          format: ext,
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto" },
          ],
        },
        (error, result) => {
          if (result) resolve(result);
          else reject(new ApiError("Error uploading brand image", 500));
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });

    req.body.image = result.secure_url;
  } catch (error) {
    return next(error);
  }

  next();
});

// @desc      Get all brands
// @route     GET /api/v1/brands
// @access    Public
exports.getBrands = factory.getAll(Brand);

// @desc      Get specific brand by id
// @route     GET /api/v1/brands/:id
// @access    Public
exports.getBrand = factory.getOne(Brand);
// @desc      Create brand
// @route     POST /api/v1/brands
// @access    Private
exports.createBrand = factory.createOne(Brand);

// @desc      Update brand
// @route     PATCH /api/v1/brands/:id
// @access    Private
exports.updateBrand = factory.updateOne(Brand);

// @desc     Delete brand
// @route    DELETE /api/v1/brands/:id
// @access   Private
exports.deleteBrand = factory.deleteOne(Brand);

exports.deleteAll = factory.deleteAll(Brand);
