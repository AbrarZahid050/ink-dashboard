import { Grid, InputAdornment, TextField } from '@mui/material'

function DimensionField({ name, label, register, error }) {
  return (
    <TextField
      {...register(name)}
      fullWidth
      required
      type="number"
      label={label}
      error={Boolean(error)}
      helperText={error?.message}
      slotProps={{
        htmlInput: { min: 1, step: 1 },
        input: {
          endAdornment: <InputAdornment position="end">mm</InputAdornment>,
        },
      }}
    />
  )
}

function MachineModelDimensions({ register, errors, needsRollWidth, needsFlatbedDimensions }) {
  return (
    <>
      {needsRollWidth && (
        <Grid size={{ xs: 12, md: 4 }}>
          <DimensionField
            name="maxRollWidthMm"
            label="Maximum roll width"
            register={register}
            error={errors.maxRollWidthMm}
          />
        </Grid>
      )}

      {needsFlatbedDimensions && (
        <>
          <Grid size={{ xs: 12, md: 4 }}>
            <DimensionField
              name="flatbedWidthMm"
              label="Flatbed width"
              register={register}
              error={errors.flatbedWidthMm}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <DimensionField
              name="flatbedLengthMm"
              label="Flatbed length"
              register={register}
              error={errors.flatbedLengthMm}
            />
          </Grid>
        </>
      )}
    </>
  )
}

export default MachineModelDimensions
