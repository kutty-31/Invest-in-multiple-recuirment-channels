import multer from 'multer'

const maximumResumeBytes = 5 * 1024 * 1024

const uploadResume = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maximumResumeBytes, files: 1, fields: 0 },
  fileFilter(request, file, callback) {
    const pdfName = file.originalname.toLowerCase().endsWith('.pdf')
    if (file.mimetype !== 'application/pdf' || !pdfName) {
      const error = new Error('Upload a PDF resume.')
      error.code = 'UNSUPPORTED_RESUME_TYPE'
      return callback(error)
    }
    return callback(null, true)
  },
}).single('resume')

export { maximumResumeBytes, uploadResume }
