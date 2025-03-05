import { uploadRouter } from "../uploadthing-router";
import { createRouteHandler } from "uploadthing/server";

const handler = createRouteHandler({
  router: uploadRouter,
  config: { 
    token: process.env.UPLOADTHING_TOKEN,
  },
});
export default handler;