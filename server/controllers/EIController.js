import getPrismaInstance from "../utils/PrismaClient.js";
import { v2 as cloudinary } from "cloudinary";

export const getAllEducationalInstitutions = async (req, res, next) => {
  try {
    const prisma = getPrismaInstance();
    // Retrieve all educational institutions using Prisma's findMany method
    const institutions = await prisma.educationalInstitution.findMany({
      include: {
        albums: true,
        infrastructure: true,
        programs: true,
        faculty: true,
        extraActivities: true,
        cost: true,
        alumniSuccess: true,
      },
    });

    return res.status(200).json({ institutions });
  } catch (error) {
    next(error);
  }
};

export const createEducationalInstitutions = async (
  request,
  response,
  next
) => {
  try {
    const prisma = getPrismaInstance();
    const { userId } = request.query;
    const {
      name,
      description,
      address,
      type,
      category,
      accreditation_status,
      principal_name,
      principal_email,
      contact,
    } = request.body;

    const image = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "Eduroclass/Uploads/EducationInstitutions/" },
          (error, result) => {
            if (error) {
              console.log(result);
              reject("Failed to upload photo");
            } else {
              resolve(result);
            }
          }
        )
        .end(request.file.buffer);
    });
    //Set User to Agent
    await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        role: "AGENT",
      },
    });
    const existingEibyName = await prisma.educationalInstitution.findUnique({
      where: { name: name },
    });
    if (existingEibyName) {
      return response.json({
        msg: "This Educational institution is already owned by other.",
        status: 409,
      });
    } else {
      const institution = await prisma.educationalInstitution.create({
        data: {
          name,
          thumbnail: image.secure_url,
          description,
          address,
          type,
          category,
          accreditation_status,
          principal_name,
          principal_email,
          principal_phone_number: contact,
          owner: {
            connect: {
              id: parseInt(userId),
            },
          },
        },
      });

      return response.json({
        msg: "Institution Created Successfully",
        status: 200,
        data: institution,
      });
    }
  } catch (error) {
    console.log(error);
    return response.json({
      msg: "Internal Server Error",
      status: 500,
    });
  }
};
