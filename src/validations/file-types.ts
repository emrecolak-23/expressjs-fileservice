import Joi from "joi";

const createFileTypeValidation = Joi.object({
    fileType: Joi.string().required(),
    extension: Joi.array().items(Joi.string()).required(),
    isMultiple: Joi.boolean().required(),
    mime: Joi.array().items(Joi.string()).required(),
    isBriefcase: Joi.boolean().required(),
    requiredPersonalInfoStatus: Joi.required(),
    requiredResumeStatus: Joi.required(),
    userType: Joi.string().required()
})

const createManyFileTypeValidation = Joi.array().items(createFileTypeValidation);



export { createFileTypeValidation, createManyFileTypeValidation }