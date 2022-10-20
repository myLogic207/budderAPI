export type Command = {
    name: string,
    action: (args: string[]) => any,
    details?: {
        invoke: string,
        args: [[string, string]]
        description?: string,
        examples?: string | string[]
    }    
}