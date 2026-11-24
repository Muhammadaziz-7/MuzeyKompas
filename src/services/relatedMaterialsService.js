import lectures from '../data/lectures.json';
import presentations from '../data/presentations.json';
import quizzes from '../data/quizzes.json';

const exhibitMaterialIds = {
  'registon-koshini': {
    lecture: 'tarixiy-eksponat-tahlili',
    presentation: 'samarkand-architecture',
    quiz: 'samarkand-architecture',
  },
  'sopol-kosa': {
    lecture: 'tarixiy-eksponat-tahlili',
    presentation: 'ancient-artifacts',
    quiz: 'ancient-artifacts',
  },
  'mis-suvdon': {
    lecture: 'muzey-pedagogikasi-asoslari',
    presentation: 'ancient-artifacts',
    quiz: 'ancient-artifacts',
  },
};

const quizMaterialIds = {
  'museum-history': {
    lecture: 'muzey-pedagogikasi-asoslari',
    presentation: 'museum-learning',
  },
  'ancient-artifacts': {
    lecture: 'tarixiy-eksponat-tahlili',
    presentation: 'ancient-artifacts',
  },
  'silk-road': {
    lecture: 'interaktiv-muzey-mashguloti',
    presentation: 'silk-road',
  },
  'samarkand-architecture': {
    lecture: 'tarixiy-eksponat-tahlili',
    presentation: 'samarkand-architecture',
  },
};

function createMaterialLinks(materialIds = {}) {
  const lecture = lectures.find((item) => item.id === materialIds.lecture);
  const presentation = presentations.find(
    (item) => item.id === materialIds.presentation,
  );
  const quiz = quizzes.find((item) => item.id === materialIds.quiz);

  if (!lecture || !presentation || (materialIds.quiz && !quiz)) {
    throw new Error('Tavsiya etilgan o‘quv materiali katalogda topilmadi.');
  }

  return [
    {
      id: 'lecture',
      title: 'Ma’ruza',
      description: 'Mavzuni ma’ruza orqali chuqurroq o‘rganing.',
      label: 'Ma’ruza o‘qish',
      to: '/lectures',
    },
    {
      id: 'presentation',
      title: 'Taqdimot',
      description: 'Mavzuga oid taqdimotni ko‘rib chiqing.',
      label: 'Taqdimotni ko‘rish',
      to: '/presentations',
    },
    ...(quiz ? [{
      id: 'quiz',
      title: 'Kahoot testi',
      description: 'Bilimingizni interaktiv testda sinang.',
      label: 'Testda sinash',
      to: `/quiz/${quiz.id}`,
    }] : []),
  ].map((material) => ({
    ...material,
    itemTitle: material.id === 'lecture'
      ? lecture.title
      : material.id === 'presentation'
        ? presentation.title
        : quiz.title,
  }));
}

export function getRelatedMaterialsForExhibit(exhibitId) {
  const materialIds = exhibitMaterialIds[exhibitId] ?? {
    lecture: 'muzey-pedagogikasi-asoslari',
    presentation: 'museum-learning',
    quiz: 'museum-history',
  };
  return createMaterialLinks(materialIds);
}

export function getRelatedMaterialsForQuiz(quizId) {
  const materialIds = quizMaterialIds[quizId] ?? {
    lecture: 'muzey-pedagogikasi-asoslari',
    presentation: 'museum-learning',
  };
  return createMaterialLinks(materialIds);
}
