const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIfeatures = require('../utils/apifeatures');


exports.getAll = Model => catchAsync(async (req, res, next) => {

    // allow for nested GET reviews on tour
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId }

    // EXECUTE THE QUERY
    const features = new APIfeatures(Model.find(filter), req.query)
        .filter()
        .sort()
        .limitFields()
        .pagination();

    const doc = await features.query
    // const doc = await features.query.explain(); explain() nous a permi de voir les details kd on utilisé index

    //SEND RESPONSE
    res.status(200).json({
        status: 'success',
        result: doc.length,
        data: {
            data:doc
        }
    });
});

exports.getOne = (Model, popOptions) => catchAsync(async (req, res, next) => {

    // search the Model  byId, populate() permet d'avoir des info completes sur les "guides" du tour en question
    let query = Model.findById(req.params.id);
    if(popOptions) query = query.populate(popOptions);
    const doc = await query;

    // if no doc match with the id handling the error
    if (!doc) {
        return next(new AppError('No document found with that id', 404))
    }

    // SEND RESPONSE
    res.status(201).json({
        status: 'success',
        data: {
          data:  doc
        }
    });
});


exports.createOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.create(req.body);

    res.status(200).json({
        status: 'success',
        data: {
          data: doc
        }
    });

});

exports.updateOne = Model => catchAsync(async (req, res, next) => {

    //Serach by id
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    // if no doc match with the id, handling the error
    if (!doc) {
        return next(new AppError('Nodocuments found with that id', 404))
    }

    // send response
    res.status(200).json({
        status: 'success',
        data: {
            data: doc
        }
    });

});

exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    //search the document
    const doc = await Model.findByIdAndDelete(req.params.id);

    // if no document match with the id handling the error
    if (!doc) {
        return next(new AppError('No documents found with that ID', 404))
    };

    // if so ,  send response
    res.status(204).json({
        status: 'success',
        data: null
    });
});



