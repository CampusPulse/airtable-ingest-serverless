import { createRouteHandler } from "uploadthing/server";
// import type { VercelRequest, VercelResponse } from '@vercel/node'

import { createUploadthing, type FileRouter } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
	/**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
    image: {
      maxFileSize: "4MB",
      maxFileCount: 2,
	
    },
  }).onUploadComplete((data) => {
    console.log("upload completed", data);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;


const handler = createRouteHandler({
  router: uploadRouter,
  config: { 
    token: process.env.UPLOADTHING_TOKEN,
  },
});
export default handler;