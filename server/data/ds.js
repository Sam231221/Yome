const educationInstitutions = [
  {
    type: "School",
    name: "ABC Elementary School",
    accreditation: true,
    academicPrograms: ["Elementary Education", "Art and Music Classes"],
    faculty: [
      {
        name: "John Doe",
        qualification: "Bachelor's in Education",
        experience: 5,
      },
      {
        name: "Jane Smith",
        qualification: "Master's in Education",
        experience: 8,
      },
    ],
    infrastructure: {
      classrooms: 10,
      library: true,
      laboratories: false,
      sportsFacilities: true,
      technologyResources: ["Smartboards", "Computer Labs"],
    },
    studentToFacultyRatio: 20,
    extracurricularActivities: ["Chess Club", "Art Club"],
    careerServices: false,
    graduationRate: 95,
    alumniSuccess: ["Successful Artists", "Community Leaders"],
    cost: {
      tuition: 3000,
      fees: 500,
      livingExpenses: 4000,
    },
    financialAid: true,
    location: "Suburban",
    campusLife: true,
  },
  {
    type: "High School",
    name: "XYZ High School",
    accreditation: true,
    academicPrograms: [
      "College Preparatory",
      "Advanced Placement (AP) Courses",
    ],
    faculty: [
      {
        name: "Robert Johnson",
        qualification: "Ph.D. in Science",
        experience: 12,
      },
      {
        name: "Emily White",
        qualification: "Master's in Mathematics",
        experience: 10,
      },
    ],
    infrastructure: {
      classrooms: 30,
      library: true,
      laboratories: true,
      sportsFacilities: true,
      technologyResources: ["Science Labs", "Computer Labs"],
    },
    studentToFacultyRatio: 18,
    extracurricularActivities: ["Debate Team", "Science Club", "Sports Teams"],
    careerServices: true,
    graduationRate: 98,
    alumniSuccess: ["Successful Professionals", "Academic Scholars"],
    cost: {
      tuition: 5000,
      fees: 1000,
      livingExpenses: 6000,
    },
    financialAid: true,
    location: "Urban",
    campusLife: true,
  },
  {
    type: "University",
    name: "Global University",
    accreditation: true,
    academicPrograms: [
      "Engineering",
      "Business Administration",
      "Medical Sciences",
    ],
    faculty: [
      {
        name: "Prof. Sarah Adams",
        qualification: "Ph.D. in Engineering",
        experience: 15,
      },
      {
        name: "Dr. Michael Brown",
        qualification: "Doctorate in Business Administration",
        experience: 20,
      },
    ],
    infrastructure: {
      classrooms: 50,
      library: true,
      laboratories: true,
      sportsFacilities: true,
      technologyResources: ["Research Labs", "High-tech Classrooms"],
    },
    studentToFacultyRatio: 16,
    extracurricularActivities: [
      "International Student Exchange Program",
      "Research Clubs",
    ],
    careerServices: true,
    graduationRate: 92,
    alumniSuccess: ["Industry Leaders", "Renowned Researchers"],
    cost: {
      tuition: 8000,
      fees: 1500,
      livingExpenses: 7000,
    },
    financialAid: true,
    location: "Suburban",
    campusLife: true,
  },
];

// Define a ranking function
const rankInstitutions = (institutions) => {
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

// Helper function to calculate the average faculty experience
const calculateAverageFacultyExperience = (faculty) => {
  console.log(faculty);
  const totalExperience = faculty.reduce(
    (sum, member) => sum + member.experience,
    0
  );
  return faculty.length > 0 ? totalExperience / faculty.length : 0;
};

// Example usage of the ranking function
const rankedInstitutions = rankInstitutions(educationInstitutions);
console.log(rankedInstitutions);
