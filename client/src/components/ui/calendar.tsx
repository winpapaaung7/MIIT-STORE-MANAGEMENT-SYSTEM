import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  className?: string
}

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function Calendar({ selected, onSelect, className }: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(selected ?? new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(viewDate)

  const days = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]

  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1))
  }

  return (
    <div className={cn("rounded-lg border border-slate-100 bg-white p-3", className)}>
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => changeMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="text-sm font-semibold text-slate-900">{monthLabel}</div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => changeMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdayLabels.map((day) => (
          <div key={day} className="py-1 font-medium text-slate-400">
            {day}
          </div>
        ))}
        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="size-8" />
          }

          const date = new Date(year, month, day)
          const isSelected = selected?.toDateString() === date.toDateString()

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelect?.(date)}
              className={cn(
                "size-8 rounded-lg text-sm font-medium text-slate-700 transition hover:bg-slate-100",
                isSelected && "bg-slate-950 text-white hover:bg-slate-950"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { Calendar }
