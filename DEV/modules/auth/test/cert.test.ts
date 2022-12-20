import { describe, expect, test } from '@jest/globals';
import { init, readCert } from '../src/actions';

describe("Auth Module", () => {

    test("Test Cert", async () => {
        await init("AUTH-TEST");
        const cert = await readCert("G:\\dev\\budder\\budderAPI\\DEV\\modules\\auth\\workdir\\cert\\test.pem")
        
        expect(cert).toBeDefined();
    });
    
});
    