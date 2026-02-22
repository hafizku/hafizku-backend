const AddParentalPraise = require("../../domains/parental_praise/entities/AddParentalPraise");
const EditParentalPraise = require("../../domains/parental_praise/entities/EditParentalPraise");

class ParentalPraiseUseCase {
  constructor({ parentalPraiseRepository, userRepository }) {
    this._parentalPraiseRepository = parentalPraiseRepository;
    this._userRepository = userRepository;
  }

  async addParentalPraise(verseMemoId, parentId, childId, useCasePayload) {

    const addParentalPraise = new AddParentalPraise(useCasePayload);

    const data = await this._parentalPraiseRepository.addParentalPraise(verseMemoId, parentId, childId, addParentalPraise);

    return data;
  }

  async editParentalPraise(parentalPraiseId, parentId, childId, useCasePayload) {

    const editParentalPraise = new EditParentalPraise(useCasePayload);

    return this._parentalPraiseRepository.editParentalPraise(parentalPraiseId, parentId, childId, editParentalPraise);
  }

  async deleteParentalPraise(parentalPraiseId) {
    return this._parentalPraiseRepository.deleteParentalPraise(parentalPraiseId);
  }



  async getParentalPraise(verseMemoId, parentId, childId) {
    return this._parentalPraiseRepository.getParentalPraise(verseMemoId, parentId, childId);
  }


}

module.exports = ParentalPraiseUseCase;