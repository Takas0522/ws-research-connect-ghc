# Office ファイル解析リファレンス（OpenXML SDK）

OpenXML SDK (`DocumentFormat.OpenXml 3.2.0`) を使用して Office ファイルの内容をテキスト/Markdown 形式に変換する。

## NuGet パッケージ

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"
```

## Word ファイル解析（.docx）

段落テキスト・見出し・テーブルを Markdown に変換する。

```csharp
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

string AnalyzeWord(string path)
{
    var sb = new StringBuilder();
    using var doc = WordprocessingDocument.Open(path, false);
    var body = doc.MainDocumentPart.Document.Body;

    // 段落・見出し抽出
    foreach (var para in body.Elements<Paragraph>())
    {
        var text = para.InnerText;
        if (string.IsNullOrWhiteSpace(text)) continue;

        var styleId = para.ParagraphProperties?.ParagraphStyleId?.Val?.Value;
        if (styleId != null && styleId.StartsWith("Heading"))
        {
            var level = styleId.Replace("Heading", "");
            var prefix = new string('#', int.TryParse(level, out var l) ? l + 1 : 2);
            sb.AppendLine($"{prefix} {text}");
        }
        else
        {
            sb.AppendLine(text);
        }
        sb.AppendLine();
    }

    // テーブル抽出 → Markdown テーブル
    foreach (var table in body.Elements<Table>())
    {
        var rows = table.Elements<TableRow>().ToList();
        if (rows.Count == 0) continue;
        var header = rows.First().Elements<TableCell>().Select(c => c.InnerText).ToList();
        sb.AppendLine("| " + string.Join(" | ", header) + " |");
        sb.AppendLine("| " + string.Join(" | ", header.Select(_ => "---")) + " |");
        foreach (var row in rows.Skip(1))
            sb.AppendLine("| " + string.Join(" | ", row.Elements<TableCell>().Select(c => c.InnerText)) + " |");
        sb.AppendLine();
    }

    return sb.ToString();
}
```

## Excel ファイル解析（.xlsx）

シートごとにデータを Markdown テーブルとして出力する。SharedStringTable を使用して文字列セルを正しく解決する。

```csharp
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;

string AnalyzeExcel(string path)
{
    var sb = new StringBuilder();
    using var spreadsheet = SpreadsheetDocument.Open(path, false);
    var wbPart = spreadsheet.WorkbookPart;
    var sst = wbPart.GetPartsOfType<SharedStringTablePart>()
        .FirstOrDefault()?.SharedStringTable;

    foreach (var sheet in wbPart.Workbook.Sheets.Elements<Sheet>())
    {
        sb.AppendLine($"### シート: {sheet.Name}");
        sb.AppendLine();
        var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id);
        var rows = wsPart.Worksheet.GetFirstChild<SheetData>()
            .Elements<Row>().ToList();
        if (rows.Count == 0) { sb.AppendLine("（空）"); continue; }

        var headerVals = CellValues(rows.First(), sst);
        sb.AppendLine("| " + string.Join(" | ", headerVals) + " |");
        sb.AppendLine("| " + string.Join(" | ", headerVals.Select(_ => "---")) + " |");
        foreach (var row in rows.Skip(1))
        {
            var vals = CellValues(row, sst);
            while (vals.Count < headerVals.Count) vals.Add("");
            sb.AppendLine("| " + string.Join(" | ", vals.Take(headerVals.Count)) + " |");
        }
        sb.AppendLine();
    }

    return sb.ToString();
}

List<string> CellValues(Row row, SharedStringTable sst)
{
    return row.Elements<Cell>().Select(c =>
    {
        var v = c.CellValue?.Text ?? "";
        if (c.DataType?.Value == CellValues.SharedString && sst != null)
            v = sst.ElementAt(int.Parse(v)).InnerText;
        return v;
    }).ToList();
}
```

## PowerPoint ファイル解析（.pptx）

スライドごとにテキスト・テーブル・発表者ノートを抽出する。

```csharp
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Presentation;
using D = DocumentFormat.OpenXml.Drawing;

string AnalyzePptx(string path)
{
    var sb = new StringBuilder();
    var doc = PresentationDocument.Open(path, false);
    var pp = doc.PresentationPart;
    int n = 0;

    foreach (var slideId in pp.Presentation.SlideIdList.Elements<SlideId>())
    {
        n++;
        var sp = (SlidePart)pp.GetPartById(slideId.RelationshipId);
        sb.AppendLine($"### スライド {n}");
        sb.AppendLine();

        // テキスト抽出
        foreach (var shape in sp.Slide.CommonSlideData.ShapeTree.Elements<Shape>())
        {
            var tb = shape.TextBody;
            if (tb == null) continue;
            var text = string.Join("\n", tb.Elements<D.Paragraph>()
                .Select(p => string.Join("",
                    p.Elements<D.Run>().Select(r => r.Text?.Text ?? ""))));
            if (!string.IsNullOrWhiteSpace(text))
            {
                sb.AppendLine(text);
                sb.AppendLine();
            }
        }

        // テーブル抽出
        foreach (var gf in sp.Slide.CommonSlideData.ShapeTree.Elements<GraphicFrame>())
        {
            var table = gf.Descendants<D.Table>().FirstOrDefault();
            if (table == null) continue;
            var tRows = table.Elements<D.TableRow>().ToList();
            if (tRows.Count == 0) continue;
            var hdr = tRows.First().Elements<D.TableCell>()
                .Select(c => c.InnerText).ToList();
            sb.AppendLine("| " + string.Join(" | ", hdr) + " |");
            sb.AppendLine("| " + string.Join(" | ", hdr.Select(_ => "---")) + " |");
            foreach (var tr in tRows.Skip(1))
                sb.AppendLine("| " + string.Join(" | ",
                    tr.Elements<D.TableCell>().Select(c => c.InnerText)) + " |");
            sb.AppendLine();
        }

        // 発表者ノート
        var notesPart = sp.NotesSlidePart;
        if (notesPart != null)
        {
            var notesText = string.Join("\n",
                notesPart.NotesSlide.CommonSlideData.ShapeTree
                    .Descendants<D.Paragraph>()
                    .Select(p => string.Join("",
                        p.Elements<D.Run>().Select(r => r.Text?.Text ?? "")))
                    .Where(t => !string.IsNullOrWhiteSpace(t)));
            if (!string.IsNullOrWhiteSpace(notesText))
            {
                sb.AppendLine($"> **ノート:** {notesText}");
                sb.AppendLine();
            }
        }
    }

    doc.Dispose();
    return sb.ToString();
}
```

## テキスト/その他ファイル

```csharp
string AnalyzeTextFile(string path)
{
    var ext = Path.GetExtension(path).ToLowerInvariant();
    return ext switch
    {
        ".txt" or ".md" or ".csv" or ".json" or ".xml"
            => $"```\n{File.ReadAllText(path)}\n```",
        ".pdf"
            => "（PDF — `#r \"nuget: UglyToad.PdfPig, 0.1.8\"` で抽出可能）",
        _ => $"（未対応の形式: {ext}）"
    };
}
```

## 拡張子→解析関数のディスパッチ

```csharp
var ext = Path.GetExtension(fileName).ToLowerInvariant();
string analysis = ext switch
{
    ".docx" => AnalyzeWord(localPath),
    ".xlsx" => AnalyzeExcel(localPath),
    ".pptx" => AnalyzePptx(localPath),
    ".txt" or ".md" or ".csv" => File.ReadAllText(localPath),
    _ => $"（未対応の形式: {ext}）"
};
```

## dotnet-script での注意事項

- `using var` はトップレベルでは使えない。`var x = ...` + 最後に `x.Dispose()` を使用
- NuGet パッケージの初回ダウンロードに時間がかかる場合がある
- 大きなファイルの OpenXML 解析はメモリを消費する。不要なパーツは早めに Dispose する
