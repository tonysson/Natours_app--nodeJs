
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('../controllers/HandleFactory');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');


const multerStorage = multer.memoryStorage()

const multerFilter = (req, res, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true)
  } else {
    cb(new AppError('Not an image , Please upload onmy images', 400), false)
  }
};

const upload = multer({
  storage: multerStorage,
  filter: multerFilter
});

exports.uploadTourImage = upload.fields([
  {name: 'imageCover', maxCount:1},
  {name:'images', maxCount:3}
]);

// quand il y a une seule image a upload  upload.single('image') , req.file
//quand il y a un champ avec plusieurs image a upload , upload.array('images', 5) , req.files

exports.resizeTourImages = catchAsync( async(req, res, next) => {

  if(!req.files.imageCover || !req.files.images) return next()


  // 1-Cover image
  
  // on definit le nom de l'image
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`

  // on resize
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

    // on enregistre le nom de l'image ds notre bdd
  

  // 2- images
  
  // on itnitialise l'array
  req.body.images = [];

  // comme c'est un array on utilise Promise all() et et loop a travers l'array 

  await Promise.all( req.files.images.map( async(file , i) => {

    // on definit le nom de l'image
    const filenane = `tour-${req.params.id}-${Date.now()}-image-${ i + 1 }.jpeg`

    // on resize
    await sharp(file.buffer)
      .resize(2000, 1333)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/img/tours/${filenane}`);

    // on enregistre le nom de l'image ds notre bdd: comme c'est un array on utilise push
    req.body.images.push(filenane);

  }))

  

  next()
});



exports.aliasTopTours = async(req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-ratingsAverage";
  req.query.fields = "name, price, ratingsAverage , summary , difficulty"
  next();
}

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);



exports.getTourStats =catchAsync (async(req, res) => {

  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },

    {
      $sort: { avgPrice: 1 }
    },

    {
      $match: { _id: { $ne: 'EASY' } } // $ne = not equal to
    }

  ]);
  res.status(200).json({
    staus: 'success',
    data: {
      stats
    }
  })

  
});

/**
 * l'idee c'est de trouver le mois ou les activités seront a la hausse en saisissant n'importe quelle année
 * dans l'url
 * 
 */

exports.getMonthlyPlan = catchAsync (async (req, res, next) => {

  const year = req.params.year * 1 // le * 1 pour le transforme en nombre

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates' // on recherche d'abord par startDate genre ts les tours qui commencent en 2021 par exemple
    },

    {
      $match: { // ici on match notre recherche sur l'année bien precise (genre 01-01-2021 au 31-12-2021)
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },

    {
      $group: { // ici on recherche dc les mois de l'année avec le nombre de tours

        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' } // on veut avoir le nom des tours , c'est un array dc on utilise push

      }
    },

    {
      // nous permet d'ajouter d'autres champs sur autre  champs , ici on (remplace) _id par month
      $addFields: { month: '$_id' }
    },

    {
      // permet de ne plus afficher le champ remplacé: ds notre cas on veut plus afficher _id
      $project: { _id: 0 }
    },

    {
      // on sort le resultat par ascendant
      $sort: { numTours: -1 }
    }

  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  })

});

// /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/34.111745,-118.113491/unit/mi
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // tt ce qui est ds l'url
  const [lat, lng] = latlng.split(',');

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; // radian de la terre en milles

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitute and longitude in the format lat,lng.',
        400
      )
    );
  }

  // available in documentation, 
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours
    }
  });
});


exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; // conversion en miles ou en km

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitutr and longitude in the format lat,lng.',
        400
      )
    );
  }

  const distances = await Tour.aggregate([
    {
      // doit tjrs etre le premier
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1] // on les multiplie par 1 pour les convertir en nombre
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier
      }
    },
    {
      // nous permet de definir les champs qu'on veut afficher
      $project: {
        distance: 1,
        name: 1
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances
    }
  });
});





