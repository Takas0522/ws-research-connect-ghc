---
name: powerpoint-openxml
description: dotnet-scriptとOpenXML SDKを使用してPowerPointファイル(.pptx)の作成・読み込み・解析を行います。SVGで図表を生成しPNG画像としてスライドに挿入できます。
---

# PowerPoint操作スキル（OpenXML + SVG図表）

## 目的
dotnet-scriptを使用してC#スクリプトを実行し、OpenXML SDKでPowerPointファイル（.pptx）の作成、読み込み、解析を行います。
**SVGで図表（構成図、フローチャート、グラフ等）を作成し、PNG画像としてスライドに挿入します。**

## 前提条件

- `dotnet-script` がグローバルツールとしてインストール済みであること
- スクリプト内で以下のNuGetパッケージを参照すること:
  ```csharp
  #r "nuget: DocumentFormat.OpenXml, 3.2.0"
  #r "nuget: Svg.Skia, 2.0.0.4"
  #r "nuget: SkiaSharp, 3.116.1"
  #r "nuget: SkiaSharp.NativeAssets.Linux, 3.116.1"
  ```

## 動作ルール

1. 要求された操作に応じたC#スクリプト（`.csx`ファイル）を生成してください
2. スクリプトの先頭に必ずNuGetディレクティブを記述してください
3. **各スライドに1つ以上のSVG図表を挿入して、資料としてのクオリティを高めてください**
4. 実行後、PPTXファイルは自動修復・バリデーションされます。validationErrorsが空でない場合はスクリプトを修正して再実行してください

## SVG → PNG → PPTX パイプライン

### ステップ1: SVGヘルパー関数を定義

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"
#r "nuget: Svg.Skia, 2.0.0.4"
#r "nuget: SkiaSharp, 3.116.1"
#r "nuget: SkiaSharp.NativeAssets.Linux, 3.116.1"

using SkiaSharp;
using Svg.Skia;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using D = DocumentFormat.OpenXml.Drawing;

// SVG文字列をPNGバイト配列に変換（2倍解像度で高品質）
byte[] SvgToPng(string svgContent, int scale = 2)
{
    var skSvg = new SKSvg();
    skSvg.FromSvg(svgContent);
    var bounds = skSvg.Picture.CullRect;
    var w = (int)Math.Max(bounds.Width, 1) * scale;
    var h = (int)Math.Max(bounds.Height, 1) * scale;
    var surface = SKSurface.Create(new SKImageInfo(w, h));
    var canvas = surface.Canvas;
    canvas.Clear(SKColors.White);
    canvas.Scale(scale);
    canvas.DrawPicture(skSvg.Picture);
    var image = surface.Snapshot();
    var data = image.Encode(SKEncodedImageFormat.Png, 100);
    var bytes = data.ToArray();
    surface.Dispose();
    return bytes;
}

// PNG画像をスライドに挿入
void AddImageToSlide(SlidePart slidePart, byte[] pngBytes, long x, long y, long cx, long cy, string name)
{
    var imagePart = slidePart.AddImagePart(ImagePartType.Png);
    imagePart.FeedData(new MemoryStream(pngBytes));
    var relId = slidePart.GetIdOfPart(imagePart);
    var id = (uint)(slidePart.Slide.CommonSlideData.ShapeTree.ChildElements.Count + 1);

    var picture = new Picture(
        new NonVisualPictureProperties(
            new NonVisualDrawingProperties { Id = id, Name = name },
            new NonVisualPictureDrawingProperties(new D.PictureLocks { NoChangeAspect = true }),
            new ApplicationNonVisualDrawingProperties()),
        new BlipFill(
            new D.Blip { Embed = relId },
            new D.Stretch(new D.FillRectangle())),
        new ShapeProperties(
            new D.Transform2D(
                new D.Offset { X = x, Y = y },
                new D.Extents { Cx = cx, Cy = cy }),
            new D.PresetGeometry(new D.AdjustValueList()) { Preset = D.ShapeTypeValues.Rectangle }));

    slidePart.Slide.CommonSlideData.ShapeTree.Append(picture);
}
```

### ステップ2: SVG図表を作成

以下は代表的なSVGパターンです。内容に合わせてカスタマイズしてください。

#### アーキテクチャ構成図
```csharp
var archSvg = @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""600"" height=""250"">
  <rect x=""10"" y=""90"" width=""130"" height=""60"" rx=""8"" fill=""#4472C4""/>
  <text x=""75"" y=""125"" text-anchor=""middle"" fill=""white"" font-size=""13"">React Frontend</text>
  <rect x=""235"" y=""90"" width=""130"" height=""60"" rx=""8"" fill=""#ED7D31""/>
  <text x=""300"" y=""125"" text-anchor=""middle"" fill=""white"" font-size=""13"">ASP.NET Core</text>
  <rect x=""460"" y=""90"" width=""130"" height=""60"" rx=""8"" fill=""#70AD47""/>
  <text x=""525"" y=""125"" text-anchor=""middle"" fill=""white"" font-size=""13"">SQL Database</text>
  <line x1=""140"" y1=""120"" x2=""233"" y2=""120"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""231,115 241,120 231,125"" fill=""#555""/>
  <line x1=""365"" y1=""120"" x2=""458"" y2=""120"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""456,115 466,120 456,125"" fill=""#555""/>
</svg>";
```

#### プロセスフロー（横並び）
```csharp
var flowSvg = @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""600"" height=""120"">
  <rect x=""10"" y=""30"" width=""100"" height=""50"" rx=""25"" fill=""#4472C4""/>
  <text x=""60"" y=""60"" text-anchor=""middle"" fill=""white"" font-size=""12"">企画</text>
  <rect x=""150"" y=""30"" width=""100"" height=""50"" rx=""25"" fill=""#5B9BD5""/>
  <text x=""200"" y=""60"" text-anchor=""middle"" fill=""white"" font-size=""12"">設計</text>
  <rect x=""290"" y=""30"" width=""100"" height=""50"" rx=""25"" fill=""#ED7D31""/>
  <text x=""340"" y=""60"" text-anchor=""middle"" fill=""white"" font-size=""12"">開発</text>
  <rect x=""430"" y=""30"" width=""100"" height=""50"" rx=""25"" fill=""#70AD47""/>
  <text x=""480"" y=""60"" text-anchor=""middle"" fill=""white"" font-size=""12"">リリース</text>
  <line x1=""110"" y1=""55"" x2=""148"" y2=""55"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""146,50 156,55 146,60"" fill=""#555""/>
  <line x1=""250"" y1=""55"" x2=""288"" y2=""55"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""286,50 296,55 286,60"" fill=""#555""/>
  <line x1=""390"" y1=""55"" x2=""428"" y2=""55"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""426,50 436,55 426,60"" fill=""#555""/>
</svg>";
```

#### 横棒グラフ
```csharp
var barSvg = @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""500"" height=""250"">
  <text x=""10"" y=""20"" font-size=""14"" fill=""#333"" font-weight=""bold"">SaaSアプリ利用者数</text>
  <text x=""10"" y=""55"" font-size=""11"" fill=""#666"">Slack</text>
  <rect x=""80"" y=""40"" width=""350"" height=""22"" rx=""3"" fill=""#4472C4""/>
  <text x=""440"" y=""56"" font-size=""11"" fill=""#333"">350名</text>
  <text x=""10"" y=""95"" font-size=""11"" fill=""#666"">Teams</text>
  <rect x=""80"" y=""80"" width=""280"" height=""22"" rx=""3"" fill=""#ED7D31""/>
  <text x=""370"" y=""96"" font-size=""11"" fill=""#333"">280名</text>
  <text x=""10"" y=""135"" font-size=""11"" fill=""#666"">Zoom</text>
  <rect x=""80"" y=""120"" width=""200"" height=""22"" rx=""3"" fill=""#70AD47""/>
  <text x=""290"" y=""136"" font-size=""11"" fill=""#333"">200名</text>
  <text x=""10"" y=""175"" font-size=""11"" fill=""#666"">Notion</text>
  <rect x=""80"" y=""160"" width=""120"" height=""22"" rx=""3"" fill=""#FFC000""/>
  <text x=""210"" y=""176"" font-size=""11"" fill=""#333"">120名</text>
</svg>";
```

#### 円グラフ（ドーナツ）
```csharp
// SVGの円グラフはstroke-dasharrayで表現
var pieSvg = @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""300"" height=""300"" viewBox=""0 0 300 300"">
  <circle cx=""150"" cy=""150"" r=""100"" fill=""none"" stroke=""#4472C4"" stroke-width=""40""
    stroke-dasharray=""251.3 377"" stroke-dashoffset=""0"" transform=""rotate(-90 150 150)""/>
  <circle cx=""150"" cy=""150"" r=""100"" fill=""none"" stroke=""#ED7D31"" stroke-width=""40""
    stroke-dasharray=""188.5 440"" stroke-dashoffset=""-251.3"" transform=""rotate(-90 150 150)""/>
  <circle cx=""150"" cy=""150"" r=""100"" fill=""none"" stroke=""#70AD47"" stroke-width=""40""
    stroke-dasharray=""125.7 503"" stroke-dashoffset=""-439.8"" transform=""rotate(-90 150 150)""/>
  <text x=""150"" y=""155"" text-anchor=""middle"" font-size=""18"" fill=""#333"" font-weight=""bold"">利用状況</text>
  <rect x=""10"" y=""270"" width=""12"" height=""12"" fill=""#4472C4""/>
  <text x=""28"" y=""281"" font-size=""11"" fill=""#333"">業務系 40%</text>
  <rect x=""110"" y=""270"" width=""12"" height=""12"" fill=""#ED7D31""/>
  <text x=""128"" y=""281"" font-size=""11"" fill=""#333"">分析系 30%</text>
  <rect x=""210"" y=""270"" width=""12"" height=""12"" fill=""#70AD47""/>
  <text x=""228"" y=""281"" font-size=""11"" fill=""#333"">その他 20%</text>
</svg>";
```

### ステップ3: スライドに画像を挿入

```csharp
// SVGをPNGに変換してスライドに挿入
var archPng = SvgToPng(archSvg);
AddImageToSlide(slidePart, archPng, 1000000, 1800000, 10000000, 4000000, "ArchDiagram");
// x, y, cx, cy はEMU単位（1cm = 360000 EMU）
```

## PowerPointファイルの新規作成（完全テンプレート）

**注意**: Theme/SlideMaster/ColorMap は省略してもPptxRepairが自動修復します。
スライド内容とSVG図表の品質に注力してください。

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"
#r "nuget: Svg.Skia, 2.0.0.4"
#r "nuget: SkiaSharp, 3.116.1"
#r "nuget: SkiaSharp.NativeAssets.Linux, 3.116.1"

using SkiaSharp;
using Svg.Skia;
using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using D = DocumentFormat.OpenXml.Drawing;

// --- ヘルパー関数 ---
byte[] SvgToPng(string svgContent, int scale = 2)
{
    var skSvg = new SKSvg();
    skSvg.FromSvg(svgContent);
    var bounds = skSvg.Picture.CullRect;
    var w = (int)Math.Max(bounds.Width, 1) * scale;
    var h = (int)Math.Max(bounds.Height, 1) * scale;
    var surface = SKSurface.Create(new SKImageInfo(w, h));
    var canvas = surface.Canvas;
    canvas.Clear(SKColors.White);
    canvas.Scale(scale);
    canvas.DrawPicture(skSvg.Picture);
    var image = surface.Snapshot();
    var data = image.Encode(SKEncodedImageFormat.Png, 100);
    var bytes = data.ToArray();
    surface.Dispose();
    return bytes;
}

void AddImageToSlide(SlidePart sp, byte[] png, long x, long y, long cx, long cy, string name)
{
    var ip = sp.AddImagePart(ImagePartType.Png);
    ip.FeedData(new MemoryStream(png));
    var rid = sp.GetIdOfPart(ip);
    var id = (uint)(sp.Slide.CommonSlideData.ShapeTree.ChildElements.Count + 1);
    sp.Slide.CommonSlideData.ShapeTree.Append(new Picture(
        new NonVisualPictureProperties(
            new NonVisualDrawingProperties { Id = id, Name = name },
            new NonVisualPictureDrawingProperties(new D.PictureLocks { NoChangeAspect = true }),
            new ApplicationNonVisualDrawingProperties()),
        new BlipFill(new D.Blip { Embed = rid }, new D.Stretch(new D.FillRectangle())),
        new ShapeProperties(
            new D.Transform2D(new D.Offset { X = x, Y = y }, new D.Extents { Cx = cx, Cy = cy }),
            new D.PresetGeometry(new D.AdjustValueList()) { Preset = D.ShapeTypeValues.Rectangle })));
}

Shape MakeTextShape(uint id, string name, long x, long y, long cx, long cy, string text, int fontSize, bool bold = false)
{
    return new Shape(
        new NonVisualShapeProperties(
            new NonVisualDrawingProperties { Id = id, Name = name },
            new NonVisualShapeDrawingProperties(),
            new ApplicationNonVisualDrawingProperties()),
        new ShapeProperties(new D.Transform2D(
            new D.Offset { X = x, Y = y }, new D.Extents { Cx = cx, Cy = cy }),
            new D.PresetGeometry(new D.AdjustValueList()) { Preset = D.ShapeTypeValues.Rectangle }),
        new TextBody(
            new D.BodyProperties(), new D.ListStyle(),
            new D.Paragraph(new D.Run(
                new D.RunProperties { Language = "ja-JP", FontSize = fontSize, Bold = bold },
                new D.Text(text)))));
}

// --- PPTX作成 ---
var filePath = "企画書.pptx";
var doc = PresentationDocument.Create(filePath, PresentationDocumentType.Presentation);
var presPart = doc.AddPresentationPart();
presPart.Presentation = new Presentation(
    new SlideIdList(),
    new SlideSize { Cx = 12192000, Cy = 6858000 },
    new NotesSize { Cx = 6858000, Cy = 9144000 });

// --- スライド1: 表紙 ---
var sp1 = presPart.AddNewPart<SlidePart>();
sp1.Slide = new Slide(new CommonSlideData(new ShapeTree(
    new NonVisualGroupShapeProperties(
        new NonVisualDrawingProperties { Id = 1, Name = "" },
        new NonVisualGroupShapeDrawingProperties(),
        new ApplicationNonVisualDrawingProperties()),
    new GroupShapeProperties(new D.TransformGroup()),
    MakeTextShape(2, "Title", 1500000, 2000000, 9000000, 1200000, "プロジェクト企画書", 3600, true),
    MakeTextShape(3, "Subtitle", 1500000, 3500000, 9000000, 800000, "2025年度 新規アプリケーション開発", 2000))));
sp1.Slide.Save();

// --- スライド2: 構成図付き ---
var sp2 = presPart.AddNewPart<SlidePart>();
sp2.Slide = new Slide(new CommonSlideData(new ShapeTree(
    new NonVisualGroupShapeProperties(
        new NonVisualDrawingProperties { Id = 1, Name = "" },
        new NonVisualGroupShapeDrawingProperties(),
        new ApplicationNonVisualDrawingProperties()),
    new GroupShapeProperties(new D.TransformGroup()),
    MakeTextShape(2, "Title", 500000, 200000, 11000000, 700000, "システム構成", 2800, true))));

var archSvg = @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""600"" height=""200"">
  <rect x=""10"" y=""70"" width=""130"" height=""60"" rx=""8"" fill=""#4472C4""/>
  <text x=""75"" y=""105"" text-anchor=""middle"" fill=""white"" font-size=""13"">Frontend</text>
  <rect x=""235"" y=""70"" width=""130"" height=""60"" rx=""8"" fill=""#ED7D31""/>
  <text x=""300"" y=""105"" text-anchor=""middle"" fill=""white"" font-size=""13"">Backend API</text>
  <rect x=""460"" y=""70"" width=""130"" height=""60"" rx=""8"" fill=""#70AD47""/>
  <text x=""525"" y=""105"" text-anchor=""middle"" fill=""white"" font-size=""13"">Database</text>
  <line x1=""140"" y1=""100"" x2=""233"" y2=""100"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""231,95 241,100 231,105"" fill=""#555""/>
  <line x1=""365"" y1=""100"" x2=""458"" y2=""100"" stroke=""#555"" stroke-width=""2""/>
  <polygon points=""456,95 466,100 456,105"" fill=""#555""/>
</svg>";
AddImageToSlide(sp2, SvgToPng(archSvg), 1000000, 1500000, 10000000, 4000000, "Arch");
sp2.Slide.Save();

// --- スライドID登録 ---
var slideIdList = presPart.Presentation.GetFirstChild<SlideIdList>();
uint sid = 256;
foreach (var sp in presPart.SlideParts)
    slideIdList.Append(new SlideId { Id = sid++, RelationshipId = presPart.GetIdOfPart(sp) });
presPart.Presentation.Save();
doc.Dispose();

Console.WriteLine("Created: " + filePath);
```

## テーブル（表）の追加

テーブルはGraphicFrameとしてShapeTreeに追加します。

```csharp
var table = new D.Table();
table.Append(new D.TableProperties { FirstRow = true, BandRow = true });
table.Append(new D.TableGrid(
    new D.GridColumn { Width = 3000000 },
    new D.GridColumn { Width = 3000000 },
    new D.GridColumn { Width = 3000000 }));

var headerRow = new D.TableRow { Height = 370840 };
foreach (var h in new[] { "項目", "計画", "実績" })
{
    headerRow.Append(new D.TableCell(
        new D.TextBody(
            new D.BodyProperties(), new D.ListStyle(),
            new D.Paragraph(new D.Run(
                new D.RunProperties { Language = "ja-JP", Bold = true },
                new D.Text(h)))),
        new D.TableCellProperties()));
}
table.Append(headerRow);

var graphicFrame = new GraphicFrame(
    new NonVisualGraphicFrameProperties(
        new NonVisualDrawingProperties { Id = 4, Name = "Table" },
        new NonVisualGraphicFrameDrawingProperties(),
        new ApplicationNonVisualDrawingProperties()),
    new Transform(new D.Offset { X = 457200, Y = 1600200 }, new D.Extents { Cx = 9000000, Cy = 2000000 }),
    new D.Graphic(new D.GraphicData(table) { Uri = "http://schemas.openxmlformats.org/drawingml/2006/table" }));

// shapeTree.Append(graphicFrame);
```

## 読み込み・解析

既存PPTXのテキスト抽出:

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using D = DocumentFormat.OpenXml.Drawing;

var doc = PresentationDocument.Open("input.pptx", false);
var pp = doc.PresentationPart;
int n = 0;
foreach (var slideId in pp.Presentation.SlideIdList.Elements<SlideId>())
{
    n++;
    var sp = (SlidePart)pp.GetPartById(slideId.RelationshipId);
    Console.WriteLine($"=== Slide {n} ===");
    foreach (var shape in sp.Slide.CommonSlideData.ShapeTree.Elements<Shape>())
    {
        var tb = shape.TextBody;
        if (tb == null) continue;
        var text = string.Join("\n", tb.Elements<D.Paragraph>()
            .Select(p => string.Join("", p.Elements<D.Run>().Select(r => r.Text?.Text ?? ""))));
        if (!string.IsNullOrWhiteSpace(text))
            Console.WriteLine($"  {text}");
    }
}
doc.Dispose();
```

## EMU単位参照

| 単位 | EMU換算 | 例 |
|------|---------|-----|
| 1 cm | 360,000 | 10cm = 3,600,000 |
| 1 inch | 914,400 | |
| 16:9スライド | 12,192,000 x 6,858,000 | 標準ワイド |

## SVG配色ガイド（Office標準カラー）

| 色 | HEX | 用途 |
|----|------|------|
| Blue | #4472C4 | 主要・アクセント1 |
| Orange | #ED7D31 | アクセント2 |
| Gray | #A5A5A5 | アクセント3 |
| Yellow | #FFC000 | アクセント4 |
| Light Blue | #5B9BD5 | アクセント5 |
| Green | #70AD47 | アクセント6 |

## 注意事項

- **各スライドにSVG図表を1つ以上挿入** してビジュアルリッチな資料にしてください
- Theme/SlideMaster/ColorMap は省略してもOK（PptxRepairが自動修復します）
- `using var` はdotnet-scriptのトップレベルでは使えません。`var x = ...` + 最後に `x.Dispose()` を使ってください
- SVGは600x200〜600x300程度のサイズが読みやすいです
- NuGetパッケージの初回ダウンロードに時間がかかる場合があります
