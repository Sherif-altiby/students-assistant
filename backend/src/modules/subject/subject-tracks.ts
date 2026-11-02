import { Track } from '@prisma/client';

const SUBJECT_TITLES_BY_TRACK: Partial<Record<Track, readonly string[]>> = {
  [Track.SCIENCE_SCIENCE]: [
    'الأحياء',
    'الكيمياء',
    'الفيزياء',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ],
  [Track.SCIENCE_MATH]: [
    'استاتيكا',
    'ديناميكا',
    'تفاضل وتكامل',
    'هندسة فراغية',
    'جبر',
    'الفيزياء',
    'الكيمياء',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ],
  [Track.LITERARY]: [
    'تاريخ',
    'جغرافيا',
    'فلسفة',
    'علم نفس',
    'اللغة العربية',
    'اللغة الإنجليزية',
  ],
};

export function getSubjectTitlesForTrack(track: Track | null): readonly string[] | undefined {
  return track ? SUBJECT_TITLES_BY_TRACK[track] : undefined;
}
