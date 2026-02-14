const calculateAverageFacultyExperience = (faculty) => {
  if (!faculty || faculty.length === 0) return 0;
  const totalExperience = faculty.reduce(
    (sum, member) => sum + (member.experience || 0),
    0
  );
  return totalExperience / faculty.length;
};

export const rankInstitutions = (institutions) => {
  const accreditationWeight = 0.3;
  const graduationRateWeight = 0.4;
  const facultyExperienceWeight = 0.3;

  const rankedInstitutions = institutions.map((institution) => {
    const score =
      accreditationWeight * (institution.accreditation ? 1 : 0) +
      graduationRateWeight * ((institution.graduationRate || 0) / 100) +
      facultyExperienceWeight *
        calculateAverageFacultyExperience(institution.faculty || []);

    return { ...institution, score };
  });

  const sortedInstitutions = rankedInstitutions.sort(
    (a, b) => b.score - a.score
  );

  return sortedInstitutions;
};
