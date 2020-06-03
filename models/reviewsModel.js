const mongoose = require('mongoose');
const Tour = require('./tourModel')

const reviewSchema = new mongoose.Schema({

    review :{
        type:String,
        required:[ true , 'Review can not be empty']
    },

    rating:{
        type:Number,
        min:1,
        max:5,
    },
     
    createdAt : {
        type:Date,
        default: Date.now
    },

    tour:{
        type:mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true, "Review must belong to a tour"]
    },

    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, "Review must belong to an user"]
    }


}, {
    toJSON: { virtuals: true }, // nous permet d'activer le champ virtuel
    toObject: { virtuals: true }
});

// Empeche un utilisateur de noter deux fois un mm tours
reviewSchema.index({tour:1 , user : 1}, {unique : true});


//query middleware: nous permet de voir quelques details suu le user auquel se refere le commentaire
reviewSchema.pre(/^find/, function(next){

    this.populate({
        path: 'user',
        select: 'name photo'
    });

    next()
});

/**
 * ds une methode statics this se refere au model donc a Review
 * 1-ds aggregate on passe un tableau de tous etapes qu'on veut
 * 2-on selectionne le tour qu'on veut update avec $match: 
 * 3-l'autre etape est de calculer la statistique
 *   -pour ca on utlise $group, 
 *   -Dans $group le premier argument qu'on specifie c'est le _id: qui est le champ commun sur lequel on veut goupby , ds notre cas "tour"
 *   -
 */

reviewSchema.statics.calcAverageRatings = async function(tourId){
  const stats =  await this.aggregate([
        {
            $match:{ tour : tourId}
        },
        {
          $group : {
              _id: '$tour',
              nRating: { $sum : 1}, // mets a jour automatiquement le nombre de fw que le tour a été noté
              avgRating:{$avg : '$rating'} // $avg calcule la moyenne automaiquement sur le champs specifié
          }
        }
    ]);
   // console.log(stats);
   // on trouve le tour en question qui a été noté et on update
   if(stats.length > 0){
       await Tour.findByIdAndUpdate(tourId, {
           ratingsQuantity: stats[0].nRating,
           ratingsAverage: stats[0].avgRating
       });
   }else{
       await Tour.findByIdAndUpdate(tourId, {
           ratingsQuantity: 0,
           ratingsAverage: 4.5
       });
   }
};

/**
 * l'idee est de faire Review.calcAverageRatings() mais c'est impossible car Review n'est pas accessible ds cette fction. La seule facon de le faire est d'utiliser this.constructor qui pointe sur le model dc Review

 * MIDDLEWARE QUI VA S'EXECUTER APRES QU'UN COMMENTAIRE(commentaire + note) AIT ETE POSTE ET SAUVEGARDE EN BDD
 on utilse poste('save') parce qu'on veut que le (commentaire + note) soit d'abords stocké en bdd avant de faire notre calcul de nombre de note et la moyenne
 -------------------------------------------------------------------------------------------------------------
                      W      A     R      N       I    N    G
 -------------------------------------------------------------------------------------------------------------                  
 A cette etape on si un commentaire(reviews + note) a été supprimé ou modifé , ca ne mets pas a jour automatiquement le nombre de note et la moyennne . les 2 methodes suivantes permettent de le faire
  */
 reviewSchema.post('save', function(){
   this.constructor.calcAverageRatings(this.tour);
 });


 /**
  * Dans un query middleware le this pointe sur le query
  * on stocke sa valeur ds this.r pour pouvoir avoir y acces ds le post midlware apres
  */

  reviewSchema.pre(/^findOneAnd/, async function(next){
      this.r = await this.findOne(); // nous retourne le document
      next()
  });

  reviewSchema.post(/^findOneAnd/, async function(){
    // await this.findOne() Does not work here , le qery est deja executé
      await this.r.constructor.calcAverageRatings(this.r.tour)
  })



const Review = mongoose.model('Review', reviewSchema);

module.exports = Review