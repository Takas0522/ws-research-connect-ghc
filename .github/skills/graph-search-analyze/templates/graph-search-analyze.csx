#r "nuget: Microsoft.Identity.Client, 4.67.2"
#r "nuget: Microsoft.Identity.Client.Extensions.Msal, 4.67.2"
#r "nuget: DocumentFormat.OpenXml, 3.2.0"

using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Identity.Client;
using Microsoft.Identity.Client.Extensions.Msal;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml.Presentation;
using D = DocumentFormat.OpenXml.Drawing;

// ╔════════════════════════════════════════════════════════════════╗
// ║  Graph Search & ファイル解析 統合スクリプト                      ║
// ║                                                                ║
// ║  使い方: dotnet-script graph-search-analyze.csx -- "テーマ"     ║
// ╚════════════════════════════════════════════════════════════════╝

// ── 設定 ──
var clientId = Environment.GetEnvironmentVariable("AZURE_CLIENT_ID")
    ?? "fd4af61a-26c4-420c-b734-674c1bd7f7e0";
var tenantId = Environment.GetEnvironmentVariable("AZURE_TENANT_ID")
    ?? "e1326d84-ff3c-4d3f-9619-541d59b25a39";
var scopes = new[] { "Files.Read.All", "Sites.Read.All", "ChannelMessage.Read.All", "Chat.Read", "User.Read" };
var theme = Args.Count > 0 ? Args[0] : "検索テーマ";
var outputDir = "/temp/docs";
Directory.CreateDirectory(outputDir);

// ╔═══════════════════════╗
// ║  1. 認証               ║
// ╚═══════════════════════╝
Console.WriteLine($"=== テーマ「{theme}」の検索を開始 ===\n");

var pca = PublicClientApplicationBuilder
    .Create(clientId)
    .WithAuthority($"https://login.microsoftonline.com/{tenantId}")
    .Build();

var cacheDir = Path.Combine(
    Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
    ".m365-comm", "cache");
Directory.CreateDirectory(cacheDir);

var storageProps = new StorageCreationPropertiesBuilder("msal_cache_search.bin", cacheDir)
    .WithUnprotectedFile()
    .Build();
var cacheHelper = await MsalCacheHelper.CreateAsync(storageProps);
cacheHelper.RegisterCache(pca.UserTokenCache);

AuthenticationResult authResult;
try
{
    var accounts = await pca.GetAccountsAsync();
    authResult = await pca.AcquireTokenSilent(scopes, accounts.FirstOrDefault()).ExecuteAsync();
    Console.WriteLine("✓ キャッシュからトークン取得");
}
catch (MsalUiRequiredException)
{
    Console.WriteLine("デバイスコードフローで認証...");
    authResult = await pca.AcquireTokenWithDeviceCode(scopes, cb =>
    {
        Console.WriteLine(cb.Message);
        return Task.CompletedTask;
    }).ExecuteAsync();
    Console.WriteLine("✓ 認証成功");
}

var client = new HttpClient();
client.DefaultRequestHeaders.Authorization =
    new AuthenticationHeaderValue("Bearer", authResult.AccessToken);

// ╔═══════════════════════╗
// ║  2. Graph Search       ║
// ╚═══════════════════════╝
Console.WriteLine($"\n--- ファイル検索: {theme} ---");

var searchReq = new
{
    requests = new object[]
    {
        new
        {
            entityTypes = new[] { "driveItem" },
            query = new { queryString = theme },
            from = 0,
            size = 25
        }
    }
};

var searchResp = await client.PostAsync(
    "https://graph.microsoft.com/v1.0/search/query",
    new StringContent(JsonSerializer.Serialize(searchReq), Encoding.UTF8, "application/json"));
var searchBody = await searchResp.Content.ReadAsStringAsync();

var files = new List<(string Id, string Name, string WebUrl, string DriveId)>();

if (searchResp.IsSuccessStatusCode)
{
    using var jDoc = JsonDocument.Parse(searchBody);
    foreach (var val in jDoc.RootElement.GetProperty("value").EnumerateArray())
    {
        foreach (var container in val.GetProperty("hitsContainers").EnumerateArray())
        {
            if (!container.TryGetProperty("hits", out var hits)) continue;
            foreach (var h in hits.EnumerateArray())
            {
                var res = h.GetProperty("resource");
                var id = res.GetProperty("id").GetString() ?? "";
                var name = res.TryGetProperty("name", out var n) ? n.GetString() ?? "" : "";
                var webUrl = res.TryGetProperty("webUrl", out var w) ? w.GetString() ?? "" : "";
                var driveId = "";
                if (res.TryGetProperty("parentReference", out var pr)
                    && pr.TryGetProperty("driveId", out var did))
                    driveId = did.GetString() ?? "";

                files.Add((id, name, webUrl, driveId));
                Console.WriteLine($"  📄 {name}");
            }
        }
    }
}
else
{
    Console.WriteLine($"検索エラー: {searchResp.StatusCode}");
}

Console.WriteLine($"\n合計 {files.Count} 件のファイル\n");

// ╔═══════════════════════════════╗
// ║  3. ダウンロード＆解析         ║
// ╚═══════════════════════════════╝
var summaryBuilder = new StringBuilder();
summaryBuilder.AppendLine($"# テーマ「{theme}」関連ドキュメント分析");
summaryBuilder.AppendLine($"検索日時: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
summaryBuilder.AppendLine($"検出ファイル数: {files.Count}");
summaryBuilder.AppendLine();

var downloadDir = Path.Combine(outputDir, "downloads");
Directory.CreateDirectory(downloadDir);

foreach (var file in files)
{
    Console.WriteLine($"--- 解析中: {file.Name} ---");

    try
    {
        // ダウンロード
        var downloadUrl = $"https://graph.microsoft.com/v1.0/drives/{file.DriveId}/items/{file.Id}/content";
        var fileResp = await client.GetAsync(downloadUrl);
        if (!fileResp.IsSuccessStatusCode)
        {
            Console.WriteLine($"  ⚠ ダウンロード失敗: {fileResp.StatusCode}");
            continue;
        }
        var fileBytes = await fileResp.Content.ReadAsByteArrayAsync();
        var localPath = Path.Combine(downloadDir, file.Name);
        File.WriteAllBytes(localPath, fileBytes);
        Console.WriteLine($"  ↓ {fileBytes.Length:N0} bytes");

        // 拡張子ごとに解析
        var ext = Path.GetExtension(file.Name).ToLowerInvariant();
        string analysis = ext switch
        {
            ".docx" => AnalyzeWord(localPath),
            ".xlsx" => AnalyzeExcel(localPath),
            ".pptx" => AnalyzePptx(localPath),
            ".txt" or ".md" or ".csv" => $"```\n{File.ReadAllText(localPath)}\n```",
            _ => $"（未対応の形式: {ext}）"
        };

        // 個別ファイルの解析結果を保存
        var analysisFileName = Path.GetFileNameWithoutExtension(file.Name) + ".md";
        File.WriteAllText(Path.Combine(outputDir, analysisFileName), analysis);
        Console.WriteLine($"  ✓ 解析結果: {analysisFileName}");

        // サマリーに追加
        summaryBuilder.AppendLine($"## {file.Name}");
        summaryBuilder.AppendLine($"- URL: {file.WebUrl}");
        summaryBuilder.AppendLine($"- サイズ: {fileBytes.Length:N0} bytes");
        summaryBuilder.AppendLine();
        summaryBuilder.AppendLine(analysis);
        summaryBuilder.AppendLine("---");
        summaryBuilder.AppendLine();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"  ⚠ エラー: {ex.Message}");
        summaryBuilder.AppendLine($"## {file.Name}");
        summaryBuilder.AppendLine($"解析エラー: {ex.Message}");
        summaryBuilder.AppendLine();
    }
}

// ╔═══════════════════════╗
// ║  4. 結果保存           ║
// ╚═══════════════════════╝
File.WriteAllText(Path.Combine(outputDir, "summary.md"), summaryBuilder.ToString());
Console.WriteLine($"\n=== 完了 ===");
Console.WriteLine($"結果: {outputDir}/summary.md");
Console.WriteLine($"個別ファイル: {outputDir}/*.md");

// ────────────────────────────────────────
// 解析ヘルパー関数
// ────────────────────────────────────────

string AnalyzeWord(string path)
{
    var sb = new StringBuilder();
    using var doc = WordprocessingDocument.Open(path, false);
    var body = doc.MainDocumentPart.Document.Body;

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

string AnalyzeExcel(string path)
{
    var sb = new StringBuilder();
    using var spreadsheet = SpreadsheetDocument.Open(path, false);
    var wbPart = spreadsheet.WorkbookPart;
    var sst = wbPart.GetPartsOfType<SharedStringTablePart>().FirstOrDefault()?.SharedStringTable;

    foreach (var sheet in wbPart.Workbook.Sheets.Elements<Sheet>())
    {
        sb.AppendLine($"### シート: {sheet.Name}");
        sb.AppendLine();
        var wsPart = (WorksheetPart)wbPart.GetPartById(sheet.Id);
        var rows = wsPart.Worksheet.GetFirstChild<SheetData>().Elements<Row>().ToList();
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

        foreach (var shape in sp.Slide.CommonSlideData.ShapeTree.Elements<Shape>())
        {
            var tb = shape.TextBody;
            if (tb == null) continue;
            var text = string.Join("\n", tb.Elements<D.Paragraph>()
                .Select(p => string.Join("", p.Elements<D.Run>().Select(r => r.Text?.Text ?? ""))));
            if (!string.IsNullOrWhiteSpace(text))
            {
                sb.AppendLine(text);
                sb.AppendLine();
            }
        }

        foreach (var gf in sp.Slide.CommonSlideData.ShapeTree.Elements<GraphicFrame>())
        {
            var table = gf.Descendants<D.Table>().FirstOrDefault();
            if (table == null) continue;
            var tRows = table.Elements<D.TableRow>().ToList();
            if (tRows.Count == 0) continue;
            var hdr = tRows.First().Elements<D.TableCell>().Select(c => c.InnerText).ToList();
            sb.AppendLine("| " + string.Join(" | ", hdr) + " |");
            sb.AppendLine("| " + string.Join(" | ", hdr.Select(_ => "---")) + " |");
            foreach (var tr in tRows.Skip(1))
                sb.AppendLine("| " + string.Join(" | ", tr.Elements<D.TableCell>().Select(c => c.InnerText)) + " |");
            sb.AppendLine();
        }
    }

    doc.Dispose();
    return sb.ToString();
}
