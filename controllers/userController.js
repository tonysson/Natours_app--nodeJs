const multer = require('multer');
const sharp = require('sharp');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/appError');
const factory = require('../controllers/HandleFactory');

/**
 * Multer
 */

//  const multerStorage = multer.diskStorage({
//    destination: (req, file, cb) => {
//      cb(null, 'public/img/users');
//    },
//    filename:(req, file, cb) => {
//      const ext= file.mimetype.split('/')[1];
//      cb(null , `user-${req.user.id}-${Date.now()}.${ext}`)
//    }
//  });


// on stocke l'image en memoire en tant k tampon : buffer et on y accede par: req.file.buffer
const multerStorage = multer.memoryStorage()

 const multerFilter = (req, res, cb) =>{
   if(file.mimetype.startsWith('image')){
     cb(null, true)
   }else{
     cb(new AppError('Not an image , Please upload onmy images', 400), false)
   }
 };

const upload = multer({ 
  storage:multerStorage,
  filter:multerFilter
 });



 // Middleware qui permet d'uploader une photo
exports.uploadUserPhoto = upload.single('photo')


//middleware qui permet de redimensionner une image apres l'avoir uploader: on utlise sharp package
exports.resizeUserPhoto = catchAsync (async (req, res, next ) => {
  // on verifie s'il ya pas file ds la request
  if(!req.file){
    return next()
  }
  // si oui on fait ceci:

  //1-on store le filename 
  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

  //2- on configure le sharp
   await sharp(req.file.buffer)
  .resize(500 , 500)
  .toFormat('jpeg')
  .jpeg({quality: 90})
  .toFile(`public/img/users/${req.file.filename}`)

  next();
});


/**
 * Fonction qui nous permet de looper a travers la req.body et de le filtrer
 * on loop a travers Obj et pour chaque elements qui contient le allowedFields on crée un nouvel objet qui a le mm nom et propriété que le Obj en question
 * A la fin on retourne le nouvel objet newObj
 * L'idee est de ne pas avoir tous les champs de la req.body, mais den avoir que klks uns dont on a besoin
 */
const filterObj = (Obj , ...allowedFields) => {
 const newObj = {};
 Object.keys(Obj).forEach(el => {
   if(allowedFields.includes(el)) newObj[el] = Obj[el]
 })
 return newObj

}

//Middleware qui transforme l'id ds le param en id normal: en gros on veut afficher le user sans l'id ds le params
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
}

exports.updateMe = catchAsync( async(req, res, next) =>{

  //Create error if user posted password data
  if(req.body.password || req.body.passwordConfirm){
    return next( new AppError('This route is not for updating password, Please use /updateMyPassword' , 401));
  }

  /**
   * on update le user mais seulement avec les champs 'name' et 'email'
   */

   // Filtered unwated fields name that are not allowed to be updated
  const filterBody = filterObj(req.body , 'name', 'email');

  // if the user want to upload a photo, we just store the filename on our database not the entire path nore the entire image
  if(req.file) filterBody.photo = req.file.filename


  // update user document : name or email or photo
  const updatedUser = await User.findByIdAndUpdate(req.user.id , filterBody , {
    new:true,
    runValidators:true
  });
  
  // SEND RESPONSE
  res.status(200).json({
    status: 'success',
    data:{
      user:updatedUser
    }
  });
});

/**
 * l'idée est de ne pas supprimer le user mais de le rendre innactif pour garder ses donées mm si on lui fait pas savoir :)
 */
exports.deleteMe = catchAsync( async(req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, {
    active:false
  });
  
  res.status(204).json({
    status:'success',
    data: null
  })
});

 
exports.getAllUsers = factory.getAll(User)
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);//Do not update password here
exports.deleteUser = factory.deleteOne(User);
