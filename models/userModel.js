const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required: [true , 'Please tell us your name!'],
        trim:true
    },

    email:{
        type:String,
        required: [true, 'Please provide your email'],
        unique:true,
        lowercase:true,
        validate : [validator.isEmail, 'Please provide a valid email']
    },

    photo:{
        type:String,
        default:'default.jpg'
    },


   role:{
       type:String,
       enum:['user', 'guide' , 'lead-guide', 'admin'],
       default: 'user'
   },

    password: {
        type:String,
        required: [true, 'Please provide a password'],
        minlength : 8,
        select: false // pour ne pas afficher le password o client
    },

    passwordConfirm : {
        type:String,
        required: [true, 'Please confirm your password'],
        validate:{
            // works only on CREATE ans SAVE() method not update()
            validator: function(el){
                return el === this.password
            },
            message:'Both password are not the same'
        }
    },

    passwordChangedAt: Date,
    passwordResetToken :String,
    passwordResetExpires:{
        type : Date
    },
    active:{
        type:Boolean,
        default:true,
        select:false
    }
});


/**
 * Nous permet de crypter le mot de passe avant de l'enregistrer dans la bdd
 */
userSchema.pre('save', async  function(next) {
    
    // au cas ou on ne modifie le password, on ne fait rien
    if(!this.isModified('password')) return next();

     // sinon on crypt 
    this.password = await bcrypt.hash(this.password, 12);

    // on  n'enregistre pas le passwordConfirm en bdd
    this.passwordConfirm = undefined;

    next()
});

//MIDDLEWARE QUI S'EXECUTE AVANT DE SAVE UN NOUVEAU DOCUMENT

userSchema.pre('save', function(next){
    if (!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000

    next()
});

/**
 *  QUERY MIDDLEWARE QUI S'EXECUTE AVANT TOUT QUERY COMMENCANT PAR FIND
 * ----------------------------------------------------------------------
 * le but etant de ne read, update, delete que  ts les users qui ont le champs active a treu en gros qui sont actifs (non-supprimé)
 */

 userSchema.pre(/^find/, function(next){
     this.find({active : {$ne: false}});
     next();
 })




/**
 * Nous permet de verifier si le mot de passe saisi par l'utilisateur est le mm que celui enrégistré ds la bdd
 * 
 * on appelle cette methode "instance method" qui est une methode qui disponible sur tous le document, dans notre cas le document user
 */
userSchema.methods.correctPassword = async function(candidatePassword , userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

/**
 * Nous permet de comparer l'instant ou 1 mot a été changé et l'instant ou on genere un nouveau token dans le but de s'asssurer que c'est toujours le mm user.
 * 
 */

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

/**
 * Nous permet de generer un token aleatoir dans le but de l'envoyer au client qui aurait envi de changer son mot de passe
 */

userSchema.methods.createPasswordResetToken = function(){

    // on crée le token
    const resetToken = crypto.randomBytes(32).toString('hex');


    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    //console.log({ resetToken }, this.passwordResetToken);
    
    // on sauvegarde également la date d'expiration en BDD (10min)
    
    this.passwordResetExpires = Date.now() + 600000

    //console.log(this.passwordResetExpires);
    
    

    return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;