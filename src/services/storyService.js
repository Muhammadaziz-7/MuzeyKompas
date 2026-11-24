import { getPublicStories } from './userService.js';

export async function getStories() {
  return getPublicStories();
}
