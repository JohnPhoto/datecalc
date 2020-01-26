import React, { useState, useLayoutEffect, useEffect, useRef} from 'react';
import DayPicker from 'react-day-picker';
import { useRouter } from 'next/router';

import add from 'date-fns/add';
import sub from 'date-fns/sub';
import isValid from 'date-fns/isValid';
import differenceInDays from 'date-fns/differenceInDays';
import differenceInYears from 'date-fns/differenceInYears';
import differenceInMonths from 'date-fns/differenceInMonths';
import differenceInWeeks from 'date-fns/differenceInWeeks';
import differenceInHours from 'date-fns/differenceInHours';
import differenceInMinutes from 'date-fns/differenceInMinutes';
import differenceInSeconds from 'date-fns/differenceInSeconds';
import addWeeks from 'date-fns/addWeeks';
import subWeeks from 'date-fns/subWeeks';
import lightFormat from 'date-fns/lightFormat';


const DATE_FORMAT = 'yyyy-MM-dd';
const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss::SSS'

const logDate = (date, msg) => {
  console.log(`${msg} ${formatDay(date, DATE_TIME_FORMAT)}`);
}

const getOptimizedDiff = (start, end) =>{
  const years = differenceInYears(end, start);
  const date3 = add(start, {years});
  const months = differenceInMonths(end, date3);
  const date4 = add(date3, {months});
  const weeks = differenceInWeeks(end, date4);
  const date5 = addWeeks(date4, weeks);
  const days = differenceInDays(end, date5);
  return {
    years,
    months,
    weeks, 
    days,
    start,
    end,
  }
}

function formatNumber(x) {
  if(Number.isNaN(x)){
    return '';
  }
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDay(date, format = DATE_FORMAT){
    return isValid(date) ? lightFormat(date, format) : '';
}

function stringify(v){
  return v.toString();
}

function getNum(val, fallback = 0){
  const num = Number.parseInt(val, 10);
  if(Number.isNaN(num)){
    return fallback;
  }
  return num;
}

const getDay = (now = new Date()) => {
  const actualDate = new Date(now);
  const d = new Date(actualDate.getFullYear(), actualDate.getMonth(), actualDate.getDate(), 0, 0, 0, 0);
  return d;
}

const Input = ({id, label, ...rest}) => {
  return (<>
    <label htmlFor={id}>{label}</label>
    <input id={id} {...rest} />
  </>);
}

function serializeItem(config = {}, obj = {}){
  const defaultConf = {
    serializerFn: (a) => a
  }
  return Object.entries(obj)
    .map(([key, val]) => [key, (config[key] || defaultConf).serializerFn(val)])
    .filter(([key, value]) => value)
    .reduce((acc, [key, value]) => ({...acc, [key]: value}), {});
}

function parseItem(config = {}, obj = {}){
  const defaultConf = {
    parserFn: (a) => a,
    defaultValue: (key, val, nonDefaulted) => val,
  }
  const nonDefaulted = Object.entries({
    ...getKeyedItem(config),
    ...obj
  }).map(([key, val]) => [key, (config[key] || defaultConf).parserFn(val)]).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
  console.log(nonDefaulted);
  return Object.entries(nonDefaulted).map(([key, val]) => ([key, typeof val === 'undefined' ? (config[key] || defaultConf).defaultValue(key, val, nonDefaulted) : val])).reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
}

function getKeyedItem(obj){
  return Object.keys(obj).reduce((acc, key) => ({ ...acc, [key]: undefined }), {})
}

function equalShallow(a, b) {
  for (const key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      return false;
    }
  }
  for (const key in b) {
    if (!(key in a) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

const useQueryStore = (config) => {
  const router = useRouter();
  const initial = parseItem(config, );
  const [val, setVal] = useState(initial);
  const firstSetVal = useRef(true);
  const firstReqplaceUrl = useRef(true);

  const setData = (data) => {
    setVal({
      ...val,
      ...data,
    })
  }

  useEffect(() => {
    if (firstSetVal.current){
      firstSetVal.current = false;
      return;
    }
    console.log(router.query, serializeItem(config, val), !equalShallow(router.query, serializeItem(config, val)), 'SetVal')
    if (!equalShallow(router.query, serializeItem(config, val))) {
      console.log('Setting VAL')
      setData(parseItem(config, router.query));
    }
  }, [router.query])

  useEffect(() => {
    if(firstReqplaceUrl.current){
      firstReqplaceUrl.current = false;
      return;
    }
    const item = serializeItem(config, val);
    console.log(router.query, item, !equalShallow(router.query, item), 'Replace Url')
    if (!equalShallow(router.query, item)){
      console.log('Router Replace URl')
      router.replace({ pathname: router.pathname, query: item }, undefined, { shallow: true });
    }
  }, [val]);


  return [val, setData];
}

const numberConf = {
  parserFn: (a) => typeof a === 'undefined' ? undefined : getNum(a),
  serializerFn: (n) => n ? stringify(n) : undefined,
  defaultValue: (key, val, nonDefaulted) => {
    console.log(key, nonDefaulted)
    if (!isValid(nonDefaulted.start) || !isValid(nonDefaulted.end)){
      console.log('NOT VALID!')
      return 0;
    }
    const optimal = getOptimizedDiff(nonDefaulted.start, nonDefaulted.end);
    return optimal[key];
  },
}
const endDateConf = {
  parserFn: (d) => d ? getDay(d) : undefined,
  serializerFn: (d) => isValid(d) ? formatDay(d) : undefined,
  defaultValue: (key, val, nonDefaulted) => {
    if (!isValid(nonDefaulted.start)){
      return undefined;
    }
    const endDate = addWeeks(add(nonDefaulted.start, {
      years: nonDefaulted.year||0,
      months: nonDefaulted.months || 0,
      days: nonDefaulted.days || 0,
    }), nonDefaulted.weeks || 0);
    console.log({endDate, start: nonDefaulted.start})
    return endDate;
  },
}

const startDateConf = {
  parserFn: (d) => d ? getDay(d) : undefined,
  serializerFn: (d) => isValid(d) ? formatDay(d) : undefined,
  defaultValue: (key, val, nonDefaulted) => {
    if(!isValid(nonDefaulted.end)){
      return getDay();
    }
    const startDate = subWeeks(sub(nonDefaulted.end, {
      years: nonDefaulted.year || 0,
      months: nonDefaulted.months || 0,
      days: nonDefaulted.days || 0,
    }), nonDefaulted.weeks || 0);
    console.log({startDate});
    return startDate;
  },
}

export default function Example() {
  const [data, setData] = useQueryStore({
    start: startDateConf,
    end: endDateConf,
    years: numberConf,
    months: numberConf,
    weeks: numberConf,
    days: numberConf,
  });

  const handleResultDayClick = (day) => {
    setData(getOptimizedDiff(getDay(data.start), getDay(day)));
  }

  const handleStartDayClick = (day) => {
    setData({
      start: getDay(day),
      end: addWeeks(add(day, {
        years: data.years,
        months: data.months,
        days: data.days,
      }), data.weeks)
    })
  }

  const handleInputChange = (key) => (e) =>  {
    const {value} = e.target;
    setData({
      [key]: value,
      end: addWeeks(add(data.start, {
        ...data,
        [key]: value
      }), key === 'weeks' ? value : data.weeks),
    })
  }

  console.log(data.start);
  console.log(data.end);

  return (
  <>
    <h1>Date Calculator</h1>
    <div>
        <h2>Calculation</h2>
        <div>
          <Input id="year" label="Years" type="number" value={data.years} onChange={handleInputChange('years')} />
          <Input id="month" label="Months" type="number" value={data.months} onChange={handleInputChange('months')} />
          <Input id="week" label="Weeks" type="number" value={data.weeks} onChange={handleInputChange('weeks')} />
          <Input id="day" label="Days" type="number" value={data.days} onChange={handleInputChange('days')} />
        </div>
        <div>
          <h3>Start</h3>
          <DayPicker
            month={data.start}
            firstDayOfWeek={1}
            selectedDays={data.start}
            onDayClick={handleStartDayClick}
            onTodayButtonClick={handleStartDayClick}
            showOutsideDays
            showWeekNumbers
            fixedWeeks
            todayButton="Set Today"
          />
          <h4>{formatDay(data.start)}</h4>
        </div>
        <div>
          <h3>End</h3>
          <DayPicker
            month={data.end}
            firstDayOfWeek={1}
            selectedDays={data.end}
            onDayClick={handleResultDayClick}
            onTodayButtonClick={handleResultDayClick}
            showOutsideDays
            showWeekNumbers
            fixedWeeks
            todayButton="Set Today"
          />
          <h4>{formatDay(data.end)}</h4>
        </div>
    </div>
    <div>
      <h2>Result</h2>
        <p>Start: {formatDay(data.start) }</p>
        <p>End: {formatDay(data.end)}</p>
        <p>Days: {formatNumber(differenceInDays(data.end, data.start))}</p>
        <p>Weeks: {formatNumber(differenceInWeeks(data.end, data.start))}</p>
        <p>Months: {formatNumber(differenceInMonths(data.end, data.start))}</p>
        <p>Years: {formatNumber(differenceInYears(data.end, data.start))}</p>
        <p>Hours: {formatNumber(differenceInHours(data.end, data.start))}</p>
        <p>Minutes: {formatNumber(differenceInMinutes(data.end, data.start))}</p>
        <p>Seconds: {formatNumber(differenceInSeconds(data.end, data.start))}</p>

    </div>
  </>
  );
}