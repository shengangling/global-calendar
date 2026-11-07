// 手机 / 网页用图标：铺满整个方块、不透明、无圆角（iOS 和安卓会自己裁圆角）
// 用法：swift tools/icon-full.swift 输出.png
import Cocoa
let S: CGFloat = 1024
let img = NSImage(size: NSSize(width: S, height: S))
img.lockFocus()
NSColor(srgbRed: 0.086, green: 0.094, blue: 0.11, alpha: 1).setFill(); NSRect(x: 0, y: 0, width: S, height: S).fill()
// 顶部日历页眉 + 两个装订孔（与 Mac App 图标同一设计，按满版比例放大）
NSColor(srgbRed: 0.72, green: 0.20, blue: 0.18, alpha: 1).setFill(); NSRect(x: 0, y: S - 190, width: S, height: 190).fill()
NSColor(white: 0.96, alpha: 0.9).setFill()
for x in [330.0, 694.0] { NSBezierPath(ovalIn: NSRect(x: x - 28, y: S - 125, width: 56, height: 56)).fill() }
func draw(_ s: String, _ font: NSFont, _ color: NSColor, _ cy: CGFloat) {
    let a: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: color]
    let sz = (s as NSString).size(withAttributes: a)
    (s as NSString).draw(at: NSPoint(x: (S - sz.width) / 2, y: cy - sz.height / 2), withAttributes: a)
}
draw("历", NSFont(name: "Songti SC Bold", size: 470) ?? .boldSystemFont(ofSize: 470), NSColor(white: 0.96, alpha: 1), 440)
draw("万 年 历", NSFont(name: "Songti SC", size: 88) ?? .systemFont(ofSize: 88), NSColor(white: 0.62, alpha: 1), 150)
img.unlockFocus()
let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: CommandLine.arguments[1]))
