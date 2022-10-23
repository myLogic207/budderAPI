import { LogConfig } from '../types';

export type _LogLevel = {def: string, value: number};

// 2022-10-08 16:37:17.326
// type d1 = 0 | 1;
// type d2 = d1 | 2
// type d3 = d2 | 3;
// type d5 = d3 | 4 | 5;
// type d8 = d5 | 6 | 7 | 8;
// type d9 = d8 | 9;

// type day = `${d1}${d8}` | `2${d8}` | `3${d}`;
// type month = d9 | `1${d2}`;
// type year = `202${d9}`
// type hour = `${d2}${d9}`
// type minute = `${d5}${d9}`
// type second = `${d5}${d9}`
// type millisecond = `${d9}${d9}${d9}`
// type date = `${year}-${month}`
// type time = `${hour}:${minute}`

// let regexp: RegExp = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]/;

export type LogTime = any;

export interface eLogConfig extends LogConfig {
    eLogEnabled: boolean;
    logFileDest: string;
    json: boolean;
}
