const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');




const app = express();

//Template engine
app.set('view engine' , 'pug');

//Path to the template
app.set('views' , path.join(__dirname, 'views'));

//  MIDDLEWARES

// setting static files
app.use(express.static(path.join(__dirname, 'public')));


// Set Security HTTP headers
app.use(helmet());

//Developpment logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
};

// il permet de limiter a 100 requests par heure venant d'une mm adress IP: important pour la securité
const limiter = rateLimit({
  max:100,
  windowMs : 60 * 60 * 1000,
  message:'Too many requests from this IP, Please try again in one hour!!'
});
app.use('/api', limiter);


//Body-parser , reading data from data into req.body
app.use(express.json({ limit: '10kb'}));// parse the data from the body
app.use(express.urlencoded({extended: true, limit:'10kb'})) // permet de passer des data venant des url
app.use(cookieParser()) // parse data from cookies

//Data sanitization agains Nosql injection
app.use(mongoSanitize());

//data sanitization against xss 
app.use(xss());

//Prevent parameters hpp
app.use(hpp({
  whitelist: [
    'duration',
    'ratingsQuantity',
    'ratingsAverage',
    'maxGroupSize',
    'difficulty',
    'price'
  ]
}));

app.use(compression());

//  ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter)



// la page d'erreur global
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
});

// ERROR HANDLING MIDDLWARE
app.use(globalErrorHandler);


module.exports = app;
