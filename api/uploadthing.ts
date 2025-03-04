import { uploadRouter } from "../uploadthing-router";
import { createRouteHandler } from "uploadthing/server";

export const handler = createRouteHandler({
  router: uploadRouter,
  config: { 
    token: process.env.UPLOADTHING_TOKEN,
  },
});