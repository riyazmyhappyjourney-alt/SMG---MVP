import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, X, Check, MapPin, Building2, ChevronDown } from 'lucide-react';

export interface AutocompleteSuggestion {
  id: string;
  primaryText: string;
  secondaryText?: string;
  badge?: string;
  data?: any;
}

interface AutocompleteInputProps {
  id?: string;
  name?: string;
  label: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (suggestion: AutocompleteSuggestion) => void;
  getSuggestions: (query: string) => AutocompleteSuggestion[];
  iconType?: 'locality' | 'society' | 'search';
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  allowCustom?: boolean;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  id: propId,
  name,
  label,
  placeholder,
  value,
  onChange,
  onSelectSuggestion,
  getSuggestions,
  iconType = 'search',
  required = false,
  maxLength = 100,
  disabled = false,
  error,
  helperText,
  allowCustom = true,
}) => {
  const generatedId = useId();
  const inputId = propId || `autocomplete-${generatedId}`;
  const listboxId = `listbox-${inputId}`;

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Compute suggestions when value changes or input is focused
  useEffect(() => {
    if (!isOpen) return;
    const results = getSuggestions(value);
    setSuggestions(results);
    setHighlightedIndex(-1);
  }, [value, isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleSelect = (suggestion: AutocompleteSuggestion) => {
    onChange(suggestion.primaryText);
    if (onSelectSuggestion) {
      onSelectSuggestion(suggestion);
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelect(suggestions[highlightedIndex]);
        } else if (allowCustom) {
          // Keep current typed text and close dropdown
          setIsOpen(false);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;

      case 'Tab':
        // Let natural tab advance, but close suggestions
        setIsOpen(false);
        break;

      default:
        break;
    }
  };

  const renderIcon = () => {
    if (iconType === 'locality') {
      return <MapPin className="w-4 h-4 text-[#0073E6] shrink-0" />;
    }
    if (iconType === 'society') {
      return <Building2 className="w-4 h-4 text-[#0073E6] shrink-0" />;
    }
    return <Search className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-900 font-['Montserrat'] tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {maxLength && value && (
          <span className="text-[11px] text-slate-400 font-mono">
            {value.length}/{maxLength}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {renderIcon()}
        </div>

        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={
            highlightedIndex >= 0 ? `${inputId}-opt-${highlightedIndex}` : undefined
          }
          className={`w-full pl-10 pr-9 py-2.5 bg-white border rounded-md text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 transition-all font-['Poppins'] ${
            error
              ? 'border-rose-400 focus:ring-1 focus:ring-rose-400'
              : 'border-slate-300 focus:border-[#0073E6] focus:ring-1 focus:ring-[#0073E6]'
          } ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}`}
        />

        {value && !disabled ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setIsOpen(true);
              inputRef.current?.focus();
            }}
            aria-label="Clear field"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-slate-500 mt-1 font-['Poppins']">{helperText}</p>
      )}

      {error && (
        <p className="text-xs font-medium text-rose-600 mt-1 font-['Poppins']">{error}</p>
      )}

      {/* Dropdown Suggestions List */}
      {isOpen && (
        <ul
          id={listboxId}
          ref={listRef}
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-50 max-h-60 overflow-y-auto bg-white rounded-md border border-slate-200 shadow-lg py-1 font-['Poppins'] text-xs sm:text-sm divide-y divide-slate-100"
        >
          {suggestions.length > 0 ? (
            suggestions.map((item, index) => {
              const isHighlighted = highlightedIndex === index;
              return (
                <li
                  key={item.id}
                  id={`${inputId}-opt-${index}`}
                  role="option"
                  aria-selected={isHighlighted}
                  onMouseDown={(e) => {
                    // Prevent blur before selection
                    e.preventDefault();
                    handleSelect(item);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-blue-50 text-[#0073E6]' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold block truncate text-slate-900">
                      {item.primaryText}
                    </span>
                    {item.secondaryText && (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {item.secondaryText}
                      </span>
                    )}
                  </div>
                  {item.badge && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] tracking-wide uppercase border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </li>
              );
            })
          ) : (
            <li className="px-3.5 py-3 text-center text-xs text-slate-500">
              {value.trim().length > 0 ? (
                <div>
                  <p className="font-medium text-slate-700">No matching suggestions in Bengaluru dataset</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Press Enter or continue to use custom entry: &ldquo;{value}&rdquo;
                  </p>
                </div>
              ) : (
                <p>Type to search Bengaluru localities and apartment complexes</p>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
