import { useMemo, useState } from "react"
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  Search,
} from "lucide-react"

import { type SearchType } from "@/screens/AccessoryDetails/types"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/LanguageContext"

export interface SearchBarProps {
  searchType: SearchType
  searchQuery: string
  selectedAcademicYear: string | null
  selectedDate: Date | undefined
  dateInput: string
  calendarViewDate: Date
  academicYears: readonly string[]
  monthNames: readonly string[]
  onSearchTypeChange: (type: SearchType) => void
  onSearchQueryChange: (value: string) => void
  onAcademicYearChange: (value: string | null) => void
  onDateChange: (date: Date | undefined) => void
  onDateInputChange: (value: string) => void
  onCalendarViewDateChange: (date: Date) => void
  formatDate: (date: Date) => string
}

interface SearchBarViewState {
  popoverOpen: boolean
  activeSearchType: SearchType | null
}

export default function SearchBar({
  searchType,
  searchQuery,
  selectedAcademicYear,
  selectedDate,
  dateInput,
  calendarViewDate,
  academicYears,
  monthNames,
  onSearchTypeChange,
  onSearchQueryChange,
  onAcademicYearChange,
  onDateChange,
  onDateInputChange,
  onCalendarViewDateChange,
  formatDate,
}: SearchBarProps) {
  const { t } = useLanguage()
  const [viewState, setViewState] = useState<SearchBarViewState>({
    popoverOpen: false,
    activeSearchType: null,
  })
  const calendarYears = useMemo(
    () =>
      Array.from(
        new Set([
          ...academicYears.flatMap((year) =>
            year.split("-").map((part) => Number(part))
          ),
          new Date().getFullYear(),
        ])
      ).sort((a, b) => b - a),
    [academicYears]
  )
  const searchTypeLabel =
    searchType === "general"
      ? t("search")
      : searchType === "id"
      ? t("searchById")
      : searchType === "academicYear"
        ? t("academicYear")
        : t("selectDate")
  const hasActiveSearchValue =
    (searchType === "general" && searchQuery.trim().length > 0) ||
    (searchType === "id" && searchQuery.trim().length > 0) ||
    (searchType === "academicYear" && selectedAcademicYear !== null) ||
    (searchType === "date" && dateInput.trim().length > 0)
  const activeSearchValue =
    searchType === "general"
      ? searchQuery || `${t("search")}...`
      : searchType === "id"
      ? searchQuery || t("searchById")
      : searchType === "academicYear"
        ? selectedAcademicYear ?? t("allAcademicYears")
        : dateInput || t("chooseRegistrationDate")
  const isInlineSearchMode = searchType === "general" || searchType === "id"

  const openSearchView = (type: SearchType) => {
    if (type === "id") {
      onSearchTypeChange(type)
      setViewState({ popoverOpen: false, activeSearchType: null })
      return
    }

    onSearchTypeChange(type)
    setViewState((current) => ({ ...current, activeSearchType: type }))
  }

  const resetPopoverView = () => {
    setViewState((current) => ({ ...current, activeSearchType: null }))
  }

  const closePopover = () => {
    setViewState({ popoverOpen: false, activeSearchType: null })
  }

  const selectCalendarMonth = (month: string) => {
    onCalendarViewDateChange(
      new Date(calendarViewDate.getFullYear(), Number(month), 1)
    )
  }

  const selectCalendarYear = (year: string) => {
    onCalendarViewDateChange(
      new Date(Number(year), calendarViewDate.getMonth(), 1)
    )
  }

  const selectCalendarDate = (date: Date) => {
    onSearchTypeChange("date")
    onDateChange(date)
    onDateInputChange(formatDate(date))
    onCalendarViewDateChange(date)
  }

  return (
    <div className="min-w-0 flex-1">
      <Popover
        open={viewState.popoverOpen}
        onOpenChange={(open) =>
          setViewState({
            popoverOpen: open,
            activeSearchType: open ? viewState.activeSearchType : null,
          })
        }
      >
        {isInlineSearchMode ? (
          <PopoverTrigger asChild>
            <div className="flex h-11 w-full min-w-0 cursor-text items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-left shadow-sm transition hover:bg-slate-50 focus-within:border-slate-900 focus-within:ring-3 focus-within:ring-slate-200">
              <Search className="pointer-events-none size-5 shrink-0 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder={
                  searchType === "id"
                    ? `${t("searchById")} (ဥပမာ၊ 033-000101)...`
                    : `${t("search")}...`
                }
                className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-medium text-slate-950 shadow-none outline-none placeholder:text-slate-500 focus-visible:ring-0"
              />
              <ChevronDown className="pointer-events-none size-5 shrink-0 text-slate-500" />
            </div>
          </PopoverTrigger>
        ) : (
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-11 w-full min-w-0 items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 text-left shadow-sm transition hover:bg-slate-50 focus-visible:border-slate-900 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-slate-200"
            >
              <Search className="size-5 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1">
                {hasActiveSearchValue ? (
                  <>
                    <span className="block truncate text-xs font-semibold text-slate-500">
                      {searchTypeLabel}
                    </span>
                    <span className="block truncate text-sm font-medium text-slate-950">
                      {activeSearchValue}
                    </span>
                  </>
                ) : (
                  <span className="block truncate text-sm font-medium text-slate-500">
                    {t("search")}
                  </span>
                )}
              </span>
              <ChevronDown className="size-5 shrink-0 text-slate-500" />
            </button>
          </PopoverTrigger>
        )}
        <PopoverContent
          side="bottom"
          align="start"
          className={cn(
            "w-[var(--radix-popover-trigger-width)] p-2",
            viewState.activeSearchType === "date"
              ? "min-w-[min(360px,calc(100vw-2rem))]"
              : "min-w-[min(320px,calc(100vw-2rem))]"
          )}
        >
          {viewState.activeSearchType === null && (
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => openSearchView("id")}
                className="flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                {t("searchById")}
                {searchType === "id" && <Check className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => openSearchView("academicYear")}
                className="flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                {t("academicYear")}
                {searchType === "academicYear" && <Check className="size-4" />}
              </button>
              <button
                type="button"
                onClick={() => openSearchView("date")}
                className="flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-100"
              >
                {t("selectDate")}
                {searchType === "date" && <Check className="size-4" />}
              </button>
            </div>
          )}

          {viewState.activeSearchType === "academicYear" && (
            <div className="space-y-3 p-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetPopoverView}
                  aria-label="Back to search options"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {t("academicYear")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("selectRegistrationYear")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onAcademicYearChange(null)
                    closePopover()
                  }}
                  className={cn(
                    "h-9 w-full justify-between rounded-lg border-slate-200 bg-white px-3",
                    selectedAcademicYear === null &&
                      "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {t("allAcademicYears")}
                  {selectedAcademicYear === null && <Check className="size-4" />}
                </Button>
                {academicYears.map((year) => (
                  <Button
                    key={year}
                    type="button"
                    variant="outline"
                    onClick={() => {
                      onAcademicYearChange(year)
                      closePopover()
                    }}
                    className={cn(
                      "h-9 w-full justify-between rounded-lg border-slate-200 bg-white px-3",
                      selectedAcademicYear === year &&
                        "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    {year}
                    {selectedAcademicYear === year && (
                      <Check className="size-4" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {viewState.activeSearchType === "date" && (
            <div className="p-2">
              <div className="mb-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={resetPopoverView}
                  aria-label="Back to search options"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {t("selectDate")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t("pickRegistrationDate")}
                  </p>
                </div>
                <CalendarDays className="size-4 shrink-0 text-slate-500" />
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2">
                <Select
                  value={String(calendarViewDate.getMonth())}
                  onValueChange={selectCalendarMonth}
                >
                  <SelectTrigger className="h-9 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthNames.map((month, index) => (
                      <SelectItem key={month} value={String(index)}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(calendarViewDate.getFullYear())}
                  onValueChange={selectCalendarYear}
                >
                  <SelectTrigger className="h-9 border-slate-200 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {calendarYears.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Calendar
                key={`${calendarViewDate.getFullYear()}-${calendarViewDate.getMonth()}`}
                selected={selectedDate ?? calendarViewDate}
                onSelect={selectCalendarDate}
                className="shadow-sm"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
