const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authController')

//  mergeParams a true nous permet d'acceder au parametre tourId qu'on a specifié ds tourRoutes pour le nested routes
const router = express.Router();

router.use(authController.protect);

router.get('/checkout-session/:tourId', bookingController.getCheckoutSession);



router.use(authController.restrictTo('admin', 'lead-guide'));


router
.route('/')
.get(bookingController.getAllBookings)
.post(bookingController.createBooking)

router
.route('/:id')
.get(bookingController.getBooking)
.patch(bookingController.updateBooking)
.delete(bookingController.deleteBooking)

module.exports = router;