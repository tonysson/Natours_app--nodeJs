const dotenv = require('dotenv');
const mongoose = require('mongoose');



process.on('uncaughtException', error => {
  //  console.log(error);
    process.exit(1);
})

dotenv.config({ path: './config.env' });
const app = require('./app');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);

mongoose.connect(DB, {
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false
}).then(result => {
  console.log(result.connections);
   console.log('DB coonection succesfully'); 
})


const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
   console.log(`App running on port ${port}...`);
});

/**
 * Gestion de l'erreur unhandledRejection , l'erruer qui se produit quand on arrive pas a se connecter a la bdd   par exemple 
 * pour gerer ca on ecoute l'event par process.on(), puis on ferme le server et apres on shut down notre app
 *--------------------------------------------------------------------------------------------------------------
 La deuxieme erreur a gerer est le "uncaught exception" sont toutes les autres bugs qui peuvent se passer et qu'on pas gerer; elle est placée en debut de notre code
 */

 process.on('unhandledRejection', error => {
   //console.log(error);
   server.close(() => {
     process.exit(1)
   });
 });

 