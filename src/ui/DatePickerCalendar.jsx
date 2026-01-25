// Separate Calendar Component for better performance
function DatePickerCalendar({ currentMonth, formData, monthNames, onDateClick, onMonthChange }) {
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const generateCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentMonth);
        const firstDay = getFirstDayOfMonth(currentMonth);
        const days = [];

        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }
        return days;
    };

    const isSameDay = (date1, date2) => {
        if (!date1 || !date2) return false;
        return (
            date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
        );
    };

    const isDateSelected = (day) => {
        if (!day || !formData.date) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        return isSameDay(date, formData.date);
    };

    const isDateDisabled = (day) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    };

    const isToday = (day) => {
        if (!day) return false;
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const today = new Date();
        return isSameDay(date, today);
    };

    const calendarDays = generateCalendarDays();
    const weeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
        weeks.push(calendarDays.slice(i, i + 7));
    }

    return (
        <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
                <button
                    type="button"
                    onClick={() => onMonthChange(-1)}
                    aria-label="Mois précédent"
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <span className="text-lg sm:text-xl text-gray-600" aria-hidden="true">‹</span>
                </button>
                <h3 className="text-sm sm:text-base font-semibold text-gray-800 text-center">
                    <span className="hidden sm:inline">{monthNames[currentMonth.getMonth()]} </span>
                    <span className="sm:hidden">{monthNames[currentMonth.getMonth()].substring(0, 3)} </span>
                    {currentMonth.getFullYear()}
                </h3>
                <button
                    type="button"
                    onClick={() => onMonthChange(1)}
                    aria-label="Mois suivant"
                    className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <span className="text-lg sm:text-xl text-gray-600" aria-hidden="true">›</span>
                </button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                {["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"].map((day, idx) => (
                    <div
                        key={idx}
                        className="h-8 sm:h-10 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600 uppercase"
                        aria-label={["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"][idx]}
                    >
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {weeks.map((week, weekIdx) =>
                    week.map((day, dayIdx) => {
                        const isSelected = isDateSelected(day);
                        const disabled = isDateDisabled(day);
                        const todayDate = isToday(day);

                        return (
                            <button
                                key={`${weekIdx}-${dayIdx}`}
                                type="button"
                                onClick={() => onDateClick(day)}
                                disabled={!day || disabled}
                                aria-label={day ? `${day} ${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}` : undefined}
                                aria-pressed={isSelected}
                                className={`
                                    h-8 sm:h-10 lg:h-11 flex items-center justify-center rounded-md sm:rounded-lg text-xs sm:text-sm font-medium transition-all
                                    ${!day ? "invisible" : ""}
                                    ${disabled ? "text-gray-300 cursor-not-allowed bg-gray-50" : ""}
                                    ${isSelected ? "bg-sky-600 text-white font-bold shadow-md" : ""}
                                    ${todayDate && !isSelected ? "border-2 border-sky-600 text-sky-600 font-bold" : ""}
                                    ${!disabled && !isSelected && !todayDate ? "hover:bg-sky-50 hover:text-sky-600 text-gray-700" : ""}
                                `}
                            >
                                {day}
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default DatePickerCalendar;
