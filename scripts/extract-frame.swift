import Foundation
import AVFoundation
import CoreGraphics
import ImageIO

guard CommandLine.arguments.count >= 3 else {
    fputs("Usage: extract-frame <video-file> <output-image> [timestamp]\n", stderr)
    exit(1)
}

let inputPath = CommandLine.arguments[1]
let outputPath = CommandLine.arguments[2]
let timeSeconds = CommandLine.arguments.count >= 4 ? (Double(CommandLine.arguments[3]) ?? 1.0) : 1.0

let fileUrl = URL(fileURLWithPath: inputPath)
let asset = AVURLAsset(url: fileUrl)
let duration = CMTimeGetSeconds(asset.duration)

let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.maximumSize = CGSize(width: 1920, height: 1080)

let targetTime = CMTime(seconds: min(max(timeSeconds, 0.5), max(duration - 0.5, 0.5)), preferredTimescale: 600)

do {
    let cgImage = try generator.copyCGImage(at: targetTime, actualTime: nil)
    let outUrl = URL(fileURLWithPath: outputPath) as CFURL
    guard let destination = CGImageDestinationCreateWithURL(outUrl, "public.jpeg" as CFString, 1, nil) else {
        fputs("Failed to create CGImageDestination\n", stderr)
        exit(2)
    }
    let options: [CFString: Any] = [
        kCGImageDestinationLossyCompressionQuality: 0.85
    ]
    CGImageDestinationAddImage(destination, cgImage, options as CFDictionary)
    guard CGImageDestinationFinalize(destination) else {
        fputs("Failed to write image\n", stderr)
        exit(3)
    }
    print(String(format: "{\"duration\":%.2f,\"width\":%d,\"height\":%d}", duration, cgImage.width, cgImage.height))
} catch {
    fputs("Error extracting frame: \(error.localizedDescription)\n", stderr)
    exit(4)
}
