import getPrismaInstance from "../utils/PrismaClient.js";
export const getAllEducationalInstitutions = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    // Retrieve all educational institutions using Prisma's findMany method
    const institutions = await prisma.educationalInstitution.findMany();

    return res.status(200).json({ institutions });
  } catch (error) {
    next(error);
  }
};
