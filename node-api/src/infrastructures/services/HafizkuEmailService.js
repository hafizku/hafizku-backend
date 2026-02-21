/* istanbul ignore file */
const EmailService = require("../../applications/services/EmailService");


class HafizkuEmailService extends EmailService {
  constructor(nodemailer) {
    super();
    this._transporter = nodemailer.createTransport({
      host: 'mail.hafizku.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_ADDRESS,
        pass: process.env.MAIL_PASSWORD,
      },
    });
  }

  async sendWelcomeEmail(email, name) {
    const message = {
      from: 'Hafizku" <no-reply@hafizku.com>',
      to: email,
      subject: 'Selamat Datang di Hafizku!',
      html: `<h1>Assalamulalaikum, ${name}</h1>`
    };
    return this._transporter.sendMail(message);
  }

  async sendResetPassword(email, token) {
    const resetUrl = `https://hafizku.com/reset-password?token=${token}`;
    const message = {
      from: 'Hafizku" <no-reply@hafizku.com>',
      to: email,
      subject: 'Reset Password - Hafizku',
      html: `<p>Anda meminta reset password. Klik link di bawah ini:</p>
               <a href="${resetUrl}">Reset Password Saya</a>
               <p>Link ini akan kedaluwarsa dalam 30 menit.</p>`
    };
    return this._transporter.sendMail(message);
  }

  async sendSuccessResetPassword(email) {
    const message = {
      from: 'Hafizku" <no-reply@hafizku.com>',
      to: email,
      subject: 'Success Reset Password - Hafizku',
      text: 'Password anda telah berhasil direset.\n\nBila Anda tidak pernah melakukan permintaan di atas harap segera hubungi kami ke email admin@hafizku.com.',
    };
    return this._transporter.sendMail(message);
  }
}

module.exports = HafizkuEmailService;