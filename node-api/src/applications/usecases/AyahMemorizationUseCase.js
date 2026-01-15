const AddAyahMemorization = require("../../domains/ayah_memorizations/entities/AddAyahMemorization");
const EditAyahMemorization = require("../../domains/ayah_memorizations/entities/editAyahMemorization");

class AyahMemorizationUseCase {
  constructor({ ayahMemorizationRepository, quranService }) {
    this._ayahMemorizationRepository = ayahMemorizationRepository;
    this._quranService = quranService;
  }

  async addAyahMemorization(userId, useCasePayload) {
    const addAyahMemorization = new AddAyahMemorization(useCasePayload);
    return this._ayahMemorizationRepository.addAyahMemorization(userId, addAyahMemorization);
  }

  async editAyahMemorization(ayahId, userId, useCasePayload) {
    const editAyahMemorization = new EditAyahMemorization(useCasePayload);
    return this._ayahMemorizationRepository.editAyahMemorization(ayahId, userId, editAyahMemorization);
  }

  async getAyahMemorization(userId, page) {
    const verses = await this._quranService.getVersesByPage(page);
    const ayahHistory = await this._ayahMemorizationRepository.getAyahMemorization(userId, page);

    const progressMap = new Map(ayahHistory.map(p => [`${p.surah}:${p.ayah}`, p.score]));
    const idMap = new Map(ayahHistory.map(p => [`${p.surah}:${p.ayah}`, p.id]));

    const merged = verses.map(verse => {
      const score = progressMap.get(verse.key) || 0;
      const ayahId = idMap.get(verse.key) || null;

      return {
        ...verse,

        progress: {
          id: ayahId,
          score: score,
        }
      };
    });

    return merged;
  }

  async getJuzMemorization(userId) {
    const juzs = await this._quranService.getAllJuz();
    const juzHistory = await this._ayahMemorizationRepository.getJuzMemorization(userId);

    const progressMap = new Map(juzHistory.map(p => [p.juz, p.verses_memorized]));

    const merged = juzs.map(juz => {
      const memorized = progressMap.get(juz.juz_number) || 0;
      const total = juz.verses_count;

      let status;
      if (memorized === 0) {
        status = "new";
      } else if (memorized < total) {
        status = "memorizing";
      } else {
        status = "memorized";
      }

      return {
        juz: juz.juz_number,
        verses_memorized: memorized,
        verses_total: total,
        progress_percent: Math.round((memorized / total) * 100),
        status
      };
    });

    return merged;
  }

  async getPageMemorization(userId, juz) {
    const pages = await this._quranService.getPagesByJuz(juz);
    const pagesHistory = await this._ayahMemorizationRepository.getPageMemorization(userId, juz);
    const progressMap = new Map(pagesHistory.map(p => [p.page, p.verses_memorized]));

    const merged = pages.map(page => {
      const memorized = progressMap.get(page.id) || 0;
      const total = page.total_verses;

      let status;
      if (memorized === 0) {
        status = "new";
      } else if (memorized < total) {
        status = "memorizing";
      } else {
        status = "memorized";
      }

      return {
        page: page.id,
        verses_memorized: memorized,
        verses_total: total,
        progress_percent: Math.round((memorized / total) * 100),
        status
      };
    });


    return merged;
  }
}

module.exports = AyahMemorizationUseCase;