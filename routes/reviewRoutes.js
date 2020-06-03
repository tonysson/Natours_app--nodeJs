const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController')

//  mergeParams a true nous permet d'acceder au parametre tourId qu'on a specifié ds tourRoutes pour le nested routes
const router = express.Router({ mergeParams:true});

router.use(authController.protect);

router.route('/')
.get(reviewController.getAllReviews)
.post(
    authController.restrictTo('user'),
    reviewController.setTourUsersIds,
    reviewController.createReview
);

router.route('/:id')
.get(reviewController.getReview)
.patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
.delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview)

module.exports = router