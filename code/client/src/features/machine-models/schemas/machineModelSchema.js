import { z } from 'zod'

const technologyValues = ['SOLVENT', 'LATEX', 'UV', 'SUBLIMATION', 'OTHER']
const configurationValues = ['ROLL_TO_ROLL', 'FLATBED', 'HYBRID']

export const initialMachineModelValues = {
  manufacturerId: '',
  modelName: '',
  technology: '',
  configuration: '',
  maxRollWidthMm: '',
  flatbedWidthMm: '',
  flatbedLengthMm: '',
  notes: '',
}

function validateDimension(value, label, context, field) {
  if (!value.trim()) {
    context.addIssue({
      code: 'custom',
      path: [field],
      message: `${label} is required`,
    })
    return
  }

  const dimension = Number(value)

  if (!Number.isFinite(dimension) || dimension <= 0) {
    context.addIssue({
      code: 'custom',
      path: [field],
      message: `${label} must be greater than zero`,
    })
  }
}

export const machineModelSchema = z.object({
  manufacturerId: z.string().min(1, 'Select a manufacturer'),
  modelName: z.string().trim().min(1, 'Model name is required'),
  technology: z.enum(technologyValues, {
    error: 'Select a printing technology',
  }),
  configuration: z.enum(configurationValues, {
    error: 'Select a machine configuration',
  }),
  maxRollWidthMm: z.string(),
  flatbedWidthMm: z.string(),
  flatbedLengthMm: z.string(),
  notes: z.string(),
}).superRefine((values, context) => {
  if (values.configuration === 'ROLL_TO_ROLL' || values.configuration === 'HYBRID') {
    validateDimension(values.maxRollWidthMm, 'Maximum roll width', context, 'maxRollWidthMm')
  }

  if (values.configuration === 'FLATBED' || values.configuration === 'HYBRID') {
    validateDimension(values.flatbedWidthMm, 'Flatbed width', context, 'flatbedWidthMm')
    validateDimension(values.flatbedLengthMm, 'Flatbed length', context, 'flatbedLengthMm')
  }
})

export function toMachineModelPayload(values) {
  const needsRollWidth = values.configuration === 'ROLL_TO_ROLL' || values.configuration === 'HYBRID'
  const needsFlatbedDimensions = values.configuration === 'FLATBED' || values.configuration === 'HYBRID'

  return {
    manufacturerId: values.manufacturerId,
    modelName: values.modelName.trim(),
    technology: values.technology,
    configuration: values.configuration,
    maxRollWidthMm: needsRollWidth ? Number(values.maxRollWidthMm) : null,
    flatbedWidthMm: needsFlatbedDimensions ? Number(values.flatbedWidthMm) : null,
    flatbedLengthMm: needsFlatbedDimensions ? Number(values.flatbedLengthMm) : null,
    notes: values.notes.trim() || null,
  }
}
