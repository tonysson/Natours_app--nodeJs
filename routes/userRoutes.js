const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController'); 


const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/**
 * On doit proteger toutes les routes ci dessous
 * Au lieu d'ajouter authController.protect a toutes ces routes on peut juste faire ceci:
 * car c'est just un middleware: on le met avant toutes ces routes , il s'execute avant 
 */
router.use(authController.protect)

router.patch('/updateMyPassword', authController.updatePassword);

router.get('/me',  userController.getMe, userController.getUser);
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

/**
 * la mm chose ici donc on veut que ce soit que l'admin qui ait access a ces routes on met donc en place ce middlware
 */
router.use(authController.restrictTo('admin'))

router
  .route('/')
  .get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);
 
module.exports = router;
