import { Bank, FileDoc, Presentation, Question } from '@phosphor-icons/react';
import exhibits from '../data/exhibits.json';
import lectures from '../data/lectures.json';
import presentations from '../data/presentations.json';
import quizzes from '../data/quizzes.json';

function getSearchableItems({
  currentLectures = lectures,
  currentPresentations = presentations,
  currentQuizzes = quizzes,
  currentExhibits = exhibits,
} = {}) {
  return [
    ...currentLectures.map((lecture) => ({
      id: `lecture-${lecture.id}`,
      title: lecture.title,
      category: 'Ma’ruza',
      detail: lecture.fileName || lecture.title,
      searchText: `${lecture.title} ${lecture.fileName ?? ''} ${lecture.fileUrl ?? ''} ${lecture.uploadedAt ?? ''}`,
      to: '/lectures',
      Icon: FileDoc,
    })),
    ...currentPresentations.map((presentation) => ({
      id: `presentation-${presentation.id}`,
      title: presentation.title,
      category: 'Prezentatsiya',
      detail: presentation.author,
      searchText: `${presentation.title} ${presentation.author} ${presentation.description}`,
      to: '/presentations',
      Icon: Presentation,
    })),
    ...currentQuizzes.map((quiz) => ({
      id: `quiz-${quiz.id}`,
      title: quiz.title,
      category: 'Test',
      detail: quiz.kahootUrl
        ? 'Kahoot test havolasi'
        : `${quiz.questions?.length ?? 0} ta savol`,
      searchText: [
        quiz.title,
        quiz.description,
        quiz.kahootUrl,
        ...(quiz.questions ?? []).flatMap(({ question, options }) => [question, ...options]),
      ].filter(Boolean).join(' '),
      to: quiz.kahootUrl ? '/kahoot' : `/quiz/${quiz.id}`,
      Icon: Question,
    })),
    ...currentExhibits.map((exhibit) => ({
      id: `exhibit-${exhibit.id}`,
      title: exhibit.title,
      category: 'Eksponat',
      detail: exhibit.category,
      searchText: [
        exhibit.title,
        exhibit.category,
        exhibit.description,
        exhibit.historical_context,
        exhibit.pedagogical_task,
      ].join(' '),
      to: '/museum',
      Icon: Bank,
    })),
  ];
}

function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[‘’`´]/g, "'")
    .toLocaleLowerCase();
}

export function searchContent(query, collections) {
  const terms = normalizeText(query).trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return [];
  }

  return getSearchableItems(collections)
    .filter((item) => {
      const searchableText = normalizeText(`${item.title} ${item.category} ${item.detail} ${item.searchText}`);
      return terms.every((term) => searchableText.includes(term));
    })
    .slice(0, 12);
}
