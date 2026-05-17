import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getSession } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  courseImageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session || session.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }
      return { userId: session.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  videoUploader: f({ video: { maxFileSize: "2GB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      
      if (!session || session.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }

      return { userId: session.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  audioUploader: f({ audio: { maxFileSize: "256MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session || session.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }
      return { userId: session.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Audio upload complete for userId:", metadata.userId);
      console.log("Audio File URL:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  certificateUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getSession();
      if (!session || session.role !== "ADMIN") {
        throw new Error("Unauthorized");
      }
      return { userId: session.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
