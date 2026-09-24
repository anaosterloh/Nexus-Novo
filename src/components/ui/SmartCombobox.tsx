import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxItem {
  value: string
  label: string
  [key: string]: any
}

interface SmartComboboxProps {
  items: ComboboxItem[]
  value?: string
  onSelect: (value: string) => void
  onCreate?: (searchValue: string) => void
  placeholder?: string
  emptyMessage?: string
  createMessage?: string
  className?: string
  disabled?: boolean
}

export function SmartCombobox({
  items,
  value,
  onSelect,
  onCreate,
  placeholder = "Selecione...",
  emptyMessage = "Pesquisa não encontrada",
  createMessage = "Adicionar um novo",
  className,
  disabled = false
}: SmartComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  const selectedItem = items.find((item) => item.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedItem ? selectedItem.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder={placeholder} 
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              <p className="text-zinc-500 mb-2">{emptyMessage}</p>
              {onCreate && searchValue && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                  onClick={() => {
                    onCreate(searchValue)
                    setOpen(false)
                  }}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  {createMessage}
                </Button>
              )}
            </CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label} // Search by label
                  onSelect={() => {
                    onSelect(item.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === item.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
