import {
  addCollectionItem,
  deleteCollectionItem,
  getCollectionItems,
} from './firestoreContentService.js';

export function combineMuseumExhibits(museumExhibits, curatorExhibits) {
  return [
    ...museumExhibits,
    ...curatorExhibits
      .filter((exhibit) => exhibit.status === 'approved')
      .map((exhibit) => ({
        id: `student-${exhibit.id}`,
        title: exhibit.title,
        image: exhibit.image,
        description: exhibit.description,
        category: exhibit.category ?? 'Tarix',
        historical_context: exhibit.historicalContext,
        pedagogical_task: 'Eksponatni kuzating va uning tarixiy ahamiyati haqida fikr yuriting.',
      })),
  ];
}

export async function getExhibits() {
  return getCollectionItems('exhibits');
}

export async function addExhibit(data) {
  return addCollectionItem('exhibits', data);
}

export async function deleteExhibit(id) {
  return deleteCollectionItem('exhibits', id);
}

export async function getExhibitById(id) {
  const allExhibits = await getExhibits();
  return allExhibits.find((exhibit) => exhibit.id === id) ?? null;
}
