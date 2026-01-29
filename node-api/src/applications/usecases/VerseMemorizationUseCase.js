const AddVerseMemorization = require("../../domains/verse_memorizations/entities/AddVerseMemorization");
const EditVerseMemorization = require("../../domains/verse_memorizations/entities/EditVerseMemorization");

class VerseMemorizationUseCase {
  constructor({ verseMemorizationRepository, quranService }) {
    this._verseMemorizationRepository = verseMemorizationRepository;
    this._quranService = quranService;
  }

  async addVerseMemorization(userId, useCasePayload) {
    const addVerseMemorization = new AddVerseMemorization(useCasePayload);
    return this._verseMemorizationRepository.addVerseMemorization(userId, addVerseMemorization);
  }

  async editVerseMemorization(verseId, userId, useCasePayload) {
    const editVerseMemorization = new EditVerseMemorization(useCasePayload);
    return this._verseMemorizationRepository.editVerseMemorization(verseId, userId, editVerseMemorization);
  }

  async getVerseDetailMemorization(userId, page, verseId) {
    const verseDetail = await this._quranService.getVerseDetail(page, verseId);
    const chapterId = verseDetail.key.split(":")[0];
    const chapter = await this._quranService.getChapterById(chapterId);
    let verseDetailHistory;
    try {
      verseDetailHistory = await this._verseMemorizationRepository.getVerseDetailMemorization(userId, verseId);
    } catch (error) {
      verseDetailHistory = {
        id: null,
        score: null,
        status: 'new'
      }
    }

    return {
      ...verseDetail,
      chapter: chapter.name_simple,
      progress: verseDetailHistory
    };
  }

  async getVerseMemorization(userId, page) {
    const verses = await this._quranService.getVersesByPage(page);
    const verseHistory = await this._verseMemorizationRepository.getVerseMemorization(userId, page);

    const progressMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.score]));
    const idMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.id]));
    const statusMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.status]));

    let totalMemorizedVerse = 0;

    const merged = verses.map(verse => {
      const score = progressMap.get(verse.key) || 0;
      const verseId = idMap.get(verse.key) || null;
      const statusVerse = statusMap.get(verse.key) || 'new';

      if (statusVerse == 'memorized') {
        totalMemorizedVerse++;
      }

      return {
        ...verse,

        progress: {
          id: verseId,
          status: statusVerse,
          score: score,
        }
      };
    });

    return {
      memorized_verse: totalMemorizedVerse,

      merged: [...merged]
    };
  }

  async getJuzMemorization(userId) {
    const juzs = await this._quranService.getAllJuz();
    const juzHistory = await this._verseMemorizationRepository.getJuzMemorization(userId);

    const progressMap = new Map(juzHistory.map(p => [p.juz, p.verses_memorized]));

    let totalMemorizedJuz = 0;

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

      if (status == 'memorized') {
        totalMemorizedJuz++;
      }

      return {
        juz: juz.juz_number,
        verses_memorized: memorized,
        verses_total: total,
        progress_percent: Math.round((memorized / total) * 100),
        status
      };
    });

    return {
      memorized_juz: totalMemorizedJuz,

      merged: [...merged]
    };
  }

  async getPageMemorization(userId, juz) {
    const pages = await this._quranService.getPagesByJuz(juz);
    const pagesHistory = await this._verseMemorizationRepository.getPageMemorization(userId, juz);
    const progressMap = new Map(pagesHistory.map(p => [p.page, p.verses_memorized]));

    let totalMemorizedPage = 0;

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

      if (status == 'memorized') {
        totalMemorizedPage++;
      }

      return {
        page: page.id,
        verses_memorized: memorized,
        verses_total: total,
        progress_percent: Math.round((memorized / total) * 100),
        status
      };
    });


    return {
      memorized_page: totalMemorizedPage,

      merged: [...merged]
    };
  }
}

module.exports = VerseMemorizationUseCase;