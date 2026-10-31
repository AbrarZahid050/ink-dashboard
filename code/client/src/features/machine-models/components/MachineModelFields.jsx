import { Controller } from 'react-hook-form'
import {
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
} from '@mui/material'
import { configurationOptions, technologyOptions } from '../constants/machineModelOptions.js'

function MachineModelFields({
  control,
  register,
  errors,
  manufacturers,
  disabled,
  isHpLatex,
  isWhiteVariant,
  onWhiteVariantChange,
  onConfigurationChange,
}) {
  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="manufacturerId"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.manufacturerId)}>
              <InputLabel id="manufacturer-label">Manufacturer</InputLabel>
              <Select
                {...field}
                labelId="manufacturer-label"
                label="Manufacturer"
                disabled={disabled || manufacturers.length === 0}
              >
                {manufacturers.map((manufacturer) => (
                  <MenuItem key={manufacturer.id} value={manufacturer.id}>
                    {manufacturer.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.manufacturerId && (
                <FormHelperText>{errors.manufacturerId.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
        {manufacturers.length === 0 && !disabled && (
          <FormHelperText>Add a manufacturer before registering a machine model.</FormHelperText>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <TextField
          {...register('modelName')}
          fullWidth
          required
          label="Model name"
          placeholder="e.g. CJV330-160"
          error={Boolean(errors.modelName)}
          helperText={errors.modelName?.message}
        />
        {isHpLatex && (
          <ToggleButton
            value="white-ink"
            selected={isWhiteVariant}
            onChange={onWhiteVariantChange}
            size="small"
            sx={{ mt: 1, textTransform: 'none' }}
          >
            White ink (700W)
          </ToggleButton>
        )}
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="technology"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.technology)}>
              <InputLabel id="technology-label">Printing technology</InputLabel>
              <Select {...field} labelId="technology-label" label="Printing technology">
                {technologyOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.technology && (
                <FormHelperText>{errors.technology.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="configuration"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth required error={Boolean(errors.configuration)}>
              <InputLabel id="configuration-label">Machine configuration</InputLabel>
              <Select
                {...field}
                labelId="configuration-label"
                label="Machine configuration"
                onChange={(event) => onConfigurationChange(event.target.value, field.onChange)}
              >
                {configurationOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {errors.configuration && (
                <FormHelperText>{errors.configuration.message}</FormHelperText>
              )}
            </FormControl>
          )}
        />
      </Grid>
    </>
  )
}

export default MachineModelFields
