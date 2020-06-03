/**
 * Elle nous permet de se passer du try and catch block ds nos fnction et de la maniere autonome de gerer les erreurs
 */

module.exports = fn => {

    return (req, res, next) => {
        fn(req , res, next).catch(next)
    }
}