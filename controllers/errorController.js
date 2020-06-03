const AppError = require('../utils/appError');
/**
 *  ERROR HANDLING MIDDLWARE
 * Quand on passe 4 arguments ds la function express sait que c'est pour la gestion des erreurs
 */

const handleCastErrorDB = (error) => {
   const message = `Invalid ${error.path}: ${error.value}`

   return new AppError(message , 400);
}

const handleDuplicateFieldsDB = (error) => {

    const value = error.errmsg.match(/([""])(\\?.)*?\1/)[0]
    const message = `Duplicate field value ${value} .Please use another value!`
    return new AppError(message, 400);
}

const handleValidationErrorDB = (error) => {
    const errors = Object.values(error.errors).map(el => el.message)
    const message = `Invalid input data ${errors.join('. ')} .Please use another value!`
    return new AppError(message, 400);
}

const handleJWTError = () => {
    return new AppError('Invalid Token, Please log in again', 401);
}

const handleJWTExpiredError = () => new AppError('Your token has expired, Please log in again', 401);



const sendDevError = ( error, req, res) => {
     if(req.originalUrl.startsWith('/api')){
         res.status(error.statusCode).json({
             error,
             status: error.status,
             message: error.message,
             stack: error.stack
         });
     }else{
         res.status(error.statusCode).render('error', {
             title: 'Error page',
             msg: error.message
         })
     }
 }


const sendProdError = (error, req, res) => {
    // A) API
    if (req.originalUrl.startsWith('/api')) {
        // A) Operational, trusted error: send message to client
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: error.status,
                message: error.message
            });
        }
        // B) Programming or other unknown error: don't leak error details
        // 2) Send generic message
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }

    // B) RENDERED WEBSITE
    // A) Operational, trusted error: send message to client
    if (error.isOperational) {
        return res.status(error.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: error.message
        });
    }
    // B) Programming or other unknown error: don't leak error details
   
    // 2) Send generic message
    return res.status(error.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later.'
    });
};


module.exports = (error, req, res, next) => {
    error.statusCode = error.statusCode || 500;
    error.status = error.status || 'error';

    if(process.env.NODE_ENV === 'development'){
        sendDevError(error,req,res)
    } else if (process.env.NODE_ENV === 'production'){
        let err = {...error}
        if(err.name === 'CastError') err = handleCastErrorDB(err);
        if(err.code === 11000) err = handleDuplicateFieldsDB(err);
        if(err.name === 'ValidationError') err = handleValidationErrorDB(err);
        if(err.name === 'JsonwebTokenError') err = handleJWTError();
        if (err.name === 'TokenExpiredError') err = handleJWTExpiredError();
        sendProdError(err, req, res);
    }
};