import { Check, ChevronDown } from "lucide-react"

import { type FilterChoice } from "@/screens/AccessoryDetails/types"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/context/LanguageContext"

interface FilterDropdownConfig {
  label: string
  value: FilterChoice
  options: readonly string[]
  onChange: (value: FilterChoice) => void
  className?: string
}

export interface FilterDropdownsProps {
  selectedCategory: FilterChoice
  selectedItemName: FilterChoice
  selectedDepartment: FilterChoice
  selectedRoom: FilterChoice
  categories: readonly string[]
  itemNames: string[]
  departmentOptions: string[]
  rooms: readonly string[]
  selectCategory: (category: FilterChoice) => void
  setSelectedItemName: (itemName: FilterChoice) => void
  onDepartmentChange: (department: FilterChoice) => void
  selectRoom: (room: FilterChoice) => void
  isNoneFilter: (value: FilterChoice) => boolean
  noneFilterValue: string
}

interface FilterDropdownProps extends FilterDropdownConfig {
  isNoneFilter: (value: FilterChoice) => boolean
  noneFilterValue: string
}

function filterLabel(value: FilterChoice, fallback: string, noneFilterValue: string) {
  if (value === null) {
    return fallback
  }

  if (value === noneFilterValue) {
    return "None"
  }

  return value
}

function FilterDropdown({
  label,
  value,
  options,
  onChange,
  isNoneFilter,
  noneFilterValue,
  className,
}: FilterDropdownProps) {
  const { t } = useLanguage()
  const selected = value !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-10 w-full justify-between gap-3 rounded-lg border-slate-200 bg-white px-4 text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto sm:min-w-36",
            selected &&
              "border-slate-950 bg-slate-950 text-white hover:bg-slate-800 hover:text-white",
            className
          )}
        >
          <span className="truncate text-left">
            {value === noneFilterValue ? t("none") : filterLabel(value, label, noneFilterValue)}
          </span>
          <ChevronDown className="ml-auto size-4 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={() => onChange(null)}>
          {value === null && <Check className="size-4" />}
          {t("all")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange(noneFilterValue)}>
          {isNoneFilter(value) && <Check className="size-4" />}
          {t("none")}
        </DropdownMenuItem>
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onChange(option)}>
            {value === option && <Check className="size-4" />}
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function FilterDropdowns({
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
  isNoneFilter,
  noneFilterValue,
}: FilterDropdownsProps) {
  const { t } = useLanguage()
  const dropdowns: FilterDropdownConfig[] = [
    {
      label: t("category"),
      value: selectedCategory,
      options: [...categories],
      onChange: selectCategory,
    },
    {
      label: t("itemName"),
      value: selectedItemName,
      options: itemNames,
      onChange: setSelectedItemName,
      className: "sm:min-w-44",
    },
    {
      label: t("department"),
      value: selectedDepartment,
      options: departmentOptions,
      onChange: onDepartmentChange,
    },
    {
      label: t("room"),
      value: selectedRoom,
      options: rooms,
      onChange: selectRoom,
    },
  ]

  return (
    <>
      {dropdowns.map((dropdown) => (
        <FilterDropdown
          key={dropdown.label}
          {...dropdown}
          isNoneFilter={isNoneFilter}
          noneFilterValue={noneFilterValue}
        />
      ))}
    </>
  )
}
