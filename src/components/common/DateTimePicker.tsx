import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';

export interface DateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateStr: string, timeStr: string, combinedIso: string) => void;
  initialDate?: string; // Format: 'YYYY-MM-DD'
  initialTime?: string; // Format: '10:00 AM' or '14:30'
  title?: string;
  minDate?: string; // Format: 'YYYY-MM-DD', default today
  allowPastDates?: boolean;
}

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const QUICK_TIME_PRESETS = [
  '10:00 AM', '11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:30 PM', '05:30 PM', '06:00 PM'
];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  isOpen,
  onClose,
  onConfirm,
  initialDate,
  initialTime,
  title = 'Schedule Date & Time',
  minDate,
  allowPastDates = false
}) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const effectiveMinDate = minDate || (allowPastDates ? '' : todayStr);

  // Parse initial or fallback
  const parseInitialDate = () => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      return initialDate;
    }
    return todayStr;
  };

  const parseInitialTime = () => {
    if (!initialTime) return '11:00 AM';
    // If format is "14:30"
    if (/^\d{2}:\d{2}$/.test(initialTime)) {
      const [h, m] = initialTime.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    }
    return initialTime;
  };

  const [selectedDate, setSelectedDate] = useState<string>(parseInitialDate);
  const [selectedTime, setSelectedTime] = useState<string>(parseInitialTime);

  // Month navigation view state
  const [viewYear, setViewYear] = useState<number>(() => {
    const d = parseInitialDate();
    return parseInt(d.split('-')[0], 10);
  });
  const [viewMonth, setViewMonth] = useState<number>(() => {
    const d = parseInitialDate();
    return parseInt(d.split('-')[1], 10) - 1; // 0-indexed
  });

  // Custom time inputs
  const [customHour, setCustomHour] = useState<number>(() => {
    const t = parseInitialTime();
    const parts = t.split(':');
    return parseInt(parts[0], 10) || 11;
  });
  const [customMinute, setCustomMinute] = useState<number>(() => {
    const t = parseInitialTime();
    const minPart = t.split(':')[1]?.slice(0, 2);
    return parseInt(minPart, 10) || 0;
  });
  const [customPeriod, setCustomPeriod] = useState<'AM' | 'PM'>(() => {
    const t = parseInitialTime();
    return t.toUpperCase().includes('PM') ? 'PM' : 'AM';
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset when dialog opens
  useEffect(() => {
    if (isOpen) {
      const d = parseInitialDate();
      const t = parseInitialTime();
      setSelectedDate(d);
      setSelectedTime(t);
      setViewYear(parseInt(d.split('-')[0], 10));
      setViewMonth(parseInt(d.split('-')[1], 10) - 1);
      setErrorMessage(null);

      // Parse hours/minutes/period
      const parts = t.split(':');
      const h = parseInt(parts[0], 10) || 11;
      const minPart = parts[1]?.slice(0, 2);
      const m = parseInt(minPart, 10) || 0;
      setCustomHour(h);
      setCustomMinute(m);
      setCustomPeriod(t.toUpperCase().includes('PM') ? 'PM' : 'AM');
    }
  }, [isOpen, initialDate, initialTime]);

  if (!isOpen) return null;

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build calendar matrix
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // 0 = Mon, 6 = Sun

  const days: { day: number; dateStr: string; isCurrentMonth: boolean; isDisabled: boolean }[] = [];

  // Trailing days from previous month
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isDisabled: Boolean(effectiveMinDate && dateStr < effectiveMinDate)
    });
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      isCurrentMonth: true,
      isDisabled: Boolean(effectiveMinDate && dateStr < effectiveMinDate)
    });
  }

  // Trailing days from next month to complete grid (multiples of 7)
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth === 11 ? 1 : viewMonth + 2;
    const y = viewMonth === 11 ? viewYear + 1 : viewYear;
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({
      day: d,
      dateStr,
      isCurrentMonth: false,
      isDisabled: Boolean(effectiveMinDate && dateStr < effectiveMinDate)
    });
  }

  const handleSelectPresetTime = (time: string) => {
    setSelectedTime(time);
    const parts = time.split(':');
    const h = parseInt(parts[0], 10) || 11;
    const minPart = parts[1]?.slice(0, 2);
    const m = parseInt(minPart, 10) || 0;
    setCustomHour(h);
    setCustomMinute(m);
    setCustomPeriod(time.toUpperCase().includes('PM') ? 'PM' : 'AM');
  };

  const handleUpdateCustomTime = (h: number, m: number, p: 'AM' | 'PM') => {
    setCustomHour(h);
    setCustomMinute(m);
    setCustomPeriod(p);
    const formatted = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${p}`;
    setSelectedTime(formatted);
  };

  const handleConfirm = () => {
    if (!selectedDate) {
      setErrorMessage('Please select a valid date.');
      return;
    }
    if (effectiveMinDate && selectedDate < effectiveMinDate) {
      setErrorMessage('Scheduled date cannot be in the past.');
      return;
    }
    if (!selectedTime) {
      setErrorMessage('Please select a time.');
      return;
    }

    // Convert to 24-hr time for ISO
    let hours24 = customHour;
    if (customPeriod === 'PM' && hours24 < 12) hours24 += 12;
    if (customPeriod === 'AM' && hours24 === 12) hours24 = 0;

    const [year, month, day] = selectedDate.split('-').map(Number);
    const combinedDate = new Date(year, month - 1, day, hours24, customMinute, 0);

    onConfirm(selectedDate, selectedTime, combinedDate.toISOString());
    onClose();
  };

  // Formatted human readable preview
  const formatFriendlyPreview = () => {
    if (!selectedDate) return 'No date selected';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const obj = new Date(y, m - 1, d);
    const dayName = obj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = obj.toLocaleDateString('en-US', { month: 'short' });
    return `${dayName}, ${d} ${monthName} ${y} at ${selectedTime}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#244B8F]/10 text-[#244B8F] flex items-center justify-center">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033] tracking-tight">{title}</h3>
              <p className="text-[11px] text-slate-500">Select date and operational time slot</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Calendar Picker */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </span>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setViewYear(now.getFullYear());
                    setViewMonth(now.getMonth());
                  }}
                  className="px-2 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {DAYS_OF_WEEK.map((dw) => (
                <div key={dw} className="py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  {dw}
                </div>
              ))}
              {days.map((item, idx) => {
                const isSelected = item.dateStr === selectedDate;
                const isToday = item.dateStr === todayStr;

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={item.isDisabled}
                    onClick={() => {
                      setSelectedDate(item.dateStr);
                      setErrorMessage(null);
                    }}
                    className={`
                      h-8 rounded-lg text-xs font-medium flex items-center justify-center transition-colors cursor-pointer tabular-nums
                      ${isSelected ? 'bg-[#244B8F] text-white font-bold shadow-xs' : ''}
                      ${!isSelected && isToday ? 'border border-[#244B8F] text-[#244B8F] font-semibold' : ''}
                      ${!isSelected && !isToday && item.isCurrentMonth ? 'text-slate-800 hover:bg-slate-100' : ''}
                      ${!isSelected && !item.isCurrentMonth ? 'text-slate-300 hover:bg-slate-50' : ''}
                      ${item.isDisabled ? 'opacity-30 cursor-not-allowed hover:bg-transparent text-slate-300' : ''}
                    `}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Time Slot (IST)</span>
              </label>
              <span className="text-xs font-bold text-[#244B8F] tabular-nums">{selectedTime}</span>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {QUICK_TIME_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPresetTime(preset)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-colors cursor-pointer tabular-nums ${
                    selectedTime === preset
                      ? 'bg-[#244B8F] text-white border-[#244B8F] font-bold shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            {/* Custom Hour/Minute Selector */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium text-slate-500">Custom Time:</span>
              <div className="flex items-center space-x-1.5">
                {/* Hour */}
                <select
                  value={customHour}
                  onChange={(e) => handleUpdateCustomTime(Number(e.target.value), customMinute, customPeriod)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#244B8F] cursor-pointer tabular-nums"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="font-bold text-slate-400">:</span>
                {/* Minute */}
                <select
                  value={customMinute}
                  onChange={(e) => handleUpdateCustomTime(customHour, Number(e.target.value), customPeriod)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-[#244B8F] cursor-pointer tabular-nums"
                >
                  {[0, 15, 30, 45].map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, '0')}
                    </option>
                  ))}
                </select>
                {/* AM / PM */}
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => handleUpdateCustomTime(customHour, customMinute, 'AM')}
                    className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      customPeriod === 'AM' ? 'bg-[#244B8F] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateCustomTime(customHour, customMinute, 'PM')}
                    className={`px-2 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                      customPeriod === 'PM' ? 'bg-[#244B8F] text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Selected Summary Pill */}
          <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Selected Schedule:</span>
            <span className="font-bold text-[#244B8F] tabular-nums">{formatFriendlyPreview()}</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-end space-x-2 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold text-white bg-[#244B8F] hover:bg-[#1B396E] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center space-x-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Schedule</span>
          </button>
        </div>
      </div>
    </div>
  );
};
