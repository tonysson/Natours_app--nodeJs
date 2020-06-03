const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModel');

const tourSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },

    slug: String,

    duration:{
        type:Number,
        required: [true, 'A tour must have a duration']
    },
    
    maxGroupSize : {
        type: Number,
        required: [true, 'A tour must have a maxGroupSize']
    },    

    difficulty:{
        type:String,
        required: [true, 'A tour must have a difficulty'],
        enum : {
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is eather: easy , medium or difficult'
        }
    },

    ratingsAverage:{
        type:Number,
        default:4.5,
        min: [1 , 'Rating must be above 1.0'],
        max:[5 , 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) / 10  //PERMET D'ARRONDIRE UN NOMBRE
    },

    ratingsQuantity:{
        type: Number,
        default: 0
    },

    price:{
        type:Number,
        required: [true, 'A tour must have a price']
    },

    priceDiscount: {
        type: Number,
        validate :{
            
            // function crée pour valider nous mm si le prix de reduction est inferieur au prix normal du produit
            //Elle ne marche que si on crée un nouceau document pas qd on update
            validator: function (val) {
                return val < this.price
            },
            message: 'Discount price ({VALUE}) should be below regular price'     
        }
    },

    summary:{
        type:String,
        trim: true,
        required: [true, 'A tour must have a summary']
    },

    description: {
        type:String,
        trim:true
    },


    imageCover:{
        type:String,
        required: [true, 'A tour must have an imageCover']
    },

    images:[String],

    createdAt: {
        type: Date,
        default:Date.now(),
        select:false
    },

    startDates : [Date],

    secretTour : {
        type:Boolean,
        default: false
    },

    startLocation : {
        type:{
            type:String,
            default:'Point',
            enum:['Point']
        },

        coordinates : [Number],
        address: String,
        description:String
    },

    // c'est pour creer un embeded document au sein de notre document tour, on specifie toujour un array et deds on specifie notre objet
    locations : [
        {
            type:{
                type:String,
                default: 'Point',
                enum: ['Point']

            },
            coordinates: [Number],
            address: String,
            description: String,
            day:Number
        }
    ],

    // permet de referencer un document sur un autre: ca crée dc une relation entre les deux documents
    guides:[
        {
            type:mongoose.Schema.ObjectId,
            ref:'User'
        }
    ]


}, {
    toJSON:   { virtuals : true}, // nous permet d'activer le champ virtuel
    toObject : { virtuals:true}
});

/**
 * INTERVIENT DANS LA PERFORMANCE DE NOS REQUETES
 * --------------------------------------------------------
 * habituelement qd on lance une requete , mongodb va examiner tous nos document et nous sortir un resultat
 * avec le 'index', on pointe un field specifique , dans ce cas mongodb ne va plus analyser tous nos documents
 * mais o contraire le field sur lequel on pointe notre requete. on peut en mettre autant qu'on veut
 * L'idee etant de bien analyser notre app et de se demander lesquelles requetes seront frequentes
 */
tourSchema.index({ price : 1 , ratingsAverage: -1});
tourSchema.index({ slug:1 });
tourSchema.index({startLocation : '2dsphere' }); // on parle de point sur la terre dc on utilise 2dsphere(dimension)

// pour creer un champ virtuel cest a dire un champ qui ne sera pas present en database mais qui sera affiché lorquon accede a nos donnés , on utilise cette methode
tourSchema.virtual('durationWeek').get(function(){
    return this.duration / 7
});

// Virtual Populate: nous permet de referencer les reviews (commentaires) sur le model tour mais de facon virtual.En gros il ne se trouvera pas ds la base de donnée mais visible si on lance une requete sur les tours
tourSchema.virtual('reviews', {
    ref: "Review",
    foreignField:'tour',
    localField: '_id'
});

//DOCUMENT MIDDLEWARE: il est executé avant l'event save() ou create()
tourSchema.pre('save', function(next){
    this.slug = slugify(this.name, {lower:true})
    next()
});

/**
 *  DOCUMENT MIDDLEWARE: vu qu'on a inséré des guides (users) ds le tourmodel on veut avoir les info des guides.on crée dc ce midlware qui nous permet de looper ds  le field guides et d'aller chercher les info du user (guide) en question juste avec son id qui est referencé. on a utilisé primise.all() parceque guidesPromise est un array de promise.
 * --------------------------------------------------------------------------------------------------------------
 * Tout ce processus est ce qu'on appel embeded document: mais elle est complexe
 * Vaut mieux opter pour reference
 */
// tourSchema.pre('save', async function(next){
//     const guidesPromise = this.guides.map( async id => await User.findById(id));
//     this.guides = await Promise.all(guidesPromise);
//     next();
// })

//QUERY MIDDLEWARE: /^find/ expression reguliere qui signifie qu'on veut executer ce middleware pour les query commencant par find
tourSchema.pre(/^find/, function(next){
    this.find({secretTour : {$ne: true}})
    next()
});

// Query middleware: permet de visualiser les info du (guides) quand on lance ts query find() sur un Tour
tourSchema.pre(/^find/ , function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    });

    next()
})

//AGGREGATE MIDDLWARE: unshift() permet de mettre un element en debut d'un array
// tourSchema.pre('aggregate', function(next){
//    this.pipeline().unshift({$match : {secretTour: {$ne:true}}})
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports= Tour