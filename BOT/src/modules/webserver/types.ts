export type Route = {
    type: method,
    route: string,
    path?: string,
    callback?: (req?: any, res?: any, next?: any) => any,
}

type method = "static" | "get" | "post" | "put" | "delete";

type Range<N extends number, M extends number> = number & { ___brand: [N, M] };

type Port = Range<0, 65535>;

export type Host = string

export type ServerConfig = {
    host: Host,
    port: Port,
}