---
name: excel-openxml
description: dotnet-scriptとOpenXML SDKを使用してExcelファイル(.xlsx)の作成・読み込み・解析を行います
---

# Excel操作スキル（OpenXML）

## 目的
dotnet-scriptを使用してC#スクリプトを実行し、OpenXML SDKでExcelファイル（.xlsx）の作成、読み込み、解析を行います。

## 前提条件

- `dotnet-script` がグローバルツールとしてインストール済みであること
- スクリプト内で `#r "nuget: DocumentFormat.OpenXml, 3.2.0"` ディレクティブを使用してOpenXML SDKを参照すること

## 動作ルール

1. 要求された操作（作成・読み込み・解析）に応じたC#スクリプト（`.csx`ファイル）を生成してください
2. スクリプトの先頭に必ず `#r "nuget: DocumentFormat.OpenXml, 3.2.0"` を記述してください
3. `dotnet-script <スクリプトファイルパス>` でスクリプトを実行してください
4. 実行結果を確認し、成功した場合は結果を返却してください
5. エラーが発生した場合はエラー内容を確認し、スクリプトを修正して再実行してください

## 操作パターン

### 1. Excelファイルの新規作成

テーブルデータやレポートをExcelファイルとして作成します。

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"

using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;

var filePath = "output.xlsx";

using (var spreadsheet = SpreadsheetDocument.Create(filePath, SpreadsheetDocumentType.Workbook))
{
    var workbookPart = spreadsheet.AddWorkbookPart();
    workbookPart.Workbook = new Workbook();

    var worksheetPart = workbookPart.AddNewPart<WorksheetPart>();
    worksheetPart.Worksheet = new Worksheet(new SheetData());

    var sheets = workbookPart.Workbook.AppendChild(new Sheets());
    sheets.Append(new Sheet
    {
        Id = workbookPart.GetIdOfPart(worksheetPart),
        SheetId = 1,
        Name = "Sheet1"
    });

    var sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

    // ヘッダー行
    var headerRow = new Row();
    headerRow.Append(
        new Cell { DataType = CellValues.String, CellValue = new CellValue("名前") },
        new Cell { DataType = CellValues.String, CellValue = new CellValue("部署") },
        new Cell { DataType = CellValues.String, CellValue = new CellValue("売上") }
    );
    sheetData.Append(headerRow);

    // データ行
    var dataRow = new Row();
    dataRow.Append(
        new Cell { DataType = CellValues.String, CellValue = new CellValue("田中太郎") },
        new Cell { DataType = CellValues.String, CellValue = new CellValue("営業部") },
        new Cell { DataType = CellValues.Number, CellValue = new CellValue("1500000") }
    );
    sheetData.Append(dataRow);

    workbookPart.Workbook.Save();
}

Console.WriteLine($"Excel created: {filePath}");
```

### 2. Excelファイルの読み込み

既存のExcelファイルからデータを読み取ります。

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;

var filePath = "input.xlsx";

using (var spreadsheet = SpreadsheetDocument.Open(filePath, false))
{
    var workbookPart = spreadsheet.WorkbookPart;
    var sheet = workbookPart.Workbook.Sheets.Elements<Sheet>().First();
    var worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id);
    var sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();

    // SharedStringTableの取得（文字列セル用）
    var stringTable = workbookPart.GetPartsOfType<SharedStringTablePart>()
        .FirstOrDefault()?.SharedStringTable;

    foreach (var row in sheetData.Elements<Row>())
    {
        var values = new List<string>();
        foreach (var cell in row.Elements<Cell>())
        {
            string value = cell.CellValue?.Text ?? "";
            if (cell.DataType?.Value == CellValues.SharedString && stringTable != null)
            {
                value = stringTable.ElementAt(int.Parse(value)).InnerText;
            }
            values.Add(value);
        }
        Console.WriteLine(string.Join("\t", values));
    }
}
```

### 3. Excelファイルの解析

Excelファイルの構造やデータを分析し、統計情報やサマリーを生成します。

```csharp
#r "nuget: DocumentFormat.OpenXml, 3.2.0"

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;

var filePath = "data.xlsx";

using (var spreadsheet = SpreadsheetDocument.Open(filePath, false))
{
    var workbookPart = spreadsheet.WorkbookPart;

    // シート一覧の取得
    Console.WriteLine("=== シート一覧 ===");
    foreach (var sheet in workbookPart.Workbook.Sheets.Elements<Sheet>())
    {
        Console.WriteLine($"  - {sheet.Name} (ID: {sheet.Id})");
    }

    // 各シートのデータ情報
    foreach (var sheet in workbookPart.Workbook.Sheets.Elements<Sheet>())
    {
        var worksheetPart = (WorksheetPart)workbookPart.GetPartById(sheet.Id);
        var sheetData = worksheetPart.Worksheet.GetFirstChild<SheetData>();
        var rows = sheetData.Elements<Row>().ToList();

        Console.WriteLine($"\n=== {sheet.Name} ===");
        Console.WriteLine($"  行数: {rows.Count}");

        if (rows.Any())
        {
            var maxCols = rows.Max(r => r.Elements<Cell>().Count());
            Console.WriteLine($"  最大列数: {maxCols}");
        }
    }
}
```

## スタイル設定

Excelのセルスタイル（太字、背景色、罫線など）を設定する場合は、`Stylesheet` を使用します。

```csharp
// WorkbookPart に Stylesheet を追加
var stylesPart = workbookPart.AddNewPart<WorkbookStylesPart>();
stylesPart.Stylesheet = new Stylesheet(
    new Fonts(
        new Font(),  // 0: デフォルトフォント
        new Font(new Bold(), new FontSize { Val = 12 })  // 1: 太字フォント
    ),
    new Fills(
        new Fill(new PatternFill { PatternType = PatternValues.None }),  // 0: なし
        new Fill(new PatternFill { PatternType = PatternValues.Gray125 }),  // 1: グレー
        new Fill(new PatternFill(
            new ForegroundColor { Rgb = new HexBinaryValue("FFD9E1F2") }
        ) { PatternType = PatternValues.Solid })  // 2: 薄い青
    ),
    new Borders(new Border()),  // 0: デフォルト
    new CellFormats(
        new CellFormat(),  // 0: デフォルト
        new CellFormat { FontId = 1, FillId = 2, ApplyFont = true, ApplyFill = true }  // 1: ヘッダー用
    )
);

// セルにスタイルを適用
var styledCell = new Cell
{
    DataType = CellValues.String,
    CellValue = new CellValue("ヘッダー"),
    StyleIndex = 1  // CellFormats のインデックス
};
```

## 数式の設定

```csharp
// SUM関数の例
var formulaCell = new Cell
{
    CellReference = "D2",
    CellFormula = new CellFormula("SUM(A2:C2)")
};
```

## 注意事項

- OpenXMLはローレベルAPIのため、セル参照（A1, B2等）を明示的に管理する場合は `CellReference` を設定してください
- 大量データを書き込む場合は、SAX（OpenXmlWriter）アプローチの使用を検討してください
- SharedStringTable を使用すると、同一文字列の重複を排除してファイルサイズを削減できます
- 日付値はOADate形式（double）で格納し、NumberFormatId でフォーマットを指定してください
- dotnet-script実行時にNuGetパッケージの初回ダウンロードが発生するため、初回は時間がかかることがあります
