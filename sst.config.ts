import { SSTConfig } from "sst";
import { TwimagineStack } from "./stacks/TwimagineStack";

export default {
    config(_input) {
        return {
            name: "twimagine",
            region: "us-east-1",
        };
    },
    stacks(app) {
        app.stack(TwimagineStack);
    }
} satisfies SSTConfig;
