"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

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
import { Badge } from "@/components/ui/badge"

export type Option = {
    label: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (value: string[]) => void
    placeholder?: string
    className?: string
    maxCount?: number
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select items...",
    className,
    maxCount = 3,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (item: string) => {
        onChange(selected.filter((i) => i !== item))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between hover:bg-background h-auto min-h-10", className)}
                >
                    <div className="flex flex-wrap gap-1 items-center justify-start max-w-full">
                        {selected.length === 0 && <span className="text-muted-foreground font-normal">{placeholder}</span>}
                        {selected.length > 0 && (
                            <>
                                {selected.slice(0, maxCount).map((item) => (
                                    <Badge
                                        variant="secondary"
                                        key={item}
                                        className="mr-1 mb-1 px-1 font-normal"
                                    >
                                        {item}
                                        <div
                                            role="button"
                                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    handleUnselect(item)
                                                }
                                            }}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                            }}
                                            onClick={() => handleUnselect(item)}
                                        >
                                            <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                        </div>
                                    </Badge>
                                ))}
                                {selected.length > maxCount && (
                                    <Badge variant="secondary" className="mr-1 mb-1 font-normal">
                                        +{selected.length - maxCount} more
                                    </Badge>
                                )}
                            </>
                        )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder={placeholder} />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandList>
                        <CommandGroup className="max-h-64 overflow-auto">
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        const valueToToggle = option.value
                                        onChange(
                                            selected.includes(valueToToggle)
                                                ? selected.filter((item) => item !== valueToToggle)
                                                : [...selected, valueToToggle]
                                        )
                                    }}
                                    // Force pointer events even if cmdk thinks it's disabled
                                    className="cursor-pointer data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selected.includes(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
