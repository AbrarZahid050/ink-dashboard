import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import {
  initialMachineModelValues,
  machineModelSchema,
  toMachineModelPayload,
} from '../schemas/machineModelSchema.js'
import { useUpdateMachineModelMutation } from '../../../services/api.js'
import { getApiErrorMessage } from '../utils/getApiErrorMessage.js'
import MachineModelFields from './MachineModelFields.jsx'
import MachineModelDimensions from './MachineModelDimensions.jsx'

function MachineModelEditDialog({ model, manufacturers, onClose }) {
  const [saveError, setSaveError] = useState('')
  const [updateMachineModel, { isLoading: saving }] = useUpdateMachineModelMutation()
  const {
    control,
    register,
    setValue,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(machineModelSchema),
    defaultValues: {
      ...initialMachineModelValues,
      manufacturerId: model.manufacturerId ?? '',
      modelName: model.modelName ?? '',
      technology: model.technology ?? '',
      configuration: model.configuration ?? '',
      maxRollWidthMm: model.maxRollWidthMm == null ? '' : String(model.maxRollWidthMm),
      flatbedWidthMm: model.flatbedWidthMm == null ? '' : String(model.flatbedWidthMm),
      flatbedLengthMm: model.flatbedLengthMm == null ? '' : String(model.flatbedLengthMm),
      notes: model.notes ?? '',
    },
  })

  const configuration = useWatch({ control, name: 'configuration' })
  const manufacturerId = useWatch({ control, name: 'manufacturerId' })
  const technology = useWatch({ control, name: 'technology' })
  const modelName = useWatch({ control, name: 'modelName' })
  const selectedManufacturer = manufacturers.find(
    (manufacturer) => manufacturer.id === manufacturerId,
  )
  const isHpLatex =
    selectedManufacturer?.name?.trim().toUpperCase() === 'HP' && technology === 'LATEX'
  const isWhiteVariant = /W$/i.test(modelName.trim())
  const needsRollWidth = configuration === 'ROLL_TO_ROLL' || configuration === 'HYBRID'
  const needsFlatbedDimensions = configuration === 'FLATBED' || configuration === 'HYBRID'

  const handleWhiteVariantChange = () => {
    const baseModelName = modelName.trim().replace(/\s*W$/i, '')
    const nextModelName = isWhiteVariant ? baseModelName : `${baseModelName}W`
    setValue('modelName', nextModelName, { shouldDirty: true, shouldValidate: true })
  }

  const handleConfigurationChange = (nextConfiguration, onChange) => {
    onChange(nextConfiguration)
    clearErrors(['maxRollWidthMm', 'flatbedWidthMm', 'flatbedLengthMm'])

    if (nextConfiguration === 'ROLL_TO_ROLL') {
      setValue('flatbedWidthMm', '')
      setValue('flatbedLengthMm', '')
    } else if (nextConfiguration === 'FLATBED') {
      setValue('maxRollWidthMm', '')
    }
  }

  const handleSave = async (values) => {
    setSaveError('')

    try {
      await updateMachineModel({
        id: model.id,
        version: model.version,
        ...toMachineModelPayload(values),
      }).unwrap()
      onClose()
    } catch (error) {
      setSaveError(getApiErrorMessage(error, 'Unable to update this machine model.'))
    }
  }

  return (
    <Dialog open onClose={() => !saving && onClose()} fullWidth maxWidth="md">
      <DialogTitle>Edit machine model</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
          Update the manufacturer and technical specifications for this model.
        </Typography>
        <Grid container spacing={2.25}>
          <MachineModelFields
            control={control}
            register={register}
            errors={errors}
            manufacturers={manufacturers}
            disabled={false}
            isHpLatex={isHpLatex}
            isWhiteVariant={isWhiteVariant}
            onWhiteVariantChange={handleWhiteVariantChange}
            onConfigurationChange={handleConfigurationChange}
          />
          <MachineModelDimensions
            register={register}
            errors={errors}
            needsRollWidth={needsRollWidth}
            needsFlatbedDimensions={needsFlatbedDimensions}
          />
          <Grid size={{ xs: 12 }}>
            <TextField
              {...register('notes')}
              fullWidth
              multiline
              minRows={3}
              label="Notes"
              placeholder="Optional technical details or remarks"
            />
          </Grid>
        </Grid>
        {saveError && <Alert severity="error" sx={{ mt: 2 }}>{saveError}</Alert>}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSubmit(handleSave)}
          variant="contained"
          disabled={saving || manufacturers.length === 0}
          startIcon={saving ? <CircularProgress size={17} color="inherit" /> : <EditOutlined />}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MachineModelEditDialog
