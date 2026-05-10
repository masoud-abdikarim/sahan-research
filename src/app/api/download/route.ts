import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = req.nextUrl.searchParams.get("url");
    const filename = req.nextUrl.searchParams.get("filename") || "download.pdf";

    if (!url) {
      return NextResponse.json({ message: "URL parameter is required" }, { status: 400 });
    }

    // Fetch the file from the external URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from remote URL: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const blob = await response.blob();

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Download proxy error:", error);
    return NextResponse.json({ message: "Failed to process download", error: error.message }, { status: 500 });
  }
}
