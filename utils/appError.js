class AppError extends Error {

    /**
     * 1-On extends Error pour pouvoir beneficier (heriter) de l'objet Error
     * 2-Quand on extends une classe parente , on utilise super() pour faire appel a cette classe parente
     * 3-captureStackTrace() est utilisé pour nous dire sur quelle ligne de notre code on a une erreur
     * 4-on a pas definit message parceque vu qu'on l'a appelé sur super, la classe parente va venir avec message
     */

    constructor(message, statusCode){
        super(message);
        
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor)

    }
}

module.exports = AppError