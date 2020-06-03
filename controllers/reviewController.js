const Review = require('../models/reviewsModel');
const factory = require('../controllers/HandleFactory');
// const AppError  = require('../utils/appError');
// const catchAsync = require('../utils/catchAsync');



// MIDLLWARE QUI S'EXCEUTE AVANT LA CREATION D'UN REVIEW: il me permet d'avoir l'id de l'utilisateur qui crée le commentaire et l'id du tour sur lequel le commentaire est crée
exports.setTourUsersIds = (req, res, next) => {
    // allow nested routes
    if (!req.body.tour) req.body.tour = req.params.tourId;
    if (!req.body.user) req.body.user = req.user.id;
    next();
}

exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);