import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findEveryoneFreeWindows,
  formatMinutes,
  getAvailabilityCalendar,
  parseEndTimeToMinutes,
  parseTimeToMinutes,
} from './timeLogic.js';

test('parses and formats time values', () => {
  assert.equal(parseTimeToMinutes('09:30'), 570);
  assert.equal(parseEndTimeToMinutes('00:00'), 1440);
  assert.equal(formatMinutes(570), '9:30 AM');
  assert.equal(formatMinutes(1440), '12:00 AM');
});

test('finds free windows between submitted busy periods', () => {
  const participants = [
    { name: 'Ari', periods: [{ day: 'monday', start: '09:00', end: '10:00' }] },
    { name: 'Maya', periods: [{ day: 'monday', start: '11:00', end: '12:00' }] },
  ];

  assert.deepEqual(findEveryoneFreeWindows(participants).slice(0, 3), [
    { day: 'monday', start: 420, end: 540 },
    { day: 'monday', start: 600, end: 660 },
    { day: 'monday', start: 720, end: 1440 },
  ]);
});

test('treats 12:00 AM as the end of the day for busy periods', () => {
  const participants = [
    { name: 'Ari', periods: [{ day: 'monday', start: '23:30', end: '00:00' }] },
  ];

  const monday = getAvailabilityCalendar(participants)[0];
  assert.equal(monday.slots.find((slot) => slot.start === 1410).status, 'busy');
});

test('marks calendar slots as free or busy', () => {
  const participants = [
    { name: 'Sam', periods: [{ day: 'monday', start: '09:00', end: '10:00' }] },
    { name: 'Lee', periods: [{ day: 'monday', start: '09:30', end: '10:30' }] },
    { name: 'Noor', periods: [] },
  ];

  const monday = getAvailabilityCalendar(participants)[0];
  assert.equal(monday.slots.find((slot) => slot.start === 420).status, 'free');
  assert.equal(monday.slots.find((slot) => slot.start === 540).status, 'busy');
  assert.equal(monday.slots.find((slot) => slot.start === 570).status, 'busy');
});
