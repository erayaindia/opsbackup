import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Create a stable current date
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date())
  
  // Always reset to current date when opening the picker
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      // Always reset to current month when opening
      const now = new Date()
      setCurrentMonth(now)
    }
    setOpen(newOpen)
  }
  
  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

  // Handle date selection with auto-close
  const handleDateSelect = (date: Date | undefined) => {
    console.log('🗓️ Original date from calendar:', date)
    
    if (date && onChange) {
      console.log('🗓️ Original date details:', {
        fullDate: date.toISOString(),
        year: date.getFullYear(),
        month: date.getMonth(),
        date: date.getDate(),
        day: date.getDay(),
        timezone: date.getTimezoneOffset()
      })
      
      // Try multiple approaches to fix the date
      const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
      console.log('🗓️ Timezone corrected date:', localDate)
      console.log('🗓️ Final date being passed:', {
        year: localDate.getFullYear(),
        month: localDate.getMonth(),
        date: localDate.getDate()
      })
      
      onChange(localDate)
    } else if (onChange) {
      onChange(date)
    }
    
    if (date) {
      setOpen(false) // Auto-close when a date is selected
    }
  }
  
  // Generate year options (from 1950 to current year + 10)
  const yearOptions = Array.from({ length: new Date().getFullYear() - 1949 + 10 }, (_, i) => 1950 + i)
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth)
    newDate.setFullYear(parseInt(year))
    setCurrentMonth(newDate)
  }

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(parseInt(monthIndex))
    setCurrentMonth(newDate)
  }

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonth(newDate)
  }

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonth(newDate)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal h-9 px-3 truncate",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b border-border">
          {/* Enhanced Navigation Header */}
          <div className="flex items-center justify-between space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-2 flex-1">
              <Select value={currentMonthIndex.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={currentYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="h-8 text-sm w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {yearOptions.reverse().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          initialFocus
          components={{
            IconLeft: () => null,
            IconRight: () => null,
          }}
          className="p-3"
        />
      </PopoverContent>
    </Popover>
  )
}