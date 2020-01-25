import React, {useState} from 'react';
import DayPicker from 'react-day-picker';
import add from 'date-fns/add';
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'

export default function Example() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [addition, setAddition] = useState(1);
  const handleDayClick = (day, {selected}) => {
    setSelectedDate(day);
  }
  const handleAdditionChange = (e) => {
    setAddition(e.target.value);
  }
  const handleResultDayClick = (day, { selected }) => {
    setAddition(differenceInCalendarDays(day, selectedDate));
  }
  return (<>
    <input type="number" value={addition} onChange={handleAdditionChange} />
    <DayPicker
      month={new Date()}
      firstDayOfWeek={1}
      selectedDays={selectedDate}
      onDayClick={handleDayClick}
      showOutsideDays
      showWeekNumbers
      fixedWeeks
      todayButton="Gå till Idag"
    />
    <DayPicker
      month={add(selectedDate, {days: addition})}
      firstDayOfWeek={1}
      selectedDays={add(selectedDate, { days: addition })}
      onDayClick={handleResultDayClick}
      showOutsideDays
      showWeekNumbers
      fixedWeeks
    />
    </>
  );
}