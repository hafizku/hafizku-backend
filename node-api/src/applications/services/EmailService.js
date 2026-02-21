class EmailService {
  async sendWelcomeEmail(email, name) {
    throw new Error('EMAIL_SERVICE.METHOD_NOT_IMPLEMENTED');
  }

  async sendResetPassword(email, code) {
    throw new Error('EMAIL_SERVICE.METHOD_NOT_IMPLEMENTED');
  }

  async sendSuccessResetPassword(email) {
    throw new Error('EMAIL_SERVICE.METHOD_NOT_IMPLEMENTED');
  }
}

module.exports = EmailService;