import Joi from "joi";

const fileUploadValidation = Joi.object({
  file: Joi.object({
    mime: Joi.string().valid(
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf"
    ),
    size: Joi.number()
      .max(1024 * 1024 * 5)
      .label("File size (up to 5MB)"),
  }),
  fileKey: Joi.string().label("File key"),
});

const fileIsExist = Joi.object({
  fileType: Joi.string().required().label("FileType"),
  id: Joi.string().required().label("FileId"),
});

const createFileUrl = Joi.object({
  id: Joi.string().required().label("FileId"),
});

const getAllFiles = Joi.object({
  userId: Joi.number().required().label("UserId"),
});

export { fileUploadValidation, fileIsExist, createFileUrl, getAllFiles };
