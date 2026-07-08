import { type FilterChoice } from "@/screens/AccessoryDetails/types"

export function isNoneFilter(value: FilterChoice) {
  return value === "__none__"
}

export function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

export function formatDateTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")

  return `${formatDate(date)} ${hours}:${minutes}`
}

export function incrementAccessoryId(id: string, offset: number) {
  const idPattern = /^\d{3}-\d{6}$/

  if (!idPattern.test(id)) {
    return id
  }

  const [prefix, serial] = id.split("-")
  const numericValue = Number(prefix) * 1_000_000 + Number(serial) + offset
  const nextPrefix = Math.floor(numericValue / 1_000_000)
  const nextSerial = numericValue % 1_000_000

  return `${String(nextPrefix).padStart(3, "0")}-${String(nextSerial).padStart(
    6,
    "0"
  )}`
}
