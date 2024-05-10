const nodemailer = require('nodemailer');
const pug = require('pug');
const { convert } = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Servers Email <marcelo@nouermgmt.com>`;  
  }

  newTransport() {

    if (process.env.NODE_ENV === 'production') {
        console.log('enter')

        return nodemailer.createTransport({
        host: "smtp.postmarkapp.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.POSTMARK_ACCESS_KEY, 
          pass: process.env.POSTMARK_SECRET_KEY, 
        }
      });
    }
    //works for testing
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
        header: 'X-PM-Message-Stream: test'
      },
    });  

  }

  // Send email method
  async send(template, subject) {
    // send email
    // render html for email on pug template

    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
    });

    // define options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: convert(html),
    };
    console.log('this.from', this.from, 'this.to', this.to)
    // create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  // Methods for sending emails welcome / resetPassword

  async sendWelcome() {
    await this.send('Welcome', 'Welcome to the Natours Family');
  }

  async sendPasswordReset(){
    await this.send('passwordReset', 'Your password reset token (valid for 10 minutes')
  }
};
