"use client"
import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale"

export function DatePicker({ value, onChange, error }) {
  // Convertir el string YYYY-MM-DD a objeto Date
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }, [value])

  const handleSelect = (date) => {
    if (!date) {
      onChange('')
      return
    }
    // Formatear a YYYY-MM-DD sin ajustes de zona horaria
    const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
    onChange(formattedDate)
  }

  const isDateDisabled = (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !dateValue && "text-muted-foreground",
            error && "border-red-500"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {dateValue ? format(dateValue, "PPP", { locale: es }) : "Selecciona fecha"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={handleSelect}
          initialFocus
          disabled={isDateDisabled}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  )
}
