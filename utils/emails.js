const nodemailer = require('nodemailer');
const pug= require('pug');
const htmlToText = require('html-to-text');


module.exports = class Email {

    constructor(user, url) {

        this.to = user.email;
        this.firsName = user.name.split(' ')[0];
        this.url = url ;
        this.from = `Teyi Lawson <${process.env.EMAIL_FROM}>`

    }

    newTransport() {

        if(process.env.NODE_ENV === "production"){
            // nodemailer
            return 1
        }
        
         // 1- CREATE A TRANSPORTER
        return nodemailer.createTransport({
                host: process.env.EMAIL_HOST,
                port: process.env.EMAIL_PORT,
                auth: {
                    user: process.env.EMAIL_USERNAME,
                    pass: process.env.EMAIL_PASSWORD
                }
            });
    }

    async send(template, subject) {

        // Render HTML based on a pug template
       const html =  pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
           firsName:this.firsName,
           url: this.url,
           subject
       })

        //2-DEFINE THE EMAIL OPTIONS
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html)
        }

        // 3 create transport
        await this.newTransport().sendMail(mailOptions)
    }

    async sendWelcome(){
        await  this.send('welcome', 'Welcome to the natours family!')
    }

    async sendPasswordReset(){
        await this.send('passwordReset' , 'Your password reset token (valid for only 10min)')
    }
}

