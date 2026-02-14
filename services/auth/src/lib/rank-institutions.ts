type Institution = {
  accreditation?: boolean;
  graduationRate?: number;
  faculty?: Array<{ experience?: number }>;
  [key: string]: unknown;
};

function calculateAverageFacultyExperience(faculty: Institution["faculty"]): number {
  if (!faculty || faculty.length === 0) return 0;
  const total = faculty.reduce(
    (sum, member) => sum + (member.experience ?? 0),
    0
  );
  return total / faculty.length;
}

export function rankInstitutions(institutions: Institution[]): Institution[] {
  const accreditationWeight = 0.3;
  const graduationRateWeight = 0.4;
  const facultyExperienceWeight = 0.3;

  const ranked = institutions.map((institution) => {
    const score =
      accreditationWeight * (institution.accreditation ? 1 : 0) +
      graduationRateWeight * ((institution.graduationRate ?? 0) / 100) +
      facultyExperienceWeight *
        calculateAverageFacultyExperience(institution.faculty);
    return { ...institution, score };
  });

  return ranked.sort(
    (a, b) => (b.score as number) - (a.score as number)
  );
}
