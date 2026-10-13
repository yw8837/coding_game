import test from 'node:test';
import assert from 'node:assert/strict';
import {endingStoryScenes} from './ending-story.ts';

test('ending scenes name the actual released service in all locales and keep the three ordered scenes',()=>{
 const scenes=endingStoryScenes('Small Night Cinema','events');
 assert.deepEqual(scenes.map(scene=>scene.id),['neighbors','celebration','home']);
 for(const scene of scenes)for(const language of ['ko','en','ja'] as const){
  assert.ok(scene.body[language].includes('Small Night Cinema'));
  assert.ok(scene.heading[language].trim());
 }
 assert.ok(scenes[0].body.en.includes('upcoming events'));
});
test('a custom service gets a neutral use scene rather than an invented directory or help-board purpose',()=>{
 const custom=endingStoryScenes('My drawing toy','custom')[0];
 assert.ok(custom.body.en.includes('page you made'));
 assert.ok(!custom.body.en.includes('places'));
 assert.ok(!custom.body.en.includes('events'));
 assert.ok(!custom.body.ko.includes('도움판'));
 const directory=endingStoryScenes('My places','directory')[0];
 const portfolio=endingStoryScenes('My paintings','portfolio')[0];
 assert.ok(directory.body.en.includes('places they need'));
 assert.ok(portfolio.body.en.includes('work you made'));
});

test('authored website and webapp use their actual format in the use scene',()=>{
 assert.ok(endingStoryScenes('My stories','website')[0].body.en.includes('read what you wanted to share'));
 assert.ok(endingStoryScenes('My useful app','webapp')[0].body.en.includes('functions you built'));
});
