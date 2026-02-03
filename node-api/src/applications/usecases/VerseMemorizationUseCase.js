const AddVerseMemorization = require("../../domains/verse_memorizations/entities/AddVerseMemorization");
const EditVerseMemorization = require("../../domains/verse_memorizations/entities/EditVerseMemorization");

class VerseMemorizationUseCase {
  constructor({ verseMemorizationRepository, quranService }) {
    this._verseMemorizationRepository = verseMemorizationRepository;
    this._quranService = quranService;
  }

  async addVerseMemorization(userId, verseId, useCasePayload) {
    const addVerseMemorization = new AddVerseMemorization(useCasePayload);
    const data = await this._verseMemorizationRepository.addVerseMemorization(userId, verseId, addVerseMemorization);

    return {
      id: data.id,
      score: parseInt(data.score),
      page: data.page,
      verse_id: data.verse_id
    };
  }

  async editVerseMemorization(userId, verseId, useCasePayload) {
    const editVerseMemorization = new EditVerseMemorization(useCasePayload);
    await this._verseMemorizationRepository.editVerseMemorization(verseId, userId, editVerseMemorization);
    return {
      id: verseId,
      score: parseInt(editVerseMemorization.score)
    };
  }

  async getVerseDetailMemorization(userId, page, verseId, verseMemoId) {
    const verseDetail = await this._quranService.getVerseDetail(page, verseId);
    const chapterId = verseDetail.key.split(":")[0];
    const chapter = await this._quranService.getChapterById(chapterId);
    let verseDetailHistory;
    try {
      verseDetailHistory = await this._verseMemorizationRepository.getVerseDetailMemorization(userId, verseMemoId);
    } catch (error) {
      verseDetailHistory = {
        id: null,
        score: null,
        audio: null,
        status: 'new'
      }
    }

    return {
      ...verseDetail,
      chapter: chapter.name_simple,
      progress: {
        id: verseDetailHistory.id,
        score: parseInt(verseDetailHistory.score),
        status: verseDetailHistory.status,
        audio: verseDetailHistory.audio,
      }
    };
  }

  async getVerseMemorization(userId, page) {
    const verses = await this._quranService.getVersesByPage(page);
    const verseHistory = await this._verseMemorizationRepository.getVerseMemorization(userId, page);


    const progressMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.score]));
    const idMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.id]));
    const statusMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.status]));
    const audioMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.audio]));

    let totalMemorizedVerse = 0;

    const merged = verses.map(verse => {
      const score = progressMap.get(verse.key) || 0;
      const verseId = idMap.get(verse.key) || null;
      const audio = audioMap.get(verse.key) || '-';
      const statusVerse = statusMap.get(verse.key) || 'new';

      if (statusVerse == 'memorized') {
        totalMemorizedVerse++;
      }

      return {
        ...verse,

        progress: {
          id: verseId,
          status: statusVerse,
          audio: audio,
          score: parseInt(score),
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

    const progressMap = new Map(juzHistory.map(p => [parseInt(p.juz), parseInt(p.verses_memorized)]));

    let totalMemorizedJuz = 0;
    let totalMemorizedVerse = 0;
    let totalVerses = 0;

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

      totalMemorizedVerse += memorized;
      totalVerses += total;

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
      memorized_verse: totalMemorizedVerse,
      total_verse: totalVerses,

      merged: [...merged]
    };
  }

  async getPageMemorization(userId, juz) {
    const pages = await this._quranService.getPagesByJuz(juz);
    const pagesHistory = await this._verseMemorizationRepository.getPageMemorization(userId, juz);

    const progressMap = new Map(pagesHistory.map(p => [parseInt(p.page), parseInt(p.verses_memorized)]));

    let totalMemorizedPage = 0;
    let totalMemorizedVerse = 0;
    let totalVerseByJuz = 0;

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

      totalMemorizedVerse += memorized;
      totalVerseByJuz += total;

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
      memorized_verse: totalMemorizedVerse,
      total_verse: totalVerseByJuz,
      merged: [...merged]
    };
  }

  async getSummaryVerseMemorization(userId) {
    let lastVerseMemo;
    try {
      lastVerseMemo = await this._verseMemorizationRepository.getLastVerseMemorization(userId);
    } catch (error) {
      lastVerseMemo = null;
    }
    const memoData = await this.getJuzMemorization(userId);

    return {
      memorized_juz: memoData.memorized_juz,
      memorized_verse: memoData.memorized_verse,
      total_verse: memoData.total_verse,
      last_verse_memorizing: lastVerseMemo,
    }
  }
}

module.exports = VerseMemorizationUseCase;