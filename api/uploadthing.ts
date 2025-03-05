import { env } from "process";
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
    return {
      name: data.file.name,
      url: data.file.ufsUrl
    }
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;


const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', env.NODE_ENV == "production"? 'report.campuspulse.app' : "*")
  // another common pattern
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Uploadthing-Package, X-Uploadthing-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = allowCors(createRouteHandler({
  router: uploadRouter,
  config: { 
    token: process.env.UPLOADTHING_TOKEN,
  },
}));
export default handler;