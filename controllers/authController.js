const {promisify} = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
 const catchAsync = require('./../utils/catchAsync');
 const AppError = require('./../utils/appError');
 const Email = require('./../utils/emails');


 // permet de creer un token
 const signToken = id => {
   return  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
 }

 // permet de creer un token et send une response
 const createSendToken = (user, statusCode, res) => {

     // on crée le token
     const token = signToken(user._id);

     // cookiesOptions
     const cookieOptions = {
         expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
         //secure: true,
         httpOnly: true
     } 
     
     if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;

     // send cookie
     res.cookie('jwt', token ,cookieOptions );

     //on affiche pas le fiel password
     user.password = undefined;

     // on envoit la response
     res.status(statusCode).json({
         status: 'success',
         token,
         data: {
             user
         }
     });

 }

 exports.signup =catchAsync(async (req, res, next) => {
     
    //on crée le new user
    const newUser = await User.create({
        name: req.body.name,
        email:req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt : req.body.passwordChangedAt,
        role: req.body.role
    });

    // on envoit un mail de bienvenu
    const url = `${req.protocol}://${req.get('host')}/me`
    await new Email(newUser, url).sendWelcome();

    // on crée un token et on envoit une response avec notre fnction
    createSendToken(newUser, 201, res);

 });

 exports.login = catchAsync (async(req, res, next) => {

    const {email , password} = req.body

    // 1-check if email or password exist
    if(!email || !password){
        return next( new AppError('Please provide an email and password', 400));
    }

    //2 -check if user exist and password is correct
    // on utilse selecte('+password') pour le faire apparaitre vu kon l'avait deseable ds userModel
    const user = await User.findOne({email}).select('+password')

    if(!user || !(await user.correctPassword(password , user.password))){
        return next( new AppError('Incorrect password or email', 401))
    }

    //3- if everything ok, send token to the user and the response
     createSendToken(user, 200, res);
    // const token = signToken(user._id);
    //  res.status(200).json({
    //     status:'success',
    //     token
    //  });
 });


 /**
  * Normalement quand on se base sur un login just avec un envoi de token on a pas besoin de faire ca
  * Mais ds notre cas on a envoyé le token a travers un cookie dc il nya aucun moyen d'y acceder et de le detruire
  * on implante dc cette methode
  */

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 2 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};

// MIDDLEWARE QUI NOUS PERMET DE PROTEGER NOS ROUTES SPECIFIQUES

 exports.protect = catchAsync(async(req, res, next) => {

    //1-Getting token and cookie and check if it is there
    let token;

    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }else if(req.cookies.jwt){ // avec ca on est dc capable d'authentifié les users via les token send by cookies
        token = req.cookies.jwt;
    }

    if(!token){
        return next( new AppError('Your are not logged in!! Please do it', 401))
    }

    /**
     * 2-Verification du token
     * primisisy() est un package de  node qui est une fonction qui convertit les callback-based en promise-based function
     */
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    /**
     * 3-check if user still exists
     * 
     * Cette partie est beaucoup oubliié par les devs et ils s'arretent souvent sur le 2
     * Mais supposons que le user a été supprimé pdt le tps de la verification?? Son token est valid .donc Problem????????????????
     * un autre cas et supposons que l'utilisateur ait changé de mot de passe?? son token est toujours valide.donc Problem??????????????
     */
     const currentUser = await User.findById(decoded.id);
    if(!currentUser){
        return next( new AppError('The user has no longer this token!!', 401))
    }

    /**
     * 4-Check if user changed password after the token was issued
       iat est disponible quand on crée un token, il nous donne le timestamp de quand 1 token a été crée
     */

     if (currentUser.changedPasswordAfter(decoded.iat)){
         return next(new AppError('User recently changed password, Please log in again', 401));
     } 

    //If all those verification is successfull , GRANT ACCESS TO THE PROTECTED ROUTE // tres important
     req.user = currentUser; 

     // nous permet d'acceder au user ds les template
     res.locals.user = currentUser

     
     next();
 });

 //Middleware qui nous permet de log in: only for rendering pages , no error
 // pour le loogin on a stocké le token ds le cookie dc plus besoin de verifier le token ds le header mais plutot ds le cookie

 exports.isLoggedIn = async(req,res, next) =>{
     if(req.cookies.jwt){
         
        try {

            // 1- verify the token in the cookie
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );

            //2-check if user still exist
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }

            // 3- checked if user changed password
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }

            // 4- OK? There is logged in user
            res.locals.user = currentUser;
            return next();
            
        } catch (error) {
           return next();
        }
     }
     next();
 };

 /**
  * Normalement on ne peut pas passer d'arguments dans un middlware function , mais dans notre cas on en a besoin 
  * on a beso in de passer les roles pour donner acces o gens.
  * La SOLUTION est de creer a wrapper function qui va donc return notre middlware function.
  * On utilise donc le "rest parameter syntax" qui est nouveau en es6 qui va donc creer un array de tous les arguments specifiés
  * Dans notre cas (...roles) est un array de ['admin', 'lead-guide']
  */

 exports.restrictTo = (...roles) => {

    return (req, res, next) => {
        // roles = ['admin', 'lead-guide]. role = 'user'
        // si le role de l'utilisateur(req.user.role) ne contient pas nos roles ['admin', 'lead-guide] definis sur ce middlaware, alors on retourne une erreur
        if(!roles.includes(req.user.role)){
            return next( new AppError('You do not have permission to perform this action', 403));
        }

        // si tout va bien
        next();
    };
 };

exports.forgotPassword = catchAsync( async(req, res, next) => {

    // 1-Get user based on email
    const user = await User.findOne({email:req.body.email})
    if(!user){
        return next( new AppError('There is no user with that email adress', 404))
    }

    //2- Generate the random reset token
    const resetToken = user.createPasswordResetToken();
      // on le save ds la bdd: l'option validateBeforeSave : false nous permet de supprimer ttes nos validations avt la sauvegarde
      await user.save({ validateBeforeSave : false});

    try {

       //3-Send mail
       const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`
    
       await new Email(user, resetURL).sendPasswordReset()

       res.status(200).json({
           status: 'success',
           message: 'Token sent to email'
       })
    } catch (error) {
       user.passwordResetToken = undefined;
       user.passwordResetExpires = undefined;
       await user.save({ validateBeforeSave: false });

       return next( new AppError('There was an error sending email, please try again!!',500))
   }


});

exports.resetPassword = catchAsync ( async(req, res, next) => {

    /**
       * Get user based on the token
       * on doit comparer le token non crypté ds l'url du user au token crypté ds notre BDD
       * DONC on doit dabord hashé le token pour pouvoir le comparé
       * on verifie aussi si le token n'a pas expiré
       */

    // on hash le token contenu ds l'url 
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    // on verifie si c'est le mm token que celui ds la bdd et s'il n'est pas expriré
    const user = await User.findOne({
        passwordResetExpires: { $gt: Date.now()},
        passwordResetToken: hashedToken
    });

    //If token has not expires and both tokens are the same, set the new password, updated it and save it
    if (!user) {
        return next(new AppError('Token is expired or invalid', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // log the user in , send a jwt token
    createSendToken(user, 200, res);
    // const token = signToken(user._id);
    // res.status(200).json({
    //     status: 'success',
    //     token
    // });

 });


 exports.updatePassword = catchAsync( async (req, res, next) => {

    //1-Get user from collection
    const user = await User.findById(req.user.id).select('+password');

    //2-on verifie si le mot de passé rentré par l'utilisateur est le mm que celui ds la bdd: on utilse notre function correctPassword()
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next(new AppError("The password is wrong", 401))
    }

    //3-Si tout va bien on update le mot de passe et on le save()
    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save();
     
    //Log user in and send JWT
     createSendToken(user, 200, res);

 });