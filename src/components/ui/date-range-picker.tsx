import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps {
  value?: string // Can be single date or range like "2025-01-15" or "2025-01-15 to 2025-01-20"
  onChange?: (dateString: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value = "",
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  className
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'single' | 'range'>('single')
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>()
  const [selectedRange, setSelectedRange] = React.useState<DateRange | undefined>()
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => new Date())

  // Parse the input value when component mounts or value changes
  React.useEffect(() => {
    if (!value) {
      setSelectedDate(undefined)
      setSelectedRange(undefined)
      return
    }

    if (value.includes(' to ')) {
      // Range value
      const [from, to] = value.split(' to ')
      setMode('range')
      setSelectedRange({
        from: new Date(from),
        to: new Date(to)
      })
    } else {
      // Single date value
      setMode('single')
      setSelectedDate(new Date(value))
    }
  }, [value])

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const now = new Date()
      setCurrentMonth(now)
    }
    setOpen(newOpen)
  }

  const handleSingleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date && onChange) {
      const dateString = format(date, 'yyyy-MM-dd')
      onChange(dateString)
      setOpen(false)
    }
  }

  const handleRangeSelect = (range: DateRange | undefined) => {
    setSelectedRange(range)
    if (range?.from && range?.to && onChange) {
      const fromString = format(range.from, 'yyyy-MM-dd')
      const toString = format(range.to, 'yyyy-MM-dd')
      onChange(`${fromString} to ${toString}`)
      setOpen(false)
    }
  }

  const handleModeChange = (newMode: 'single' | 'range') => {
    setMode(newMode)
    setSelectedDate(undefined)
    setSelectedRange(undefined)
    if (onChange) {
      onChange('')
    }
  }

  const currentYear = currentMonth.getFullYear()
  const currentMonthIndex = currentMonth.getMonth()

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

  const getDisplayText = () => {
    if (mode === 'single' && selectedDate) {
      return format(selectedDate, 'dd/MM/yyyy')
    }
    if (mode === 'range' && selectedRange?.from && selectedRange?.to) {
      return `${format(selectedRange.from, 'dd/MM/yyyy')} - ${format(selectedRange.to, 'dd/MM/yyyy')}`
    }
    if (mode === 'range' && selectedRange?.from) {
      return `${format(selectedRange.from, 'dd/MM/yyyy')} - ?`
    }
    return placeholder
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal rounded-none h-8 text-xs",
            (!selectedDate && !selectedRange) && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          <span className="text-xs">{getDisplayText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-none" align="start">
        {/* Mode selector */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium">Mode:</span>
            <Select value={mode} onValueChange={handleModeChange}>
              <SelectTrigger className="h-7 text-xs w-20 rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="range">Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Navigation Header */}
          <div className="flex items-center justify-between space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-7 w-7 p-0 rounded-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center space-x-2 flex-1">
              <Select value={currentMonthIndex.toString()} onValueChange={handleMonthChange}>
                <SelectTrigger className="h-7 text-xs rounded-none">
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
                <SelectTrigger className="h-7 text-xs w-20 rounded-none">
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
              className="h-7 w-7 p-0 rounded-none"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Calendar
          mode={mode}
          selected={mode === 'single' ? selectedDate : selectedRange}
          onSelect={mode === 'single' ? handleSingleDateSelect : handleRangeSelect}
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