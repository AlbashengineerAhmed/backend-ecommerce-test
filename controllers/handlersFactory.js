const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const ApiFeatures = require("../utils/apiFeatures");


exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(
        new ApiError(`No document found for this id: ${req.params.id}`, 404)
      );
    }

    document.remove(); // Trigger 'remove' event if any
    res.status(204).send(); // No content
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!document) {
      return next(
        new ApiError(`No document found for this id: ${req.params.id}`, 404)
      );
    }

    const doc = await document.save();
    res.status(200).json({ data: doc });
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    try {
      const newDoc = await Model.create(req.body);
      res.status(201).json({ data: newDoc });
    } catch (error) {
      if (error) {
        // Handle duplicate key error
        const field = Object.keys(error.keyValue)[0];
        const value = error.keyValue[field];
        return next(
          new ApiError(`Duplicate ${field}: ${value} already exists`, 400)
        );
      }
      return next(error);
    }
  });
exports.getOne = (Model, populateOpts) =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    let query = Model.findById(id);
    if (populateOpts) query = query.populate(populateOpts);

    const document = await query;

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }

    res.status(200).json({ data: document });
  });

exports.getAll = (Model, modelName = "") =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObject) {
      filter = req.filterObject;
    }

    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    const docsCount = await Model.countDocuments(apiFeatures.mongooseQuery);
    apiFeatures.paginate(docsCount);

    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    res
      .status(200)
      .json({ results: docsCount, paginationResult, data: documents });
  });

exports.deleteAll = (Model) =>
  asyncHandler(async (req, res, next) => {
    await Model.deleteMany();
    res.status(204).send();
  });
