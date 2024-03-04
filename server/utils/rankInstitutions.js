export const rankInstitutions = (institutions) => {
  // Weightage for each criterion (you can adjust these weights as needed)
  const accreditationWeight = 0.3;
  const graduationRateWeight = 0.4;
  const facultyExperienceWeight = 0.3;

  // Calculate a weighted sum for each institution
  const rankedInstitutions = institutions.map((institution) => {
    const score =
      accreditationWeight * (institution.accreditation ? 1 : 0) +
      graduationRateWeight * (institution.graduationRate / 100) +
      facultyExperienceWeight *
        calculateAverageFacultyExperience(institution.faculty);

    return { ...institution, score };
  });

  // Sort institutions based on the calculated score in descending order
  const sortedInstitutions = rankedInstitutions.sort(
    (a, b) => b.score - a.score
  );

  return sortedInstitutions;
};

export const calculateAverageFacultyExperience = (faculty) => {
  const totalExperience = faculty.reduce(
    (sum, member) => sum + member.experience,
    0
  );
  return faculty.length > 0 ? totalExperience / faculty.length : 0;
};
