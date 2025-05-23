"use client"
import React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { es } from "date-fns/locale";

export function DatePicker({ value, onChange, error }) {
  // Conversión segura a Date
  const dateValue = React.useMemo(() => {
    try {
      return value ? new Date(value) : undefined;
    } catch {
      return undefined;
    }
  }, [value]);

  // Manejo seguro de selección
  const handleSelect = (date) => {
    try {
      onChange(date?.toISOString?.() ?? null);
    } catch (error) {
      console.error("Error al convertir fecha:", error);
      onChange(null);
    }
  };

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
          disabled={(date) => date < new Date()}
          locale={es}
        />
      </PopoverContent>
    </Popover>
  );
}