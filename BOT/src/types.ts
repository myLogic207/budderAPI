export type ValueOf<T> = T[keyof T];

export type Scope = {
    name: string,
}

export type Module = {
    name: any
}

export type Bootconfig = {
    env?: string,
}