import { Methods } from "./libs/methods";

export type Route = {
    type: string | Methods,
    route: string,
    path?: string,
    callback?(req?: any, res?: any, next?: any): any,
}

type Range<N extends number, M extends number> = number & { ___brand: [N, M] };

type Port = Range<0, 65535>;

export type Host = string

export type ServerConfig = {
    host: Host,
    port: Port,
}
