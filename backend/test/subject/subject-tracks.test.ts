import assert from 'node:assert/strict';
import test from 'node:test';
import { Track } from '@prisma/client';
import { getSubjectTitlesForTrack } from '../../src/modules/subject/subject-tracks';

test('science-science receives its track subjects', () => {
  assert.deepEqual(getSubjectTitlesForTrack(Track.SCIENCE_SCIENCE), [
    'الأحياء',
    'الكيمياء',
    'الفيزياء',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ]);
});

test('science-math receives its track subjects', () => {
  assert.deepEqual(getSubjectTitlesForTrack(Track.SCIENCE_MATH), [
    'استاتيكا',
    'ديناميكا',
    'تفاضل وتكامل',
    'هندسة فراغية',
    'جبر',
    'الفيزياء',
    'الكيمياء',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ]);
});

test('literary receives its track subjects', () => {
  assert.deepEqual(getSubjectTitlesForTrack(Track.LITERARY), [
    'تاريخ',
    'جغرافيا',
    'فلسفة',
    'علم نفس',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ]);
});

test('other tracks keep their existing catalog behavior', () => {
  assert.equal(getSubjectTitlesForTrack(Track.SCIENCE), undefined);
});
