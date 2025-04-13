const { v4: uuidv4 } = require("uuid");
const asyncHandler = require("express-async-handler");
const streamifier = require("streamifier");
const cloudinary = require("../utils/cloudinary");
const Product = require("../models/productModel");
const ApiError = require("../utils/apiError");
const factory = require("./handlersFactory");
const { uploadMixedImages } = require("../middlewares/imageUpload");

// Upload middleware for product images
exports.uploadProductImages = uploadMixedImages([
  { name: "imageCover", maxCount: 1 },
  { name: "images", maxCount: 5 },
]);

// Resize and upload images to Cloudinary
exports.resizeProductImages = asyncHandler(async (req, res, next) => {
  // Handle imageCover
  if (req.files && req.files.imageCover && req.files.imageCover.length > 0) {
    const file = req.files.imageCover[0];
    const ext = file.mimetype.split("/")[1];

    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "Ecommerce/products",
            public_id: `product-${uuidv4()}-${Date.now()}-cover`,
            format: ext,
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(new ApiError("Error uploading imageCover", 500));
          }
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      req.body.imageCover = result.secure_url;
    } catch (error) {
      return next(error);
    }
  }

  // Handle additional images
  if (req.files && req.files.images && req.files.images.length > 0) {
    req.body.images = [];

    try {
      await Promise.all(
        req.files.images.map(async (img, index) => {
          const ext = img.mimetype.split("/")[1];

          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: "products",
                public_id: `product-${uuidv4()}-${Date.now()}-${index + 1}`,
                format: ext,
              },
              (error, result) => {
                if (result) resolve(result);
                else reject(new ApiError("Error uploading product image", 500));
              }
            );

            streamifier.createReadStream(img.buffer).pipe(uploadStream);
          });

          req.body.images.push(result.secure_url);
        })
      );
    } catch (error) {
      return next(error);
    }
  }

  next();
});
// @desc      Get all products
// @route     GET /api/v1/products
// @access    Public
exports.getProducts = factory.getAll(Product, "Products");

// @desc      Get specific product by id
// @route     GET /api/v1/products/:id
// @access    Public
exports.getProduct = factory.getOne(Product, "reviews");

// @desc      Create product
// @route     POST /api/v1/products
// @access    Private
exports.createProduct = factory.createOne(Product);

// @desc      Update product
// @route     PATCH /api/v1/products/:id
// @access    Private
exports.updateProduct = factory.updateOne(Product);

// @desc     Delete product
// @route    DELETE /api/v1/products/:id
// @access   Private
exports.deleteProduct = factory.deleteOne(Product);

// Delete All Products
exports.deleteAll = factory.deleteAll(Product);
