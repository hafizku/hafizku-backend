class ParentalPraiserRepository {
  async addParentalPraise(verseMemoId, parentId, childId, addParentalPraise) {
    throw new Error('PARENTAL_PRAISE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async editParentalPraise(parentalPraiseId, parentId, childId, editParentalPraise) {
    throw new Error('PARENTAL_PRAISE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async deleteParentalPraise(parentalPraiseId) {
    throw new Error('PARENTAL_PRAISE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

  async getParentalPraise(verseMemoId, childId) {
    throw new Error('PARENTAL_PRAISE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  }

}

module.exports = ParentalPraiserRepository;