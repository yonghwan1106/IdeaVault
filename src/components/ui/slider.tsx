import * as React from "react"

export interface SliderProps {
  value: number[]
  onValueChange: (value: number[]) => void
  max?: number
  min?: number
  step?: number
  className?: string
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, onValueChange, max = 100, min = 0, step = 1, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value)
      if (value.length === 1) {
        onValueChange([newValue])
      } else {
        // For range sliders, this is simplified - would need more complex logic for dual handles
        onValueChange([value[0], newValue])
      }
    }

    return (
      <div ref={ref} className={`relative w-full ${className || ''}`} {...props}>
        {value.length === 1 ? (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value[0]}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        ) : (
          // Simplified dual range - would need custom implementation for proper dual slider
          <div className="space-y-2">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[0]}
              onChange={(e) => onValueChange([Number(e.target.value), value[1]])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value[1]}
              onChange={(e) => onValueChange([value[0], Number(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}
      </div>
    )
  }
)
Slider.displayName = "Slider"

export { Slider }