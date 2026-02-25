const AddVerseMemorization = require("../../domains/verse_memorizations/entities/AddVerseMemorization");
const EditVerseMemorization = require("../../domains/verse_memorizations/entities/EditVerseMemorization");

class VerseMemorizationUseCase {
  constructor({ verseMemorizationRepository, quranService, userRepository }) {
    this._verseMemorizationRepository = verseMemorizationRepository;
    this._quranService = quranService;
    this._userRepository = userRepository;
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
        threshold: null,
        words: null,
        status: 'new'
      }
    }

    let wordsData = verseDetailHistory.words;

    if (!Array.isArray(wordsData)) {
      wordsData = [];
    }

    return {
      ...verseDetail,
      chapter: chapter.name_simple,
      progress: {
        id: verseDetailHistory.id,
        score: parseInt(verseDetailHistory.score),
        status: verseDetailHistory.status,
        audio: verseDetailHistory.audio,
        threshold: verseDetailHistory.threshold,
        words: wordsData,
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
    const thresholdMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.threshold]));

    let totalMemorizedVerse = 0;

    const merged = verses.map(verse => {
      const score = progressMap.get(verse.key) || 0;
      const verseId = idMap.get(verse.key) || null;
      const audio = audioMap.get(verse.key) || '-';
      const threshold = thresholdMap.get(verse.key) || null;
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
          threshold: threshold,
          score: parseInt(score),
          words: []
        }
      };
    });

    return {
      memorized_verse: totalMemorizedVerse,

      merged: [...merged]
    };
  }

  async getVerseChildMemorization(parentId, childId, page) {
    await this._userRepository.verifyParentChild(parentId, childId);

    const verses = await this._quranService.getVersesByPage(page);
    const verseHistory = await this._verseMemorizationRepository.getVerseMemorization(childId, page);


    const progressMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.score]));
    const idMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.id]));
    const statusMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.status]));
    const audioMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.audio]));
    const thresholdMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.threshold]));
    const wordsMap = new Map(verseHistory.map(p => [`${p.surah}:${p.verse}`, p.words]));

    let totalMemorizedVerse = 0;

    const verseChild = verses.map(async (verse) => {
      const score = progressMap.get(verse.key) || 0;
      const verseId = idMap.get(verse.key) || null;
      const audio = audioMap.get(verse.key) || '-';
      const threshold = thresholdMap.get(verse.key) || null;
      const words = wordsMap.get(verse.key) || null;
      const statusVerse = statusMap.get(verse.key) || 'new';

      const chapterId = verse.key.split(":")[0];
      const chapter = await this._quranService.getChapterById(chapterId);

      if (statusVerse == 'memorized') {
        totalMemorizedVerse++;
      }

      let wordsData = words;

      if (!Array.isArray(wordsData)) {
        wordsData = [];
      }

      return {
        ...verse,
        chapter: chapter.name_simple,
        progress: {
          id: verseId,
          status: statusVerse,
          audio: audio,
          threshold: threshold,
          score: parseInt(score),
          words: wordsData
        }
      };
    });

    const merged = await Promise.all(verseChild);

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

  async getJuzChildMemorization(parentId, childId) {
    await this._userRepository.verifyParentChild(parentId, childId);

    const juzs = await this._quranService.getAllJuz();
    const juzHistory = await this._verseMemorizationRepository.getJuzMemorization(childId);

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

  async getPageChildMemorization(parentId, childId, juz) {
    await this._userRepository.verifyParentChild(parentId, childId);

    const pages = await this._quranService.getPagesByJuz(juz);
    const pagesHistory = await this._verseMemorizationRepository.getPageMemorization(childId, juz);

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

  async getChildSummary(parentId) {
    const childs = await this._userRepository.getListChild(parentId);

    const childPromises = childs.map(async (child) => {

      const scoreData = await this._userRepository.getScoreChild(child.id);
      const memoData = await this.getJuzMemorization(child.id);


      return {
        ...child,
        total_score: scoreData,
        memorized_juz: memoData.memorized_juz,
        memorized_verse: memoData.memorized_verse,
        total_verse: memoData.total_verse,
      };
    });

    // 2. WAJIB gunakan Promise.all untuk menunggu semua proses map selesai
    const merged = await Promise.all(childPromises);

    // 3. Sekarang 'merged' adalah array berisi data asli
    return merged;
  }
}

module.exports = VerseMemorizationUseCase;