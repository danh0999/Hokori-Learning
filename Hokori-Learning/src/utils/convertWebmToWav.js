// ================================
// Convert WebM → WAV (Dynamic Import for Vite)
// ================================

let ffmpegInstance = null;

export const convertWebmToWav = async (webmBlob) => {
  // Dynamic import (fix export lỗi ở Vite)
  const { createFFmpeg, fetchFile } = await import("@ffmpeg/ffmpeg");

  if (!ffmpegInstance) {
    ffmpegInstance = createFFmpeg({
      log: false,
      corePath: "/node_modules/@ffmpeg/core/dist/ffmpeg-core.js",
    });
  }

  if (!ffmpegInstance.isLoaded()) {
    await ffmpegInstance.load();
  }

  ffmpegInstance.FS("writeFile", "input.webm", await fetchFile(webmBlob));

  await ffmpegInstance.run(
    "-i",
    "input.webm",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-sample_fmt",
    "s16",
    "output.wav"
  );

  const wavData = ffmpegInstance.FS("readFile", "output.wav");

  return new Blob([wavData.buffer], { type: "audio/wav" });
};
