import express from 'express';
// @ts-ignore
import appInstance from "../server/_core/index.ts";

const app = express();

// Use the exported app if it's already configured, or wrap it
export default (req: any, res: any) => {
    if (typeof appInstance === 'function') {
        return appInstance(req, res);
    }
    // Fallback for unexpected export structures
    return (appInstance as any).app(req, res);
};
