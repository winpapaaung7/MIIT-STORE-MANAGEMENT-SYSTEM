import {
  type FilterChoice,
  type SearchType,
} from "@/screens/AccessoryDetails/types"
import ActionButtons from "@/screens/AccessoryDetails/Searchbar components/ActionButtons"
import FilterDropdowns from "@/screens/AccessoryDetails/Searchbar components/FilterDropdowns"
import SearchBar from "@/screens/AccessoryDetails/Searchbar components/SearchBar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AccessoriesFilterBarProps {
  hasActiveFilters: FilterChoice | Date | undefined
  resetFilters: () => void
  selectedCategory: FilterChoice
  selectedItemName: FilterChoice
  selectedDepartment: FilterChoice
  selectedRoom: FilterChoice
  categories: readonly string[]
  itemNames: string[]
  departmentOptions: string[]
  rooms: string[]
  selectCategory: (category: FilterChoice) => void
  setSelectedItemName: (itemName: FilterChoice) => void
  onDepartmentChange: (department: FilterChoice) => void
  selectRoom: (room: FilterChoice) => void
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
  isNoneFilter: (value: FilterChoice) => boolean
  noneFilterValue: string
  onTransferClick: () => void
}

export default function AccessoriesFilterBar({
  hasActiveFilters,
  resetFilters,
  selectedCategory,
  selectedItemName,
  selectedDepartment,
  selectedRoom,
  categories,
  itemNames,
  departmentOptions,
  rooms,
  selectCategory,
  setSelectedItemName,
  onDepartmentChange,
  selectRoom,
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
  isNoneFilter,
  noneFilterValue,
  onTransferClick,
}: AccessoriesFilterBarProps) {
  return (
    <div className="shrink-0 rounded-lg border border-slate-100 bg-white p-3 shadow-sm shadow-slate-200/70 sm:p-4">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant={!hasActiveFilters ? "default" : "outline"}
            onClick={resetFilters}
            className={cn(
              "h-10 w-full rounded-lg px-5 shadow-sm sm:w-auto sm:min-w-24",
              !hasActiveFilters
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
            )}
          >
            All
          </Button>

          <FilterDropdowns
            selectedCategory={selectedCategory}
            selectedItemName={selectedItemName}
            selectedDepartment={selectedDepartment}
            selectedRoom={selectedRoom}
            categories={categories}
            itemNames={itemNames}
            departmentOptions={departmentOptions}
            rooms={rooms}
            selectCategory={selectCategory}
            setSelectedItemName={setSelectedItemName}
            onDepartmentChange={onDepartmentChange}
            selectRoom={selectRoom}
            isNoneFilter={isNoneFilter}
            noneFilterValue={noneFilterValue}
          />

          <ActionButtons onTransferClick={onTransferClick} />
        </div>

        <SearchBar
          searchType={searchType}
          searchQuery={searchQuery}
          selectedAcademicYear={selectedAcademicYear}
          selectedDate={selectedDate}
          dateInput={dateInput}
          calendarViewDate={calendarViewDate}
          academicYears={academicYears}
          monthNames={monthNames}
          onSearchTypeChange={onSearchTypeChange}
          onSearchQueryChange={onSearchQueryChange}
          onAcademicYearChange={onAcademicYearChange}
          onDateChange={onDateChange}
          onDateInputChange={onDateInputChange}
          onCalendarViewDateChange={onCalendarViewDateChange}
          formatDate={formatDate}
        />
      </div>
    </div>
  )
}
